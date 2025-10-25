import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  BarChart3,
  TrendingUp,
  CalendarClock,
  MapPin,
  Building2,
  Sun,
  ThermometerSun,
  Droplets,
  Download,
  Printer,
} from "lucide-react";

/**
 * Sima AI — Screen 10: City Dashboard (Standalone)
 * - Cinematic, informative dashboard per city: KPIs, 12‑month trend, style donut, quick insights.
 * - Pure SVG charts (no external libs) to avoid runtime issues.
 * - i18n (AR/EN) + RTL; Export JSON + Print; consistent topbar with role switcher.
 * - All JSX closed; icons from stable lucide set only.
 * - Self-tests badge validates i18n keys, series length, and donut total ≈ 100%.
 */

// ——————————————————
// Auth (consistency)
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: ["projects.view", "reports.view"],
  [ROLES.CONSULTANT]: ["projects.view", "reports.view"],
  [ROLES.CLIENT]: ["projects.view"],
};
const AuthCtx = React.createContext(null);
function AuthProvider({ children }){
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
function Progress({ value }){
  const v = Math.max(0, Math.min(100, value|0));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full bg-slate-900" style={{ width: `${v}%` }} />
    </div>
  );
}

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "لوحة المدينة",
    subtitle: "مؤشرات الهوية والمناخ والنجاح عبر الزمن",
    role: "الدور",

    chooseCity: "اختر المدينة",
    kpis: "المؤشرات الرئيسية",
    passRate: "نسبة النجاح",
    projects: "عدد المشاريع",
    avgTemp: "متوسط الحرارة",
    humidity: "الرطوبة",
    styleMix: "توزيع الطرز",
    trend: "الاتجاه خلال 12 شهرًا",
    insights: "استنتاجات ذكية",

    export: "تصدير JSON",
    print: "طباعة",

    insightHighPass: (name)=> `‎${name}‎ تحافظ على مسار نجاح متصاعد خلال الشهور الأخيرة`,
    insightStyle: (top)=> `الطراز الغالب: ‎${top}‎ — يُنصح بالتوظيف الحذر حسب المناخ`,
    insightClimate: "المناخ يؤثر على فتحات الواجهات والتظليل — راجع DASC/2.2, 2.4",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "City Dashboard",
    subtitle: "Identity, climate and success trends",
    role: "Role",

    chooseCity: "Choose city",
    kpis: "Key metrics",
    passRate: "Pass rate",
    projects: "Projects",
    avgTemp: "Avg. temperature",
    humidity: "Humidity",
    styleMix: "Style mix",
    trend: "12‑month trend",
    insights: "Smart insights",

    export: "Export JSON",
    print: "Print",

    insightHighPass: (name)=> `${name} keeps an upward success trend lately`,
    insightStyle: (top)=> `Dominant style: ${top} — tune to climate sensibly`,
    insightClimate: "Climate impacts openings & shading — see DASC/2.2, 2.4",
  },
};

// ——————————————————
// Dataset
// ——————————————————
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_AR = ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"];
const BASE = [
  { id:'riyadh',  nameAr:'الرياض',  nameEn:'Riyadh',  region:'Najd',   pass:78, projects:124, styles:{ Najdi:45, Contemporary:35, Others:20 }, climate:{ temp:32, humidity:24 }, trend:[66,68,70,72,73,74,75,77,79,80,81,82] },
  { id:'jeddah',  nameAr:'جدة',    nameEn:'Jeddah',  region:'Hijaz',  pass:72, projects:98,  styles:{ Hijazi:50, Contemporary:30, Others:20 }, climate:{ temp:34, humidity:58 }, trend:[60,61,62,63,65,67,68,69,70,71,72,73] },
  { id:'dammam',  nameAr:'الدمام',  nameEn:'Dammam',  region:'Eastern',pass:69, projects:77,  styles:{ Eastern:42, Contemporary:40, Others:18 }, climate:{ temp:35, humidity:64 }, trend:[58,59,60,61,63,64,65,66,67,68,69,70] },
  { id:'abha',    nameAr:'أبها',    nameEn:'Abha',    region:'Asir',   pass:84, projects:54,  styles:{ Asiri:60, Contemporary:25, Others:15 }, climate:{ temp:24, humidity:42 }, trend:[72,74,75,76,78,79,80,81,82,83,84,85] },
  { id:'makkah',  nameAr:'مكة',    nameEn:'Makkah',  region:'Hijaz',  pass:75, projects:86,  styles:{ Hijazi:56, Contemporary:28, Others:16 }, climate:{ temp:35, humidity:30 }, trend:[64,65,66,67,69,70,71,72,73,74,75,76] },
];

// helpers
function sum(obj){ return Object.values(obj).reduce((a,c)=> a + Number(c||0), 0); }
function pct(n, total){ return total? Math.round((n/total)*100) : 0; }

