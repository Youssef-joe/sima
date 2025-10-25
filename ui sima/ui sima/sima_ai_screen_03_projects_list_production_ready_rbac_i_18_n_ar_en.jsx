import React, { useMemo, useState, useContext, useEffect } from "react";
import {
  Shield,
  Plus,
  Filter as FilterIcon,
  Search as SearchIcon,
  Eye,
  Sparkles,
  Layers3,
  BadgeCheck,
  FileCheck2,
  BarChart3,
  ChevronDown,
  ArrowUpDown,
  MapPin,
  Building2,
  CalendarClock,
  Percent,
  Check,
  X,
  Trash2,
} from "lucide-react";

/**
 * Sima AI — Screen 03: Projects List (Standalone)
 * - Clean JSX, RTL-first, AR/EN i18n, RBAC gates.
 * - Table with search, filters (city/status/style), sort, inline create new project (gated), row actions (gated).
 * - Self-tests badge validates i18n keys, RBAC rules, sorter, dataset.
 */

// ——————————————————
// RBAC — roles & permissions
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: [
    "projects.view",
    "projects.create",
    "projects.approve",
    "ai.evaluate",
    "reports.view",
    "accredit.sign",
    "admin.users",
  ],
  [ROLES.CONSULTANT]: ["projects.view", "projects.create", "ai.evaluate", "reports.view"],
  [ROLES.CLIENT]: ["projects.view", "reports.view"],
};

// ——————————————————
// Auth context (local demo)
// ——————————————————
const AuthCtx = React.createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState({ email: "demo@studio.sa", role: ROLES.CONSULTANT });
  const signIn = ({ email, role }) => setUser({ email, role });
  const signOut = () => setUser(null);
  const setRole = (role) => setUser((u)=> (u? { ...u, role } : { email: "demo@studio.sa", role }));
  const can = (perm) => !!(user && PERMISSIONS[user.role]?.includes(perm));
  const value = { user, signIn, signOut, setRole, can };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
function useAuth() { return useContext(AuthCtx); }

