import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  MapPin,
  Globe2,
  Filter,
  Search,
  Sun,
  Wind,
  Building2,
  Download,
  BarChart3,
  Percent,
} from "lucide-react";

/**
 * Sima AI — Screen 09: City Atlas (Standalone)
 * - Lightweight SVG map of KSA (schematic outline) + interactive city markers (x/y in 0..100 map coords).
 * - Filters: region, min pass-rate, search; legend; side panel with city KPIs and style breakdown.
 * - i18n (AR/EN) + RTL; export JSON snapshot; Self-tests badge for i18n and color scale.
 * - No external APIs; all JSX closed; icons from stable lucide set only.
 */

// ——————————————————
// Auth (for consistency; not gating anything here)
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: ["projects.view", "reports.view"],
  [ROLES.CONSULTANT]: ["projects.view", "reports.view"],
  [ROLES.CLIENT]: ["projects.view"],
};
const AuthCtx = React.createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState({ email: "demo@studio.sa", role: ROLES.CONSULTANT });
  const setRole = (role) => setUser((u)=> (u? { ...u, role } : { email: "demo@studio.sa", role }));
  const can = (perm) => !!(user && PERMISSIONS[user.role]?.includes(perm));
  return <AuthCtx.Provider value={{ user, setRole, can }}>{children}</AuthCtx.Provider>;
}
function useAuth(){ return useContext(AuthCtx); }

// ——————————————————
// UI primitives
// ——————————————————
const Button = ({ children, className = "", variant = "solid", ...props }) => (
  <button
    className={
      "inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition " +
      (variant === "solid"
        ? "bg-slate-900 text-white hover:bg-slate-700 "
        : variant === "outline"
        ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
        : variant === "soft"
        ? "bg-slate-100 text-slate-900 hover:bg-slate-200 "
        : variant === "ghost"
        ? "bg-transparent text-slate-900 hover:bg-slate-100 "
        : "") + className
    }
    {...props}
  >{children}</button>
);
const Card = ({ className = "", children }) => (
  <div className={"rounded-3xl border border-slate-200 bg-white shadow-sm " + className}>{children}</div>
);
const Input = (props)=> <input className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" {...props}/>;
const Select = ({ options, ...props }) => (
  <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
    {options.map((o,i)=> <option key={i} value={o.value}>{o.label}</option>)}
  </select>
);
function Pill({ children, className = "" }){
  return <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] " + className}>{children}</span>;
}

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "أطلس المدن السعودية",
    subtitle: "نسب النجاح، الطرز، والمناخ لكل مدينة",
    role: "الدور",

    filters: "المرشحات",
    region: "المنطقة",
    allRegions: "كل المناطق",
    minPass: "أدنى نسبة نجاح",
    search: "بحث عن مدينة…",

    kpis: "مؤشرات المدينة",
    passRate: "نسبة النجاح",
    projects: "عدد المشاريع",
    styles: "توزيع الطرز",
    climate: "المناخ",
    identity: "الهوية",

    legend: "الأسطورة",
    low: "منخفض",
    high: "مرتفع",

    export: "تصدير JSON",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Saudi City Atlas",
    subtitle: "Pass rates, styles, and climate per city",
    role: "Role",

    filters: "Filters",
    region: "Region",
    allRegions: "All regions",
    minPass: "Min pass rate",
    search: "Search city…",

    kpis: "City KPIs",
    passRate: "Pass rate",
    projects: "Projects",
    styles: "Style mix",
    climate: "Climate",
    identity: "Identity",

    legend: "Legend",
    low: "Low",
    high: "High",

    export: "Export JSON",
  }
};

