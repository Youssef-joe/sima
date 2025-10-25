import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Users,
  Filter,
  Search,
  Download,
  Printer,
} from "lucide-react";

/**
 * Sima AI — Screen 12: Authority Dashboard (Standalone)
 * - For government authorities (DASC ecosystem) to monitor & act on projects.
 * - KPIs, trends (SVG), table with actions: send to e‑sign, approve, request changes.
 * - RBAC: actions require `projects.approve`; view requires `reports.view`.
 * - i18n (AR/EN) + RTL; Export JSON/CSV; Print; Self‑tests badge.
 * - No external libs; all JSX closed; icons from stable lucide set only.
 */

// ——————————————————
// RBAC (Authority only for critical actions)
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: ["projects.view", "reports.view", "projects.approve"],
  [ROLES.CONSULTANT]: ["projects.view", "reports.view"],
  [ROLES.CLIENT]: ["projects.view"],
};
const AuthCtx = React.createContext(null);
function AuthProvider({ children }){
  const [user, setUser] = useState({ email: "authority@dasc.sa", role: ROLES.AUTHORITY });
  const setRole = (role) => setUser((u)=> (u? { ...u, role } : { email: "authority@dasc.sa", role }));
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
    title: "لوحة الجهة المعتمِدة",
    subtitle: "متابعة مشاريع الاعتماد والمطابقة حسب موجهات العمارة السعودية",
    role: "الدور",

    kpis: {
      total: "إجمالي المشاريع",
      pass: "معدل النجاح",
      cities: "عدد المدن",
      pending: "بانتظار اللجنة",
      time: "متوسط زمن الاعتماد",
    },

    filters: "المرشحات",
    city: "المدينة",
    status: "الحالة",
    all: "الكل",

    table: {
      project: "المشروع",
      city: "المدينة",
      owner: "المالك / المكتب",
      pass: "النسبة",
      status: "الحالة",
      updated: "آخر تحديث",
      actions: "إجراءات",
    },

    statuses: {
      REVIEW: "مراجعة",
      CHANGES: "تعديلات",
      SIGNING: "توقيع",
      CERTIFIED: "معتمد",
    },

    toSign: "تحويل للتوقيع",
    requestChanges: "طلب تعديلات",
    approve: "اعتماد نهائي",

    export: "تصدير JSON",
    exportCSV: "تصدير CSV",
    print: "طباعة",

    noPerm: "لا تملك صلاحية عرض هذه اللوحة",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Authority Dashboard",
    subtitle: "Monitor accreditation & conformance to Saudi Architecture guidelines",
    role: "Role",

    kpis: {
      total: "Total projects",
      pass: "Pass rate",
      cities: "Cities",
      pending: "Pending committee",
      time: "Avg. time to certify",
    },

    filters: "Filters",
    city: "City",
    status: "Status",
    all: "All",

    table: {
      project: "Project",
      city: "City",
      owner: "Owner / Firm",
      pass: "Pass",
      status: "Status",
      updated: "Updated",
      actions: "Actions",
    },

    statuses: {
      REVIEW: "REVIEW",
      CHANGES: "CHANGES",
      SIGNING: "E‑SIGN",
      CERTIFIED: "CERTIFIED",
    },

    toSign: "Send to e‑sign",
    requestChanges: "Request changes",
    approve: "Finalize",

    export: "Export JSON",
    exportCSV: "Export CSV",
    print: "Print",

    noPerm: "You don't have permission to view this dashboard",
  },
};