// ——————————————————
// Charts (SVG)
// ——————————————————
function LineArea({ width=480, height=180, data=[], color="#0f172a", fill="#cbd5e1" }){
  const maxY = 100; // pass rate percent
  const pad = 20;
  const W = width, H = height;
  const step = (W - pad*2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i)=> [pad + i*step, H - pad - (v/maxY)*(H - pad*2)]);
  const dLine = pts.map((p,i)=> (i? 'L':'M') + p[0] + ',' + p[1]).join(' ');
  const dArea = dLine + ` L ${pad + (data.length-1)*step},${H - pad} L ${pad},${H - pad} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={0} y={0} width={W} height={H} fill="#ffffff" />
      <path d={dArea} fill={fill} opacity={0.6} />
      <path d={dLine} fill="none" stroke={color} strokeWidth={2} />
      {pts.map((p,i)=> <circle key={i} cx={p[0]} cy={p[1]} r={2} fill={color} />)}
    </svg>
  );
}

function Donut({ size=180, thick=22, parts=[] }){
  const R = size/2, r = R - thick;
  const total = parts.reduce((a,c)=> a + (c.value||0), 0) || 1;
  let angle = -90; // start at top
  function arcPath(cx, cy, R, startDeg, endDeg){
    const rad = (d)=> (Math.PI/180)*d;
    const sx = cx + R * Math.cos(rad(startDeg));
    const sy = cy + R * Math.sin(rad(startDeg));
    const ex = cx + R * Math.cos(rad(endDeg));
    const ey = cy + R * Math.sin(rad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`;
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={R} cy={R} r={r} fill="#ffffff" stroke="#e2e8f0" strokeWidth={thick} />
      {parts.map((p, i)=>{
        const sweep = (p.value/total) * 360;
        const path = arcPath(R, R, r, angle, angle + sweep);
        angle += sweep;
        return <path key={i} d={path} stroke={p.color||'#0f172a'} strokeWidth={thick} fill="none"/>;
      })}
      <text x={R} y={R} textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#0f172a">{Math.round(total)}%</text>
    </svg>
  );
}

// ——————————————————
// Self-tests badge
// ——————————————————
function DevTestsBadge({ t, city }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.kpis && !!t.trend });
  const is12 = (city?.trend?.length||0) === 12;
  tests.push({ name: "series length", pass: is12 });
  const dsum = sum(city?.styles||{});
  tests.push({ name: "donut total", pass: Math.abs(dsum - 100) <= 1 });
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
// Screen 10 — City Dashboard
// ——————————————————
function CityDashboardScreen(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole } = useAuth();

  const [cityId, setCityId] = useState('riyadh');
  const city = useMemo(()=> BASE.find(c=>c.id===cityId) || BASE[0], [cityId]);
  const months = lang==='ar'? MONTHS_AR : MONTHS_EN;
  const topStyle = useMemo(()=> Object.entries(city.styles).sort((a,b)=> b[1]-a[1])[0]?.[0] || '-', [city]);

  function exportJSON(){
    const payload = { cityId, city };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sima_city_${cityId}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function onPrint(){ window.print(); }

  // donut parts from styles
  const donutParts = useMemo(()=> {
    const cols = ["#0f172a", "#334155", "#94a3b8", "#64748b", "#1f2937"]; // harmonious palette
    return Object.entries(city.styles).map(([k,v],i)=> ({ label:k, value:v, color: cols[i % cols.length] }));
  }, [city]);

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
        <div className="max-w-7xl mx-auto space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
                <p className="text-[12px] text-slate-600 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4"/> {t.export}</Button>
                <Button variant="outline" onClick={onPrint}><Printer className="w-4 h-4"/> {t.print}</Button>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">{t.chooseCity}</label>
                <Select value={cityId} onChange={(e)=>setCityId(e.target.value)} options={BASE.map(c=> ({ value:c.id, label: lang==='ar'? c.nameAr : c.nameEn }))} />
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[12px] text-slate-600">{t.passRate}</div>
                <div className="mt-1 text-2xl font-semibold">{city.pass}%</div>
                <div className="mt-2"><Progress value={city.pass}/></div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[12px] text-slate-600">{t.projects}</div>
                <div className="mt-1 text-2xl font-semibold">{city.projects}</div>
                <div className="mt-2 text-[12px] text-slate-500">{lang==='ar'? 'أعلى طراز': 'Top style'}: <span className="text-slate-800 font-medium">{topStyle}</span></div>
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-12 gap-4">
              {/* Trend */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4"/> {t.trend}</div>
                <div className="mt-3 overflow-x-auto">
                  <LineArea width={640} height={200} data={city.trend} />
                </div>
                <div className="mt-2 grid grid-cols-12 text-[11px] text-slate-500">
                  {months.map((m,i)=> <div key={i} className="col-span-1 text-center">{m}</div>)}
                </div>
              </div>

              {/* Donut */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-medium flex items-center gap-2"><BarChart3 className="w-4 h-4"/> {t.styleMix}</div>
                <div className="mt-2 flex items-center gap-4">
                  <Donut size={200} thick={22} parts={donutParts} />
                  <div className="space-y-2 text-sm">
                    {donutParts.map((p,i)=> (
                      <div key={i} className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded" style={{ background:p.color }} />
                        <span className="w-28 text-slate-700">{p.label}</span>
                        <span className="text-slate-600">{p.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Climate */}
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[12px] text-slate-600 flex items-center gap-1"><ThermometerSun className="w-3.5 h-3.5"/> {t.avgTemp}</div>
                <div className="mt-1 text-xl font-semibold">{city.climate.temp}°C</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[12px] text-slate-600 flex items-center gap-1"><Droplets className="w-3.5 h-3.5"/> {t.humidity}</div>
                <div className="mt-1 text-xl font-semibold">{city.climate.humidity}%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[12px] text-slate-600 flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/> {lang==='ar'? 'أقرب توصيف نمطي':'Nearest identity fit'}</div>
                <div className="mt-1 text-xl font-semibold">{topStyle}</div>
              </div>
            </div>

            {/* Insights */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-medium mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4"/> {t.insights}</div>
              <ul className="list-disc ms-5 text-sm text-slate-700 space-y-1">
                <li>{t.insightHighPass(lang==='ar'? city.nameAr : city.nameEn)}</li>
                <li>{t.insightStyle(topStyle)}</li>
                <li>{t.insightClimate}</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      <DevTestsBadge t={t} city={city} />
    </div>
  );
}

// ——————————————————
// Exported App
// ——————————————————
export default function Sima_Screen10_CityDashboard(){
  return (
    <AuthProvider>
      <CityDashboardScreen />
    </AuthProvider>
  );
}