// ——————————————————
// Dataset (schematic positions x,y in 0..100)
// ——————————————————
const CITIES = [
  { id: 'riyadh', nameAr: 'الرياض', nameEn: 'Riyadh', region: 'Najd', x: 58, y: 45, pass: 78, projects: 124, climate: 'Hot arid', styles: { Najdi: 0.45, Contemporary: 0.35, Others: 0.2 } },
  { id: 'jeddah', nameAr: 'جدة', nameEn: 'Jeddah', region: 'Hijaz', x: 20, y: 58, pass: 72, projects: 98, climate: 'Coastal', styles: { Hijazi: 0.5, Contemporary: 0.3, Others: 0.2 } },
  { id: 'makkah', nameAr: 'مكة', nameEn: 'Makkah', region: 'Hijaz', x: 22, y: 62, pass: 75, projects: 86, climate: 'Hot arid', styles: { Hijazi: 0.56, Contemporary: 0.28, Others: 0.16 } },
  { id: 'madinah', nameAr: 'المدينة', nameEn: 'Madinah', region: 'Hijaz', x: 23, y: 45, pass: 81, projects: 91, climate: 'Hot arid', styles: { Hijazi: 0.52, Contemporary: 0.3, Others: 0.18 } },
  { id: 'dammam', nameAr: 'الدمام', nameEn: 'Dammam', region: 'Eastern', x: 90, y: 40, pass: 69, projects: 77, climate: 'Humid coastal', styles: { Eastern: 0.42, Contemporary: 0.4, Others: 0.18 } },
  { id: 'abha', nameAr: 'أبها', nameEn: 'Abha', region: 'Asir', x: 35, y: 85, pass: 84, projects: 54, climate: 'Highland mild', styles: { Asiri: 0.6, Contemporary: 0.25, Others: 0.15 } },
  { id: 'najran', nameAr: 'نجران', nameEn: 'Najran', region: 'Asir', x: 50, y: 92, pass: 67, projects: 41, climate: 'Hot arid', styles: { Southern: 0.5, Contemporary: 0.3, Others: 0.2 } },
  { id: 'hail', nameAr: 'حائل', nameEn: 'Hail', region: 'North', x: 48, y: 28, pass: 73, projects: 33, climate: 'Semi‑arid', styles: { Najdi: 0.48, Contemporary: 0.32, Others: 0.2 } },
  { id: 'alula', nameAr: 'العلا', nameEn: 'AlUla', region: 'North', x: 27, y: 35, pass: 88, projects: 26, climate: 'Semi‑arid', styles: { Hijazi: 0.44, Contemporary: 0.36, Others: 0.2 } },
];
const REGIONS = ["Najd","Hijaz","Eastern","Asir","North"];

// ——————————————————
// Helpers
// ——————————————————
function colorForRate(p){
  // 0..100 -> red(0) -> yellow(50) -> green(100)
  const clamped = Math.max(0, Math.min(100, p || 0));
  const hue = (clamped * 1.2); // 0..120
  return `hsl(${hue}, 70%, 45%)`;
}
function pct(n){ return Math.round((n||0) * 100); }

// ——————————————————
// Self-tests badge
// ——————————————————
function DevTestsBadge({ t }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.filters && !!t.legend });
  const c0 = colorForRate(0), c50 = colorForRate(50), c100 = colorForRate(100);
  const scaleOk = c0 !== c50 && c50 !== c100;
  tests.push({ name: "color scale", pass: scaleOk });
  const tip = tests.map(x => (x.pass? '✓ ':'× ') + x.name).join('\n');
  const all = tests.every(x=>x.pass);
  return (
    <div aria-live="polite" className="fixed bottom-3 left-3 z-50">
      <div className={("px-2.5 py-1.5 rounded-full text-[10px] ") + (all? "bg-emerald-600 text-white" : "bg-amber-500 text-black")} title={tip}>
        {all? "Tests: PASS" : "Tests: CHECK"}
      </div>
    </div>
  );
}