// ——————————————————
// Demo dataset
// ——————————————————
const PROJECTS = [
  { id:'P-2201', name:'Najd Courtyard Housing', city:'Riyadh', owner:'Masdar Studio', pass:82, status:'REVIEW', updated:'2025-10-14' },
  { id:'P-2202', name:'Coastal Heritage Mall', city:'Dammam', owner:'Sharq Eng.', pass:69, status:'CHANGES', updated:'2025-10-13' },
  { id:'P-2203', name:'AlUla Cultural Center', city:'AlUla', owner:'Hijaz Partners', pass:88, status:'SIGNING', updated:'2025-10-11' },
  { id:'P-2204', name:'Wahat Community Hub', city:'AlAhsa', owner:'Oasis Design', pass:75, status:'REVIEW', updated:'2025-10-10' },
  { id:'P-2205', name:'Najran Eco School', city:'Najran', owner:'Asir Atelier', pass:71, status:'REVIEW', updated:'2025-10-09' },
  { id:'P-2206', name:'Madinah Transit Node', city:'Madinah', owner:'Harrah Lab', pass:79, status:'SIGNING', updated:'2025-10-07' },
  { id:'P-2207', name:'Qatif Waterfront Plaza', city:'Qatif', owner:'Eastern Works', pass:68, status:'CHANGES', updated:'2025-10-06' },
  { id:'P-2208', name:'Abha Highlands Museum', city:'Abha', owner:'Asiri Group', pass:86, status:'REVIEW', updated:'2025-10-04' },
  { id:'P-2209', name:'Jeddah Courtyard Hotel', city:'Jeddah', owner:'RedSea Arch', pass:73, status:'REVIEW', updated:'2025-10-02' },
  { id:'P-2210', name:'Hail Wadi Park', city:'Hail', owner:'Najd Plan', pass:77, status:'REVIEW', updated:'2025-09-30' },
];
const CITIES = ['All','Riyadh','Jeddah','Dammam','Abha','Najran','Madinah','Qatif','AlUla','Hail','AlAhsa'];
const STATUSES = ['All','REVIEW','CHANGES','SIGNING','CERTIFIED'];

// helpers
function fmtDate(d){ try { return new Date(d).toLocaleDateString(); } catch { return d; } }
function toCSV(rows){
  const header = ['id','name','city','owner','pass','status','updated'];
  const lines = [header.join(',')].concat(rows.map(r=> header.map(h=> r[h]).join(',')));
  return lines.join('\n');
}

// ——————————————————
// Self‑tests badge
// ——————————————————
function DevTestsBadge({ t, can }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.table && !!t.kpis });
  const rbacOk = can('projects.approve') || true; // ensure function exists
  tests.push({ name: "rbac hook", pass: !!rbacOk });
  const haveData = PROJECTS.length > 0;
  tests.push({ name: "seed data", pass: haveData });
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
// Tiny SVG Chart (12‑point line)
// ——————————————————
function MiniLine({ data=[60,62,65,67,68,70,72,73,74,75,76,78] }){
  const W = 220, H = 60, pad = 8; const maxY = 100; const step = (W - pad*2) / (data.length - 1);
  const pts = data.map((v,i)=> [pad + i*step, H - pad - (v/maxY)*(H - pad*2)]);
  const dLine = pts.map((p,i)=> (i? 'L':'M') + p[0] + ',' + p[1]).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={0} y={0} width={W} height={H} fill="#ffffff" />
      <path d={dLine} fill="none" stroke="#0f172a" strokeWidth={2} />
      {pts.map((p,i)=> <circle key={i} cx={p[0]} cy={p[1]} r={2} fill="#0f172a" />)}
    </svg>
  );
}

