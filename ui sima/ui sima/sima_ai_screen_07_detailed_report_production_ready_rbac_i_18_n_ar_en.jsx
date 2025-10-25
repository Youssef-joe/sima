import React, { useMemo, useState, useContext, useMemo as useMemo2 } from "react";
import {
  Shield,
  FileText,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Percent,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  ClipboardList,
} from "lucide-react";

/**
 * Sima AI — Screen 07: Detailed Report (Standalone)
 * - Per-guideline breakdown with status, score, project text, recommendation, and "apply fix" preview.
 * - Filters (status/category), search, sorting, export JSON, print.
 * - RBAC: requires `reports.view` to see content.
 * - i18n AR/EN with RTL; Self-tests badge covers i18n, RBAC, and score/status mapping.
 * - All JSX blocks closed; icons chosen from stable set to avoid CDN issues.
 */

// ——————————————————
// RBAC
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
  [ROLES.CLIENT]: ["projects.view"], // intentionally no reports.view
};

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
      "inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition " +
      (variant === "solid"
        ? "bg-slate-900 text-white hover:bg-slate-700 "
        : variant === "outline"
        ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
        : variant === "soft"
        ? "bg-slate-100 text-slate-900 hover:bg-slate-200 "
        : variant === "ghost"
        ? "bg-transparent text-slate-900 hover:bg-slate-100 "
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
function Input({ ...props }){
  return (
    <input
      className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      {...props}
    />
  );
}
function Select({ options, ...props }){
  return (
    <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
      {options.map((o, i)=> <option key={i} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Progress({ value }){
  const v = Math.max(0, Math.min(100, value|0));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full bg-slate-900" style={{ width: `${v}%` }} />
    </div>
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
    title: "التقرير التفصيلي",
    subtitle: "عرض البنود بندًا بندًا مع الحالة والتوصيات والمقارنة قبل/بعد",
    role: "الدور",

    // controls
    search: "بحث في البنود…",
    statusAll: "كل الحالات",
    statusPASS: "نجاح",
    statusREVIEW: "قيد المراجعة",
    statusFAIL: "إخفاق",
    catAll: "كل المحاور",
    identity: "الهوية",
    climate: "المناخ",
    function: "الوظيفة",
    human: "الإنسان",
    context: "السياق",

    export: "تصدير JSON",
    print: "طباعة",
    applyAll: "تطبيق كل التحسينات",
    clearAll: "إلغاء كل التحسينات",

    // table
    clause: "المرجع",
    item: "البند",
    projectText: "نص المشروع",
    score: "النتيجة",
    proposed: "بعد التحسين",
    impact: "الأثر",
    status: "الحالة",
    action: "إجراء",
    recommend: "توصية",

    // empty / rbac
    empty: "لا توجد نتائج مطابقة",
    noPerm: "لا تملك صلاحية عرض التقارير (reports.view)",

    PASS: "نجاح",
    FAIL: "إخفاق",
    REVIEW: "قيد المراجعة",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Detailed Report",
    subtitle: "Per-item breakdown with status, recommendations, and before/after preview",
    role: "Role",

    search: "Search items…",
    statusAll: "All statuses",
    statusPASS: "PASS",
    statusREVIEW: "UNDER REVIEW",
    statusFAIL: "FAIL",
    catAll: "All categories",
    identity: "Identity",
    climate: "Climate",
    function: "Function",
    human: "Human",
    context: "Context",

    export: "Export JSON",
    print: "Print",
    applyAll: "Apply all fixes",
    clearAll: "Clear all",

    clause: "Clause",
    item: "Item",
    projectText: "Project text",
    score: "Score",
    proposed: "Proposed",
    impact: "Impact",
    status: "Status",
    action: "Action",
    recommend: "Recommendation",

    empty: "No matching results",
    noPerm: "You don't have permission to view reports (reports.view)",

    PASS: "PASS",
    FAIL: "FAIL",
    REVIEW: "UNDER REVIEW",
  },
};

// ——————————————————
// Demo data
// ——————————————————
function decideStatus(score){ return score >= 80 ? 'PASS' : (score < 60 ? 'FAIL' : 'REVIEW'); }
const BASE_ITEMS = [
  { code: 'DASC-1.1', cat: 'identity', clause: '1.1', ar: 'انسجام الواجهة مع الطراز المحلي', en: 'Facade harmony with local style', arP:'الواجهة الغربية تحتوي على فتحات واسعة وكسوة حجرية', enP:'West facade has large openings and stone cladding', score: 68, impact: 14, recAr:'تقليل WWR للواجهة الغربية إلى 35% وإضافة مشربيات', recEn:'Reduce west WWR to 35% and add mashrabiya screens' },
  { code: 'DASC-1.3', cat: 'identity', clause: '1.3', ar: 'المواد المحلية', en: 'Local materials', arP:'استخدام ألمنيوم لامع بنسبة عالية', enP:'High share of glossy aluminum', score: 58, impact: 22, recAr:'رفع نسبة الحجر المحلي ومعالجات مطفية', recEn:'Increase local stone use with matte finishes' },
  { code: 'DASC-2.2', cat: 'climate', clause: '2.2', ar: 'التظليل الخارجي', en: 'External shading', arP:'غياب مظلات كافية فوق الفتحات', enP:'Insufficient canopies above openings', score: 62, impact: 18, recAr:'إضافة مظلات أفقية 1.2م على الواجهة الجنوبية', recEn:'Add 1.2m horizontal canopies on south facade' },
  { code: 'DASC-2.4', cat: 'climate', clause: '2.4', ar: 'توجيه الفتحات', en: 'Openings orientation', arP:'غلبة فتحات غرب/شرق', enP:'Openings mostly West/East', score: 55, impact: 25, recAr:'تحويل 40% من الفتحات نحو الشمال', recEn:'Reorient 40% openings to North' },
  { code: 'DASC-3.1', cat: 'function', clause: '3.1', ar: 'تسلسل الدخول', en: 'Entry sequence', arP:'الدخول المباشر إلى الصالة', enP:'Direct entry to living hall', score: 77, impact: 8, recAr:'إضافة دهليز انتقال خصوصي', recEn:'Add privacy foyer' },
  { code: 'DASC-4.3', cat: 'human', clause: '4.3', ar: 'المشاة والظل', en: 'Pedestrian shading', arP:'ممرات مكشوفة صيفًا', enP:'Exposed walkways in summer', score: 61, impact: 16, recAr:'أروقة مظللة وأشجار ظل محلية', recEn:'Shaded arcades and local shade trees' },
  { code: 'DASC-5.2', cat: 'context', clause: '5.2', ar: 'انسجام الارتفاعات', en: 'Heights harmony', arP:'ارتفاع يزيد 2م عن المتوسط', enP:'Height +2m above average', score: 83, impact: 0, recAr:'مطابق', recEn:'Compliant' },
];

// ——————————————————
// Self-tests badge
// ——————————————————
function DevTestsBadge({ t }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.search && !!t.export });
  const rbacOk = PERMISSIONS[ROLES.CONSULTANT].includes('reports.view') && !PERMISSIONS[ROLES.CLIENT].includes('reports.view');
  tests.push({ name: "rbac rules", pass: rbacOk });
  const statusOk = ['PASS','FAIL','REVIEW'].every(s => typeof t[s] === 'string');
  tests.push({ name: "status labels", pass: statusOk });
  const mappingOk = decideStatus(85)==='PASS' && decideStatus(40)==='FAIL' && decideStatus(70)==='REVIEW';
  tests.push({ name: "status mapping", pass: mappingOk });
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
// Screen 07 — Detailed Report
// ——————————————————
function DetailedReportScreen(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  // filters
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all'); // all, PASS, REVIEW, FAIL
  const [catF, setCatF] = useState('all'); // all, identity, climate, function, human, context
  const [sortBy, setSortBy] = useState('score'); // score|impact|code
  const [sortDir, setSortDir] = useState('asc'); // asc|desc

  // items state with applied flag
  const [rows, setRows] = useState(BASE_ITEMS.map((it)=> ({
    ...it,
    status: decideStatus(it.score),
    applied: false,
  })));

  function toggleApply(index){
    setRows(prev => prev.map((r,i)=> i===index ? { ...r, applied: !r.applied } : r));
  }
  function applyAll(){ setRows(prev => prev.map(r=> ({ ...r, applied: true }))); }
  function clearAll(){ setRows(prev => prev.map(r=> ({ ...r, applied: false }))); }

  const filtered = useMemo(()=>{
    return rows.filter(r => {
      const txt = (rtl? r.ar : r.en) + ' ' + (rtl? r.arP : r.enP) + ' ' + r.code;
      if (q && !txt.toLowerCase().includes(q.toLowerCase())) return false;
      if (statusF !== 'all') {
        const st = decideStatus(r.score);
        if (st !== statusF) return false;
      }
      if (catF !== 'all' && r.cat !== catF) return false;
      return true;
    }).sort((a,b)=>{
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'score') return (a.score - b.score) * dir;
      if (sortBy === 'impact') return (a.impact - b.impact) * dir;
      if (sortBy === 'code') return a.code.localeCompare(b.code) * dir;
      return 0;
    });
  }, [rows, q, statusF, catF, sortBy, sortDir, rtl]);

  const overall = useMemo(()=>{
    // simple average of (applied? min(100, score+impact) : score)
    const arr = rows.map(r => Math.min(100, r.score + (r.applied ? r.impact : 0)));
    const avg = Math.round(arr.reduce((a,c)=>a+c,0) / arr.length);
    return { value: avg, status: decideStatus(avg) };
  }, [rows]);

  function exportJSON(){
    const payload = {
      meta: { when: new Date().toISOString() },
      overall,
      items: rows.map(r => ({
        code: r.code,
        category: r.cat,
        clause: r.clause,
        title: rtl? r.ar : r.en,
        project: rtl? r.arP : r.enP,
        score: r.score,
        impact: r.impact,
        applied: r.applied,
        proposed: Math.min(100, r.score + (r.applied? r.impact : 0)),
        status: decideStatus(r.score),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_detailed_report.json'; a.click(); URL.revokeObjectURL(url);
  }

  function onPrint(){ window.print(); }

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
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
                  <Pill className="border-slate-300"><CalendarClock className="w-3.5 h-3.5"/> {new Date().toLocaleString(lang==='ar'? 'ar':'en-US')}</Pill>
                  <Pill className="border-slate-300"><ClipboardList className="w-3.5 h-3.5"/> {BASE_ITEMS.length} items</Pill>
                  <Pill className="border-slate-300"><Percent className="w-3.5 h-3.5"/> {rtl? 'المعدل الكلي':'Overall'}: {overall.value}%</Pill>
                  {overall.status === 'PASS' ? (
                    <Pill className="border-emerald-300 bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5"/> {t.PASS}</Pill>
                  ) : overall.status === 'FAIL' ? (
                    <Pill className="border-rose-300 bg-rose-50 text-rose-700"><XCircle className="w-3.5 h-3.5"/> {t.FAIL}</Pill>
                  ) : (
                    <Pill className="border-amber-300 bg-amber-50 text-amber-700"><AlertTriangle className="w-3.5 h-3.5"/> {t.REVIEW}</Pill>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4"/> {t.export}</Button>
                <Button variant="outline" onClick={onPrint}><Printer className="w-4 h-4"/> {t.print}</Button>
                <div className="w-px h-6 bg-slate-300 mx-1"/>
                <Button variant="soft" onClick={applyAll}>{t.applyAll}</Button>
                <Button variant="ghost" onClick={clearAll}>{t.clearAll}</Button>
              </div>
            </div>

            {!can('reports.view') ? (
              <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4"/> {t.noPerm}
              </div>
            ) : null}

            {/* Controls */}
            <div className="mt-6 grid md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400"/>
                  <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t.search} className="pl-9"/>
                </div>
              </div>
              <Select value={statusF} onChange={(e)=>setStatusF(e.target.value)} options={[
                { value: 'all', label: t.statusAll },
                { value: 'PASS', label: t.statusPASS },
                { value: 'REVIEW', label: t.statusREVIEW },
                { value: 'FAIL', label: t.statusFAIL },
              ]} />
              <Select value={catF} onChange={(e)=>setCatF(e.target.value)} options={[
                { value: 'all', label: t.catAll },
                { value: 'identity', label: t.identity },
                { value: 'climate', label: t.climate },
                { value: 'function', label: t.function },
                { value: 'human', label: t.human },
                { value: 'context', label: t.context },
              ]} />
            </div>

            {/* Table */}
            {can('reports.view') ? (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <Th label={t.clause} sortKey="code" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
                      <th className="px-4 py-2 text-left">{t.item}</th>
                      <th className="px-4 py-2 text-left hidden md:table-cell">{t.projectText}</th>
                      <Th label={t.score} sortKey="score" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
                      <th className="px-4 py-2 text-left">{t.recommend}</th>
                      <Th label={t.impact} sortKey="impact" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
                      <th className="px-4 py-2 text-left">{t.proposed}</th>
                      <th className="px-4 py-2 text-left">{t.status}</th>
                      <th className="px-4 py-2 text-left">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length ? filtered.map((r, idx) => {
                      const proposed = Math.min(100, r.score + (r.applied? r.impact : 0));
                      const st = decideStatus(r.score);
                      return (
                        <tr key={r.code} className="border-t align-top">
                          <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{r.code}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{rtl? r.ar : r.en}</td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{rtl? r.arP : r.enP}</td>
                          <td className="px-4 py-3 text-slate-900">
                            <div className="flex items-center gap-2"><div className="w-10">{r.score}%</div><div className="grow"><Progress value={r.score}/></div></div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{rtl? r.recAr : r.recEn}</td>
                          <td className="px-4 py-3 text-slate-900">+{r.impact}</td>
                          <td className="px-4 py-3 text-slate-900">
                            <div className="flex items-center gap-2"><div className="w-10">{proposed}%</div><div className="grow"><Progress value={proposed}/></div></div>
                          </td>
                          <td className="px-4 py-3">
                            {st === 'PASS' ? (
                              <Pill className="border-emerald-300 bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5"/> {t.PASS}</Pill>
                            ) : st === 'FAIL' ? (
                              <Pill className="border-rose-300 bg-rose-50 text-rose-700"><XCircle className="w-3.5 h-3.5"/> {t.FAIL}</Pill>
                            ) : (
                              <Pill className="border-amber-300 bg-amber-50 text-amber-700"><AlertTriangle className="w-3.5 h-3.5"/> {t.REVIEW}</Pill>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant={r.applied? 'solid':'outline'} onClick={()=>toggleApply(rows.indexOf(r))}>
                              {r.applied ? (rtl? 'إلغاء':'Revert') : (rtl? 'تطبيق':'Apply')}
                            </Button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-500">{t.empty}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Card>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      <DevTestsBadge t={t} />
    </div>
  );
}

function Th({ label, sortKey, sortBy, sortDir, setSortBy, setSortDir }){
  const active = sortBy === sortKey;
  function onClick(){
    if (!active) { setSortBy(sortKey); setSortDir('asc'); }
    else { setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }
  }
  return (
    <th className="px-4 py-2 text-left select-none">
      <button className="inline-flex items-center gap-1" onClick={onClick}>
        {label}
        <ArrowUpDown className={"w-3.5 h-3.5 " + (active? 'text-slate-900':'text-slate-400')} />
      </button>
    </th>
  );
}

// ——————————————————
// Exported App
// ——————————————————
export default function Sima_Screen07_DetailedReport(){
  return (
    <AuthProvider>
      <DetailedReportScreen />
    </AuthProvider>
  );
}