// ——————————————————
// Screen 09 — City Atlas
// ——————————————————
function CityAtlasScreen(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole } = useAuth();

  const [region, setRegion] = useState('all');
  const [minPass, setMinPass] = useState(0);
  const [q, setQ] = useState('');
  const [activeCity, setActiveCity] = useState(CITIES[0]);

  const filtered = useMemo(()=>{
    return CITIES.filter(c => (
      (region==='all' || c.region===region) &&
      (c.pass >= minPass) &&
      ((lang==='ar'? c.nameAr : c.nameEn).toLowerCase().includes(q.toLowerCase()))
    ));
  }, [region, minPass, q, lang]);

  function exportJSON(){
    const payload = { filter: { region, minPass, q }, cities: filtered };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_city_atlas.json'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div dir={rtl? 'rtl':'ltr'} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
      {/* Topbar */}
      <header className="px-6 md:px-10 py-5 sticky top-0 z-40 bg-[#f6f9ff]/80 backdrop-blur border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center shadow-sm"><Shield className="w-5 h-5 text-white"/></div>
            <div className="font-semibold text-slate-900">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang('ar')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='ar'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>عربي</button>
            <button onClick={()=>setLang('en')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='en'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>EN</button>
            <div className="w-px h-6 bg-slate-300 mx-2"/>
            <Select value={user?.role || ROLES.CONSULTANT} onChange={(e)=>setRole(e.target.value)} options={lang==='ar' ? [
              { value: ROLES.AUTHORITY, label: 'جهة اعتماد' },
              { value: ROLES.CONSULTANT, label: 'استشاري' },
              { value: ROLES.CLIENT, label: 'عميل' },
            ] : [
              { value: ROLES.AUTHORITY, label: 'Authority' },
              { value: ROLES.CONSULTANT, label: 'Consultant' },
              { value: ROLES.CLIENT, label: 'Client' },
            ]} />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-6 md:px-10 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-4">
          {/* Map */}
          <Card className="lg:col-span-8 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
                <p className="text-[12px] text-slate-600 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4"/> {t.export}</Button>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400"/>
                  <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t.search} className="pl-9"/>
                </div>
              </div>
              <Select value={region} onChange={(e)=>setRegion(e.target.value)} options={[{ value:'all', label:t.allRegions }, ...REGIONS.map(r=>({ value:r, label:r }))]} />
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-700 w-32">{t.minPass}: {minPass}%</label>
                <input type="range" min="0" max="100" value={minPass} onChange={(e)=>setMinPass(parseInt(e.target.value))} className="grow"/>
              </div>
            </div>

            <div className="mt-4 relative rounded-2xl border border-slate-200 overflow-hidden bg-white">
              <div className="aspect-[16/10]">
                {/* Schematic KSA outline (rough polygon) */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#eef2ff"/>
                      <stop offset="100%" stopColor="#e2e8f0"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="100" height="100" fill="url(#sea)" />
                  {/* rough country shape */}
                  <path d="M15,30 L30,20 L55,18 L85,35 L90,55 L70,80 L40,88 L25,75 L15,55 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />

                  {/* city markers */}
                  {filtered.map((c)=> (
                    <g key={c.id} transform={`translate(${c.x},${c.y})`} style={{ cursor: 'pointer' }} onClick={()=>setActiveCity(c)}>
                      <circle r={Math.max(2, Math.min(5, 2 + (c.projects/150)*5))} fill={colorForRate(c.pass)} stroke="#0f172a" strokeWidth="0.2" opacity={0.95}/>
                      <text x={2.5} y={-2.5} fontSize="3" fill="#334155">{lang==='ar'? c.nameAr : c.nameEn}</text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Legend */}
              <div className="absolute bottom-2 right-2 text-[11px] bg-white/85 backdrop-blur rounded-xl px-2 py-1 border border-slate-200">
                <div className="font-medium mb-1">{t.legend}</div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-600"/>
                  <span>{t.low}</span>
                  <span>→</span>
                  <span>{t.high}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Side Panel */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5">
              <div className="text-sm font-medium mb-2 flex items-center gap-2"><Globe2 className="w-4 h-4"/> {t.kpis}</div>
              {activeCity ? (
                <div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <MapPin className="w-4 h-4"/>
                    <div className="font-semibold">{lang==='ar'? activeCity.nameAr : activeCity.nameEn}</div>
                    <Pill className="border-slate-300">{activeCity.region}</Pill>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <div className="text-[12px] text-slate-600">{t.passRate}</div>
                      <div className="mt-1 text-xl font-semibold" style={{ color: colorForRate(activeCity.pass) }}>{activeCity.pass}%</div>
                      <div className="mt-2 w-full h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full" style={{ width: `${activeCity.pass}%`, background: colorForRate(activeCity.pass) }} /></div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <div className="text-[12px] text-slate-600">{t.projects}</div>
                      <div className="mt-1 text-xl font-semibold">{activeCity.projects}</div>
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5"/> {t.identity}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[12px] text-slate-600 mb-1 flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/> {t.styles}</div>
                    <div className="space-y-1">
                      {Object.entries(activeCity.styles).map(([k,v])=> (
                        <div key={k} className="flex items-center gap-2 text-sm">
                          <div className="w-24 text-slate-700">{k}</div>
                          <div className="grow h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-slate-900" style={{ width: `${pct(v)}%` }} /></div>
                          <div className="w-10 text-right text-slate-600">{pct(v)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] text-slate-600">
                    <div className="flex items-center gap-1"><Sun className="w-3.5 h-3.5"/> {t.climate}: <span className="text-slate-800">{activeCity.climate}</span></div>
                    <div className="flex items-center gap-1"><Percent className="w-3.5 h-3.5"/> {t.passRate}: <span className="text-slate-800">{activeCity.pass}%</span></div>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline"><BarChart3 className="w-4 h-4"/> {lang==='ar'? 'لوحة المدينة (تفاصيل)':'Open City Dashboard'}</Button>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-slate-600">{lang==='ar'? 'اختر مدينة من الخريطة':'Select a city on the map'}</div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      <DevTestsBadge t={t} />
    </div>
  );
}

// ——————————————————
// Exported App
// ——————————————————
export default function Sima_Screen09_CityAtlas(){
  return (
    <AuthProvider>
      <CityAtlasScreen />
    </AuthProvider>
  );
}