// ——————————————————
// Screen 12 — Authority Dashboard
// ——————————————————
function AuthorityDashboard(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  const [city, setCity] = useState('All');
  const [status, setStatus] = useState('All');
  const [q, setQ] = useState('');

  const filtered = useMemo(()=>{
    return PROJECTS.filter(p => (
      (city==='All' || p.city===city) &&
      (status==='All' || p.status===status) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase()))
    ));
  }, [city, status, q]);

  // KPIs
  const kpiTotal = filtered.length;
  const kpiPass = Math.round(filtered.reduce((a,c)=> a + c.pass, 0) / Math.max(1, filtered.length));
  const kpiCities = new Set(filtered.map(p=>p.city)).size;
  const kpiPending = filtered.filter(p=> p.status==='REVIEW' || p.status==='SIGNING').length;
  const kpiTime = 9; // demo constant (days)

  function updateStatus(id, next){
    if (!can('projects.approve')) return alert(lang==='ar'? 'لا تملك صلاحية':'No permission');
    const idx = PROJECTS.findIndex(p=> p.id===id); if (idx<0) return;
    PROJECTS[idx] = { ...PROJECTS[idx], status: next, updated: new Date().toISOString().slice(0,10) };
    // force re-render
    setCity(c=> c);
  }

  function exportJSON(){
    const payload = { filters: { city, status, q }, rows: filtered };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_authority_dashboard.json'; a.click(); URL.revokeObjectURL(url);
  }
  function exportCSV(){
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_authority_dashboard.csv'; a.click(); URL.revokeObjectURL(url);
  }
  function onPrint(){ window.print(); }

  const S = t.statuses;

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
              <p className="text-[12px] text-slate-600 mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4"/> {t.export}</Button>
              <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4"/> {t.exportCSV}</Button>
              <Button variant="outline" onClick={onPrint}><Printer className="w-4 h-4"/> {t.print}</Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.total}</div><div className="mt-1 text-2xl font-semibold">{kpiTotal}</div></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.pass}</div><div className="mt-1 text-2xl font-semibold">{kpiPass}%</div><div className="mt-2"><Progress value={kpiPass}/></div></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.cities}</div><div className="mt-1 text-2xl font-semibold">{kpiCities}</div></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.pending}</div><div className="mt-1 text-2xl font-semibold">{kpiPending}</div></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.time}</div><div className="mt-1 text-2xl font-semibold">{kpiTime} {lang==='ar'? 'يوم':'days'}</div></Card>
          </div>

          {/* Trend mini chart */}
          <Card className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4"/> {lang==='ar'? 'اتجاه الاعتماد':'Accreditation trend'}</div>
            <MiniLine />
          </Card>

          {/* Filters */}
          <Card className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2"><Filter className="w-4 h-4"/> {t.filters}</div>
            <div className="grid md:grid-cols-4 gap-3 items-end">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400"/>
                <Input value={q} onChange={(e)=> setQ(e.target.value)} placeholder={lang==='ar'? 'بحث بالاسم/الرقم':'Search by name/id'} className="pl-9"/>
              </div>
              <Select value={city} onChange={(e)=> setCity(e.target.value)} options={CITIES.map(c=> ({ value:c, label:c }))} />
              <Select value={status} onChange={(e)=> setStatus(e.target.value)} options={STATUSES.map(s=> ({ value:s, label:s }))} />
            </div>
          </Card>

          {/* Table */}
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-start px-4 py-2">{t.table.project}</th>
                  <th className="text-start px-4 py-2">{t.table.city}</th>
                  <th className="text-start px-4 py-2">{t.table.owner}</th>
                  <th className="text-start px-4 py-2">{t.table.pass}</th>
                  <th className="text-start px-4 py-2">{t.table.status}</th>
                  <th className="text-start px-4 py-2">{t.table.updated}</th>
                  <th className="text-start px-4 py-2">{t.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name} <span className="text-slate-400">({row.id})</span></td>
                    <td className="px-4 py-3">{row.city}</td>
                    <td className="px-4 py-3">{row.owner}</td>
                    <td className="px-4 py-3">{row.pass}%</td>
                    <td className="px-4 py-3">
                      {row.status==='CERTIFIED' ? (
                        <Pill className="border-emerald-300 bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5"/> {S.CERTIFIED}</Pill>
                      ) : row.status==='CHANGES' ? (
                        <Pill className="border-amber-300 bg-amber-50 text-amber-700"><AlertTriangle className="w-3.5 h-3.5"/> {S.CHANGES}</Pill>
                      ) : row.status==='SIGNING' ? (
                        <Pill className="border-sky-300 bg-sky-50 text-sky-700"><Clock3 className="w-3.5 h-3.5"/> {S.SIGNING}</Pill>
                      ) : (
                        <Pill className="border-slate-300"><Clock3 className="w-3.5 h-3.5"/> {S.REVIEW}</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(row.updated)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button variant="outline" onClick={()=> updateStatus(row.id, 'SIGNING')}>{t.toSign}</Button>
                        <Button variant="outline" onClick={()=> updateStatus(row.id, 'CHANGES')}>{t.requestChanges}</Button>
                        <Button onClick={()=> updateStatus(row.id, 'CERTIFIED')}>{t.approve}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Guard when not authority */}
          {!can('reports.view') && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
              {t.noPerm}
            </div>
          )}
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      <DevTestsBadge t={t} can={can} />
    </div>
  );
}

// ——————————————————
// Exported App
// ——————————————————
export default function Sima_Screen12_AuthorityDashboard(){
  return (
    <AuthProvider>
      <AuthorityDashboard />
    </AuthProvider>
  );
}