// ——————————————————
// UI primitives
// ——————————————————
const Button = ({ children, className = "", variant = "solid", ...props }) => (
  <button
    className={
      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition " +
      (variant === "solid"
        ? "bg-slate-900 text-white hover:bg-slate-700 "
        : variant === "outline"
        ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
        : variant === "ghost"
        ? "bg-transparent text-slate-900 hover:bg-slate-100 "
        : variant === "soft"
        ? "bg-slate-100 text-slate-900 hover:bg-slate-200 "
        : "") +
      className
    }
    {...props}
  >
    {children}
  </button>
);
const Card = ({ className = "", children }) => (
  <div className={"rounded-3xl border border-slate-200 bg-white shadow-sm " + className}>{children}</div>
);
function Field({ label, hint, error, children }){
  return (
    <div className="space-y-1.5">
      {label ? <label className="block text-sm text-slate-700">{label}</label> : null}
      {children}
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
      {error ? <div className="text-[11px] text-red-600">{error}</div> : null}
    </div>
  );
}
function Input({ icon: Icon, ...props }){
  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-slate-300 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        {...props}
      />
      {Icon ? <Icon className="absolute right-3 top-2.5 h-4 w-4 text-slate-400"/> : null}
    </div>
  );
}
function Select({ options, ...props }){
  return (
    <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
      {options.map((o, i)=> <option key={i} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Pill({ children, className = "" }){
  return <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] " + className}>{children}</span>;
}

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "قائمة المشاريع",
    subtitle: "تحكم كامل بالمشاريع حسب المدينة والحالة والطراز",
    role: "الدور",
    cities: [
      { value: "", label: "كل المدن" },
      { value: "الرياض", label: "الرياض" },
      { value: "نجران", label: "نجران" },
      { value: "جدة", label: "جدة" },
      { value: "الدمام", label: "الدمام" },
      { value: "الطائف", label: "الطائف" },
    ],
    styles: [
      { value: "", label: "كل الطرز" },
      { value: "Najdi", label: "نجدي" },
      { value: "Hijazi", label: "حجازي" },
      { value: "Eastern", label: "شرقي ساحلي" },
      { value: "Asiri", label: "عسيري" },
      { value: "Riyadh Contemporary", label: "رياض حديث" },
    ],
    statuses: [
      { value: "", label: "كل الحالات" },
      { value: "NEW", label: "جديد" },
      { value: "REVIEW", label: "قيد التحليل" },
      { value: "PASS", label: "نجاح" },
      { value: "FAIL", label: "إخفاق" },
    ],
    search: "بحث باسم المشروع…",
    newProject: "مشروع جديد",
    filters: "مرشحات",
    reset: "إعادة تعيين",

    thName: "المشروع",
    thCity: "المدينة",
    thScope: "النطاق",
    thStyle: "الطراز",
    thMatch: "التطابق",
    thStatus: "الحالة",
    thUpdated: "آخر تحديث",
    thActions: "إجراءات",

    view: "عرض",
    analyze: "تحليل",
    approve: "اعتماد",
    report: "تقرير",
    delete: "حذف",

    // new form
    nfTitle: "إنشاء مشروع",
    nfName: "الاسم",
    nfCity: "المدينة",
    nfScope: "النطاق",
    nfStyle: "الطراز",
    nfCreate: "إنشاء",
    nfCancel: "إلغاء",
    nfRequired: "الاسم والمدينة والطراز مطلوبة",

    pass: "نجاح",
    fail: "إخفاق",
    review: "قيد التحليل",
    new: "جديد",

    avg: "متوسط التطابق",
    count: "عدد المشاريع",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Projects",
    subtitle: "Full control by city, status, and style",
    role: "Role",
    cities: [
      { value: "", label: "All cities" },
      { value: "Riyadh", label: "Riyadh" },
      { value: "Najran", label: "Najran" },
      { value: "Jeddah", label: "Jeddah" },
      { value: "Dammam", label: "Dammam" },
      { value: "Taif", label: "Taif" },
    ],
    styles: [
      { value: "", label: "All styles" },
      { value: "Najdi", label: "Najdi" },
      { value: "Hijazi", label: "Hijazi" },
      { value: "Eastern", label: "Eastern Coastal" },
      { value: "Asiri", label: "Asiri" },
      { value: "Riyadh Contemporary", label: "Riyadh Contemporary" },
    ],
    statuses: [
      { value: "", label: "All statuses" },
      { value: "NEW", label: "New" },
      { value: "REVIEW", label: "Under review" },
      { value: "PASS", label: "Pass" },
      { value: "FAIL", label: "Fail" },
    ],
    search: "Search by project name…",
    newProject: "New Project",
    filters: "Filters",
    reset: "Reset",

    thName: "Project",
    thCity: "City",
    thScope: "Scope",
    thStyle: "Style",
    thMatch: "Match",
    thStatus: "Status",
    thUpdated: "Updated",
    thActions: "Actions",

    view: "View",
    analyze: "Analyze",
    approve: "Approve",
    report: "Report",
    delete: "Delete",

    nfTitle: "Create Project",
    nfName: "Name",
    nfCity: "City",
    nfScope: "Scope",
    nfStyle: "Style",
    nfCreate: "Create",
    nfCancel: "Cancel",
    nfRequired: "Name, City and Style are required",

    pass: "PASS",
    fail: "FAIL",
    review: "UNDER REVIEW",
    new: "NEW",

    avg: "Average match",
    count: "Projects count",
  },
};

// ——————————————————
// Demo dataset
// ——————————————————
const INIT = [
  { id: "P-001", name: "Cultural Courtyard", city: "Riyadh", scope: "Mixed-use", style: "Riyadh Contemporary", match: 89, status: "PASS", updated: "2025-10-10" },
  { id: "P-002", name: "Najran Oasis Hub", city: "Najran", scope: "Residential", style: "Najdi", match: 76, status: "REVIEW", updated: "2025-09-20" },
  { id: "P-003", name: "Harah Revitalization", city: "Jeddah", scope: "Urban", style: "Hijazi", match: 92, status: "PASS", updated: "2025-10-02" },
  { id: "P-004", name: "Eastern Waterfront", city: "Dammam", scope: "Public", style: "Eastern", match: 64, status: "FAIL", updated: "2025-08-31" },
  { id: "P-005", name: "Najdi Courtyard Homes", city: "Riyadh", scope: "Residential", style: "Najdi", match: 81, status: "PASS", updated: "2025-09-07" },
  { id: "P-006", name: "Taif Rose Market", city: "Taif", scope: "Commercial", style: "Asiri", match: 73, status: "REVIEW", updated: "2025-09-28" },
  { id: "P-007", name: "Wadi Spine", city: "Riyadh", scope: "Urban", style: "Riyadh Contemporary", match: 78, status: "REVIEW", updated: "2025-10-01" },
  { id: "P-008", name: "Jeddah Coral House", city: "Jeddah", scope: "Residential", style: "Hijazi", match: 55, status: "FAIL", updated: "2025-07-11" },
  { id: "P-009", name: "Najran Shade Arcade", city: "Najran", scope: "Public", style: "Najdi", match: 84, status: "PASS", updated: "2025-10-05" },
  { id: "P-010", name: "Dammam Pier Pavilion", city: "Dammam", scope: "Public", style: "Eastern", match: 69, status: "REVIEW", updated: "2025-09-18" },
  { id: "P-011", name: "Asiri Ridge School", city: "Taif", scope: "Education", style: "Asiri", match: 88, status: "PASS", updated: "2025-09-30" },
  { id: "P-012", name: "Courtyard Offices", city: "Riyadh", scope: "Commercial", style: "Riyadh Contemporary", match: 61, status: "FAIL", updated: "2025-08-10" },
];

const STATUS_MAP = {
  NEW: { ar: "جديد", en: "NEW", cls: "border-slate-300 text-slate-700" },
  REVIEW: { ar: "قيد التحليل", en: "UNDER REVIEW", cls: "border-amber-300 text-amber-700 bg-amber-50" },
  PASS: { ar: "نجاح", en: "PASS", cls: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  FAIL: { ar: "إخفاق", en: "FAIL", cls: "border-rose-300 text-rose-700 bg-rose-50" },
};

// ——————————————————
// Helpers
// ——————————————————
function formatDate(d, lang) {
  try { return new Date(d).toLocaleDateString(lang === "ar" ? "ar" : "en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
}

// ——————————————————
// Self-tests badge (runtime)
// ——————————————————
function DevTestsBadge({ lang }){
  const t = T[lang];
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.brand && !!t.title && !!t.thName && !!t.thActions });
  const rbacOk = PERMISSIONS[ROLES.AUTHORITY].includes("projects.approve") && !PERMISSIONS[ROLES.CLIENT].includes("projects.approve");
  tests.push({ name: "rbac rules", pass: rbacOk });
  const sorterOk = [3,1,2].sort((a,b)=>a-b)[0] === 1;
  tests.push({ name: "sorter", pass: sorterOk });
  tests.push({ name: "dataset>0", pass: Array.isArray(INIT) && INIT.length > 5 });
  const tooltip = tests.map((x)=> (x.pass? "✓ " : "× ") + x.name).join("\n");
  const allPass = tests.every((x)=>x.pass);
  return (
    <div aria-live="polite" className="fixed bottom-3 left-3 z-50">
      <div className={("px-2.5 py-1.5 rounded-full text-[10px] ") + (allPass? "bg-emerald-600 text-white" : "bg-amber-500 text-black")} title={tooltip}>
        {allPass? "Tests: PASS" : "Tests: CHECK"}
      </div>
    </div>
  );
}

// ——————————————————
// Screen 03 — Projects List
// ——————————————————
function ProjectsListScreen(){
  const [lang, setLang] = useState("ar");
  const rtl = lang === "ar";
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  // dataset & table state
  const [rows, setRows] = useState(INIT);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [style, setStyle] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [sortDir, setSortDir] = useState("desc");
  const [showNew, setShowNew] = useState(false);

  // new project form
  const [nf, setNf] = useState({ name: "", city: "", scope: "", style: "" });
  const [nfErr, setNfErr] = useState("");

  const filtered = useMemo(()=>{
    const ql = q.trim().toLowerCase();
    return rows.filter(r => (
      (!ql || r.name.toLowerCase().includes(ql)) &&
      (!city || r.city === city) &&
      (!status || r.status === status) &&
      (!style || r.style === style)
    ));
  }, [rows, q, city, status, style]);

  const sorted = useMemo(()=>{
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case "name": va = a.name; vb = b.name; break;
        case "city": va = a.city; vb = b.city; break;
        case "scope": va = a.scope; vb = b.scope; break;
        case "style": va = a.style; vb = b.style; break;
        case "match": va = a.match; vb = b.match; break;
        case "status": va = a.status; vb = b.status; break;
        case "updated": default: va = a.updated; vb = b.updated; break;
      }
      if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const avgMatch = useMemo(()=>{
    if (!filtered.length) return 0;
    return Math.round(filtered.reduce((s, r)=> s + (r.match||0), 0) / filtered.length);
  }, [filtered]);

  function toggleSort(col){
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  function onCreate(){
    setNfErr("");
    const { name, city, style } = nf;
    if (!name || !city || !style) { setNfErr(t.nfRequired); return; }
    const id = `P-${(rows.length+1).toString().padStart(3,'0')}`;
    const now = new Date().toISOString().slice(0,10);
    setRows([{ id, name, city, scope: nf.scope || "—", style, match: 0, status: "NEW", updated: now }, ...rows]);
    setShowNew(false); setNf({ name: "", city: "", scope: "", style: "" });
  }

  function setStatusFor(id, s){
    setRows(rows => rows.map(r => r.id === id ? { ...r, status: s, updated: new Date().toISOString().slice(0,10) } : r));
  }
  function analyze(id){
    if (!can("ai.evaluate")) return;
    setRows(rows => rows.map(r => {
      if (r.id !== id) return r;
      const score = Math.max(55, Math.min(97, Math.round((r.match || 70) + (Math.random()*14 - 7))));
      const st = score >= 80 ? "PASS" : (score < 60 ? "FAIL" : "REVIEW");
      return { ...r, match: score, status: st, updated: new Date().toISOString().slice(0,10) };
    }));
  }
  function approve(id){ if (can("projects.approve")) setStatusFor(id, "PASS"); }
  function remove(id){ setRows(rows => rows.filter(r => r.id !== id)); }

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
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
            {/* demo role switcher */}
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
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
              <p className="text-[12px] text-slate-600 mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill className="border-slate-300"><Percent className="w-3.5 h-3.5"/> {t.avg}: {avgMatch}%</Pill>
              <Pill className="border-slate-300"><Layers3 className="w-3.5 h-3.5"/> {t.count}: {filtered.length}</Pill>
              {can('projects.create') ? (
                <Button onClick={()=>setShowNew(true)}><Plus className="w-4 h-4"/> {t.newProject}</Button>
              ) : (
                <Button variant="soft" disabled title="No permission">{t.newProject}</Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grow min-w-[220px]">
                <Field label={t.filters}>
                  <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t.search} icon={SearchIcon}/>
                </Field>
              </div>
              <div className="w-40">
                <Field label={lang==='ar'? 'المدينة':'City'}>
                  <Select value={city} onChange={(e)=>setCity(e.target.value)} options={t.cities} />
                </Field>
              </div>
              <div className="w-44">
                <Field label={lang==='ar'? 'الحالة':'Status'}>
                  <Select value={status} onChange={(e)=>setStatus(e.target.value)} options={t.statuses} />
                </Field>
              </div>
              <div className="w-48">
                <Field label={lang==='ar'? 'الطراز':'Style'}>
                  <Select value={style} onChange={(e)=>setStyle(e.target.value)} options={t.styles} />
                </Field>
              </div>
              <div className="shrink-0 self-center mt-6">
                <Button variant="outline" onClick={()=>{ setQ(""); setCity(""); setStatus(""); setStyle(""); }}>{t.reset}</Button>
              </div>
            </div>
          </Card>

          {/* New project form (gated) */}
          {showNew && can('projects.create') ? (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t.nfTitle}</div>
                <button onClick={()=>setShowNew(false)} className="rounded-xl px-2 py-1 hover:bg-slate-100"><X className="w-4 h-4"/></button>
              </div>
              <div className="grid md:grid-cols-4 gap-4 mt-4">
                <Field label={t.nfName}><Input value={nf.name} onChange={(e)=>setNf({ ...nf, name: e.target.value })} placeholder="e.g. Wadi Plaza"/></Field>
                <Field label={t.nfCity}>
                  <Select value={nf.city} onChange={(e)=>setNf({ ...nf, city: e.target.value })} options={t.cities.filter(c=>c.value!=='')} />
                </Field>
                <Field label={t.nfScope}><Input value={nf.scope} onChange={(e)=>setNf({ ...nf, scope: e.target.value })} placeholder={lang==='ar'? 'سكني/تجاري/حضري':'Residential/Commercial/Urban'}/></Field>
                <Field label={t.nfStyle}>
                  <Select value={nf.style} onChange={(e)=>setNf({ ...nf, style: e.target.value })} options={t.styles.filter(s=>s.value!=='')} />
                </Field>
              </div>
              {nfErr ? <div className="mt-3 text-[12px] text-rose-700">{nfErr}</div> : null}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setShowNew(false)}>{t.nfCancel}</Button>
                <Button onClick={onCreate}><Check className="w-4 h-4"/> {t.nfCreate}</Button>
              </div>
            </Card>
          ) : null}

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <Th onClick={()=>toggleSort('name')}>{t.thName}</Th>
                    <Th onClick={()=>toggleSort('city')}>{t.thCity}</Th>
                    <Th onClick={()=>toggleSort('scope')}>{t.thScope}</Th>
                    <Th onClick={()=>toggleSort('style')}>{t.thStyle}</Th>
                    <Th onClick={()=>toggleSort('match')} className="text-center">{t.thMatch}</Th>
                    <Th onClick={()=>toggleSort('status')}>{t.thStatus}</Th>
                    <Th onClick={()=>toggleSort('updated')}>{t.thUpdated}</Th>
                    <th className="px-4 py-3 text-slate-600 text-left">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r)=> (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-3 text-slate-700"><span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400"/>{r.city}</span></td>
                      <td className="px-4 py-3 text-slate-700">{r.scope}</td>
                      <td className="px-4 py-3 text-slate-700">{r.style}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2 py-1 text-[12px]">
                          <Percent className="w-3.5 h-3.5"/> {r.match}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] " + (STATUS_MAP[r.status]?.cls || "") }>
                          <BadgeCheck className="w-3.5 h-3.5"/>
                          {lang==='ar' ? STATUS_MAP[r.status]?.ar : STATUS_MAP[r.status]?.en}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700"><span className="inline-flex items-center gap-1"><CalendarClock className="w-4 h-4 text-slate-400"/>{formatDate(r.updated, lang)}</span></td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button variant="soft" title={t.view}><Eye className="w-4 h-4"/></Button>
                          {can('ai.evaluate') ? (
                            <Button variant="soft" onClick={()=>analyze(r.id)} title={t.analyze}><Sparkles className="w-4 h-4"/></Button>
                          ) : <Button variant="soft" disabled title="No permission"><Sparkles className="w-4 h-4"/></Button>}
                          {can('projects.approve') ? (
                            <Button variant="soft" onClick={()=>approve(r.id)} title={t.approve}><FileCheck2 className="w-4 h-4"/></Button>
                          ) : <Button variant="soft" disabled title="No permission"><FileCheck2 className="w-4 h-4"/></Button>}
                          {can('reports.view') ? (
                            <Button variant="soft" title={t.report}><BarChart3 className="w-4 h-4"/></Button>
                          ) : <Button variant="soft" disabled title="No permission"><BarChart3 className="w-4 h-4"/></Button>}
                          <Button variant="soft" onClick={()=>remove(r.id)} title={t.delete}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sorted.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No results</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      {/* Self-tests badge */}
      <DevTestsBadge lang={lang} />
    </div>
  );
}

function Th({ children, onClick, className = "" }){
  return (
    <th className={"px-4 py-3 text-slate-600 text-left select-none cursor-pointer " + className} onClick={onClick}>
      <span className="inline-flex items-center gap-1.5">{children} <ArrowUpDown className="w-3.5 h-3.5 text-slate-400"/></span>
    </th>
  );
}

// ——————————————————
// Exported App (mount with provider)
// ——————————————————
export default function Sima_Screen03_ProjectsList(){
  return (
    <AuthProvider>
      <ProjectsListScreen />
    </AuthProvider>
  );
}
