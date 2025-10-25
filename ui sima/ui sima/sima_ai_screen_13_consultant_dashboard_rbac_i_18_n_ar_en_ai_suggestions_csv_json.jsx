import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  BarChart3,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Printer,
  FileText,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Sima AI — Screen 13: Consultant Dashboard (Standalone)
 * - For design consultants to follow projects under evaluation, apply AI suggestions,
 *   monitor deltas, and prepare reports.
 * - RBAC: view requires `projects.view`; actions require `ai.evaluate` (apply suggestions)
 * - i18n (AR/EN) + RTL; Export JSON/CSV; Print; Self‑tests badge.
 * - No external libs; all JSX closed; icons from stable lucide set only.
 */

// ——————————————————
// RBAC
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: ["projects.view", "reports.view", "projects.approve", "ai.evaluate"],
  [ROLES.CONSULTANT]: ["projects.view", "reports.view", "ai.evaluate"],
  [ROLES.CLIENT]: ["projects.view"],
};
const AuthCtx = React.createContext(null);
function AuthProvider({ children }){
  const [user, setUser] = useState({ email: "consultant@studio.sa", role: ROLES.CONSULTANT });
  const setRole = (role) => setUser((u)=> (u? { ...u, role } : { email: "consultant@studio.sa", role }));
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
    title: "لوحة الاستشاري",
    subtitle: "إدارة الملاحظات الذكية ورفع نسبة التوافق قبل الاعتماد",
    role: "الدور",

    filters: "المرشحات",
    city: "المدينة",
    status: "الحالة",
    all: "الكل",
    search: "بحث بالاسم/الرقم…",

    kpis: {
      active: "المشاريع النشطة",
      avgPass: "متوسط التوافق",
      underReview: "قيد المراجعة",
      needChanges: "بحاجة لتعديلات",
    },

    table: {
      project: "المشروع",
      city: "المدينة",
      pass: "النسبة",
      delta: "التحسن",
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

    openAnalysis: "فتح التحليل",
    open3D: "فتح الاستوديو ثلاثي الأبعاد",
    applyAI: "تطبيق اقتراحات الذكاء",
    resetAI: "إلغاء الاقتراحات",
    export: "تصدير JSON",
    exportCSV: "تصدير CSV",
    print: "طباعة",

    panelTitle: "اقتراحات الذكاء للمشروع",
    pillar: "المحور",
    impact: "الأثر",
    apply: "تطبيق",
    applied: "مُطبّق",

    noPerm: "لا تملك صلاحية إجراء التعديلات الذكية",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Consultant Dashboard",
    subtitle: "Manage AI recommendations to raise conformance before certification",
    role: "Role",

    filters: "Filters",
    city: "City",
    status: "Status",
    all: "All",
    search: "Search by name/id…",

    kpis: {
      active: "Active projects",
      avgPass: "Average pass",
      underReview: "Under review",
      needChanges: "Need changes",
    },

    table: {
      project: "Project",
      city: "City",
      pass: "Pass",
      delta: "Delta",
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

    openAnalysis: "Open analysis",
    open3D: "Open 3D studio",
    applyAI: "Apply AI suggestions",
    resetAI: "Reset suggestions",
    export: "Export JSON",
    exportCSV: "Export CSV",
    print: "Print",

    panelTitle: "AI Suggestions",
    pillar: "Pillar",
    impact: "Impact",
    apply: "Apply",
    applied: "Applied",

    noPerm: "You don't have permission to apply AI changes",
  },
};

// ——————————————————
// Demo dataset
// ——————————————————
const PROJECTS = [
  { id:'C-3101', name:'Riyadh Courtyard Villas', city:'Riyadh',   basePass:74, status:'REVIEW',  updated:'2025-10-10', suggestions:[
    { code:'DASC-1.2', title:'زيادة الملاقف 10%', pillar:'المناخ', delta:+3, applied:false },
    { code:'DASC-3.4', title:'تعميق الظلال 20‑30cm', pillar:'الهوية', delta:+2, applied:false },
    { code:'DASC-5.1', title:'تحسين تهوية الفناء', pillar:'الإنسان', delta:+2, applied:false },
  ]},
  { id:'C-3102', name:'Jeddah Heritage Offices', city:'Jeddah',   basePass:69, status:'CHANGES', updated:'2025-10-09', suggestions:[
    { code:'DASC-2.1', title:'تحسين التوجيه الشمسي', pillar:'المناخ', delta:+4, applied:false },
    { code:'DASC-4.2', title:'نسب فتحات نجديّة للواجهة', pillar:'الهوية', delta:+3, applied:false },
  ]},
  { id:'C-3103', name:'Dammam Waterfront Hub',   city:'Dammam',   basePass:71, status:'REVIEW',  updated:'2025-10-08', suggestions:[
    { code:'DASC-2.3', title:'مواد مقاومة للرطوبة', pillar:'المناخ', delta:+2, applied:false },
    { code:'DASC-6.1', title:'ممرات مظللة للمشاة', pillar:'السياق', delta:+3, applied:false },
  ]},
  { id:'C-3104', name:'Abha Highlands Library',  city:'Abha',     basePass:83, status:'REVIEW',  updated:'2025-10-07', suggestions:[
    { code:'DASC-1.5', title:'تعزيز تهوية علوية', pillar:'المناخ', delta:+2, applied:false },
  ]},
  { id:'C-3105', name:'Najran Eco School',       city:'Najran',   basePass:68, status:'CHANGES', updated:'2025-10-06', suggestions:[
    { code:'DASC-3.1', title:'تدرّج مواد محلية', pillar:'الهوية', delta:+2, applied:false },
    { code:'DASC-2.6', title:'مظلّات للملاعب', pillar:'المناخ', delta:+3, applied:false },
  ]},
];
const CITIES = ['All','Riyadh','Jeddah','Dammam','Abha','Najran'];
const STATUSES = ['All','REVIEW','CHANGES','SIGNING','CERTIFIED'];

// helpers
function fmtDate(d){ try { return new Date(d).toLocaleDateString(); } catch { return d; } }
function toCSV(rows){
  const header = ['id','name','city','pass','delta','status','updated'];
  const lines = [header.join(',')].concat(rows.map(r=> header.map(h=> r[h]).join(',')));
  return lines.join('\n');
}
function calcPass(p){ return Math.max(0, Math.min(100, Math.round((p?.basePass||0) + (p?.suggestions||[]).filter(s=>s.applied).reduce((a,c)=> a + (c.delta||0), 0)))); }
function calcDelta(p){ return Math.max(0, Math.round((p?.suggestions||[]).filter(s=>s.applied).reduce((a,c)=> a + (c.delta||0), 0))); }

// ——————————————————
// Self‑tests badge
// ——————————————————
function DevTestsBadge({ t, can }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.table && !!t.kpis });
  const haveAI = PROJECTS.every(p=> Array.isArray(p.suggestions));
  tests.push({ name: "ai suggestions", pass: haveAI });
  const rbacOk = typeof can === 'function';
  tests.push({ name: "rbac hook", pass: rbacOk });
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
// Screen 13 — Consultant Dashboard
// ——————————————————
function ConsultantDashboard(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  const [city, setCity] = useState('All');
  const [status, setStatus] = useState('All');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(PROJECTS.map(p=> ({ ...p })));
  const [activeId, setActiveId] = useState(rows[0]?.id || null);

  const filtered = useMemo(()=>{
    return rows.filter(p => (
      (city==='All' || p.city===city) &&
      (status==='All' || p.status===status) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase()))
    ));
  }, [rows, city, status, q]);

  const kpiActive = filtered.length;
  const kpiAvgPass = Math.round(filtered.reduce((a,c)=> a + calcPass(c), 0) / Math.max(1, filtered.length));
  const kpiUnder = filtered.filter(p=> p.status==='REVIEW').length;
  const kpiNeed = filtered.filter(p=> p.status==='CHANGES').length;

  const active = useMemo(()=> rows.find(r=> r.id===activeId) || null, [rows, activeId]);

  function toggleSuggestion(pid, idx){
    if (!can('ai.evaluate')) return alert(t.noPerm);
    setRows(prev => prev.map(p => {
      if (p.id !== pid) return p;
      const next = { ...p, suggestions: p.suggestions.map((s,i)=> i===idx? { ...s, applied: !s.applied } : s ) };
      return next;
    }));
  }
  function setAllSuggestions(pid, applied){
    if (!can('ai.evaluate')) return alert(t.noPerm);
    setRows(prev => prev.map(p => {
      if (p.id !== pid) return p;
      return { ...p, suggestions: p.suggestions.map(s=> ({ ...s, applied })) };
    }));
  }

  function exportJSON(){
    const payload = { filters: { city, status, q }, rows: filtered.map(p=> ({ ...p, pass: calcPass(p), delta: calcDelta(p) })) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_consultant_dashboard.json'; a.click(); URL.revokeObjectURL(url);
  }
  function exportCSV(){
    const rowsCSV = filtered.map(p=> ({ id:p.id, name:p.name, city:p.city, pass:calcPass(p), delta:calcDelta(p), status:p.status, updated:p.updated }));
    const header = ['id','name','city','pass','delta','status','updated'];
    const lines = [header.join(',')].concat(rowsCSV.map(r=> header.map(h=> r[h]).join(',')));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_consultant_dashboard.csv'; a.click(); URL.revokeObjectURL(url);
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.active}</div><div className="mt-1 text-2xl font-semibold">{kpiActive}</div></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.avgPass}</div><div className="mt-1 text-2xl font-semibold">{kpiAvgPass}%</div><div className="mt-2"><Progress value={kpiAvgPass}/></div></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.underReview}</div><div className="mt-1 text-2xl font-semibold">{kpiUnder}</div></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-600">{t.kpis.needChanges}</div><div className="mt-1 text-2xl font-semibold">{kpiNeed}</div></Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2"><Filter className="w-4 h-4"/> {t.filters}</div>
            <div className="grid md:grid-cols-4 gap-3 items-end">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400"/>
                <Input value={q} onChange={(e)=> setQ(e.target.value)} placeholder={t.search} className="pl-9"/>
              </div>
              <Select value={city} onChange={(e)=> setCity(e.target.value)} options={CITIES.map(c=> ({ value:c, label:c }))} />
              <Select value={status} onChange={(e)=> setStatus(e.target.value)} options={STATUSES.map(s=> ({ value:s, label:s }))} />
            </div>
          </Card>

          {/* Table + Side panel */}
          <div className="grid lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-8 p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-start px-4 py-2">{t.table.project}</th>
                    <th className="text-start px-4 py-2">{t.table.city}</th>
                    <th className="text-start px-4 py-2">{t.table.pass}</th>
                    <th className="text-start px-4 py-2">{t.table.delta}</th>
                    <th className="text-start px-4 py-2">{t.table.status}</th>
                    <th className="text-start px-4 py-2">{t.table.updated}</th>
                    <th className="text-start px-4 py-2">{t.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => {
                    const pass = calcPass(row); const delta = calcDelta(row);
                    return (
                      <tr key={row.id} className={"border-t border-slate-200 " + (row.id===activeId? 'bg-slate-50/60':'')} onClick={()=> setActiveId(row.id)}>
                        <td className="px-4 py-3 font-medium text-slate-800">{row.name} <span className="text-slate-400">({row.id})</span></td>
                        <td className="px-4 py-3">{row.city}</td>
                        <td className="px-4 py-3">{pass}%</td>
                        <td className="px-4 py-3">+{delta}%</td>
                        <td className="px-4 py-3">
                          {row.status==='CERTIFIED' ? (
                            <Pill className="border-emerald-300 bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5"/> {S.CERTIFIED}</Pill>
                          ) : row.status==='CHANGES' ? (
                            <Pill className="border-amber-300 bg-amber-50 text-amber-700"><AlertTriangle className="w-3.5 h-3.5"/> {S.CHANGES}</Pill>
                          ) : row.status==='SIGNING' ? (
                            <Pill className="border-sky-300 bg-sky-50 text-sky-700"><ClipboardList className="w-3.5 h-3.5"/> {S.SIGNING}</Pill>
                          ) : (
                            <Pill className="border-slate-300"><ClipboardList className="w-3.5 h-3.5"/> {S.REVIEW}</Pill>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(row.updated)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Button variant="outline"><FileText className="w-4 h-4"/> {t.openAnalysis}</Button>
                            <Button variant="outline"><BarChart3 className="w-4 h-4"/> {t.open3D}</Button>
                            {calcDelta(row)===0 ? (
                              <Button onClick={()=> setAllSuggestions(row.id, true)}>{t.applyAI}</Button>
                            ) : (
                              <Button variant="soft" onClick={()=> setAllSuggestions(row.id, false)}>{t.resetAI}</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* Side Panel: AI suggestions */}
            <Card className="lg:col-span-4 p-5">
              <div className="text-sm font-medium mb-2 flex items-center gap-2"><Wrench className="w-4 h-4"/> {t.panelTitle}</div>
              {active ? (
                <div>
                  <div className="text-[12px] text-slate-600">{active.name} <span className="text-slate-400">({active.id})</span></div>
                  <div className="mt-2 rounded-2xl border border-slate-200 p-3">
                    <div className="text-[12px] text-slate-600">{t.table.pass}</div>
                    <div className="mt-1 text-xl font-semibold">{calcPass(active)}%</div>
                    <div className="mt-1 text-[12px] text-slate-500">+{calcDelta(active)}%</div>
                    <div className="mt-2"><Progress value={calcPass(active)} /></div>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {active.suggestions.map((s, i)=> (
                      <li key={i} className="rounded-2xl border border-slate-200 p-3">
                        <div className="text-sm font-medium text-slate-800">{s.title}</div>
                        <div className="mt-0.5 text-[12px] text-slate-600">{t.pillar}: <span className="text-slate-800">{s.pillar}</span> • {s.code}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <Pill className="border-slate-300">{t.impact}: +{s.delta}%</Pill>
                          <Button variant={s.applied? 'soft':'outline'} onClick={()=> toggleSuggestion(active.id, i)}>
                            {s.applied? t.applied : t.apply}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-[12px] text-slate-600">{rtl? 'اختر مشروعًا من الجدول':'Select a project from the table'}</div>
              )}
            </Card>
          </div>
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
export default function Sima_Screen13_ConsultantDashboard(){
  return (
    <AuthProvider>
      <ConsultantDashboard />
    </AuthProvider>
  );
}
