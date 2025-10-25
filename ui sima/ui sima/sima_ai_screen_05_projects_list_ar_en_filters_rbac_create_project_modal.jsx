import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 05: Projects List
 * - Data table (name, city, scope, style, compliance, status, updated)
 * - Filters: role, city, status; search; sort; pagination (client)
 * - Create Project modal with basic validation
 * - i18n AR/EN + RTL; inline SVG icons (no CDNs)
 * - Row actions: View, Analyze, Report (hrefs as placeholders)
 * - Self tests badge (PASS when schema & i18n & data ok)
 * - Accessible: focus rings, aria-labels, keyboard nav
 */

// —————————————————— i18n ——————————————————
const T = {
  ar: {
    brand: "Sima AI — إدارة المشاريع",
    title: "قائمة المشاريع",
    search: "ابحث باسم المشروع أو الجهة…",
    filters: { role: "الدور", city: "المدينة", status: "الحالة" },
    roles: { authority: "جهة الاعتماد", consultant: "استشاري", client: "عميل" },
    statuses: { PASS: "ناجح", FAIL: "فاشل", UNDER_REVIEW: "قيد المراجعة" },
    columns: { name: "المشروع", city: "المدينة", scope: "النطاق", style: "الطراز", compliance: "التطابق", status: "الحالة", updated: "آخر تحديث" },
    newProject: "مشروع جديد",
    bulk: "استيراد دفعة",
    clear: "مسح",
    rows: "صفوف",
    of: "من",
    actions: { view: "عرض", analyze: "تحليل", report: "تقرير" },
    modal: {
      title: "إنشاء مشروع جديد",
      name: "اسم المشروع",
      city: "المدينة",
      scope: "النطاق/الاستخدام",
      style: "الطراز المعماري",
      files: "ملفات (PDF/DWG/IFC)",
      create: "إنشاء",
      cancel: "إلغاء",
      required: "هذا الحقل مطلوب"
    }
  },
  en: {
    brand: "Sima AI — Projects Control",
    title: "Projects List",
    search: "Search by name or organization…",
    filters: { role: "Role", city: "City", status: "Status" },
    roles: { authority: "Authority", consultant: "Consultant", client: "Client" },
    statuses: { PASS: "PASS", FAIL: "FAIL", UNDER_REVIEW: "Under review" },
    columns: { name: "Project", city: "City", scope: "Scope", style: "Style", compliance: "Compliance", status: "Status", updated: "Updated" },
    newProject: "New Project",
    bulk: "Bulk Import",
    clear: "Clear",
    rows: "rows",
    of: "of",
    actions: { view: "View", analyze: "Analyze", report: "Report" },
    modal: {
      title: "Create New Project",
      name: "Project name",
      city: "City",
      scope: "Scope/Use",
      style: "Architectural style",
      files: "Files (PDF/DWG/IFC)",
      create: "Create",
      cancel: "Cancel",
      required: "This field is required"
    }
  }
};

// —————————————————— helpers ——————————————————
const cls=(...a:string[])=>a.filter(Boolean).join(" ");
const ROLES = ["authority","consultant","client"] as const;
const STATUSES = ["PASS","FAIL","UNDER_REVIEW"] as const;

// simple data (seed) — realistic Arabic cities & styles
const SEED = [
  { id:"P-1001", name:"مبنى سكني — العليا", org:"مكتب عمران الرياض", city:"الرياض", scope:"سكني", style:"نجدي مركزي", compliance:88, status:"PASS", updated:"2025-10-20" },
  { id:"P-1002", name:"مجمع تجاري — الظهران", org:"استشارات الشرقية", city:"الدمام", scope:"تجاري", style:"الساحل الشرقي", compliance:61, status:"UNDER_REVIEW", updated:"2025-10-18" },
  { id:"P-1003", name:"فندق تراثي — وسط جدة", org:"معمار الحجاز", city:"جدة", scope:"فندقي", style:"حجازي ساحلي", compliance:74, status:"PASS", updated:"2025-10-17" },
  { id:"P-1004", name:"جامعة تقنية — أبها", org:"استوديو عسير", city:"أبها", scope:"تعليمي", style:"مرتفعات أبها", compliance:52, status:"FAIL", updated:"2025-10-14" },
  { id:"P-1005", name:"مركز ثقافي — نجران", org:"نجران للتطوير", city:"نجران", scope:"ثقافي", style:"نجران", compliance:69, status:"UNDER_REVIEW", updated:"2025-10-12" },
  { id:"P-1006", name:"واجهة بحرية — تبوك", org:"شمال الساحل", city:"تبوك", scope:"سياحي", style:"ساحل تبوك", compliance:81, status:"PASS", updated:"2025-10-10" },
  { id:"P-1007", name:"مستشفى عام — بيشة", org:"صحة بيشة", city:"بيشة", scope:"صحي", style:"بيشة الصحراوية", compliance:58, status:"UNDER_REVIEW", updated:"2025-10-09" },
  { id:"P-1008", name:"متحف — الهفوف", org:"الأحساء", city:"الهفوف", scope:"ثقافي", style:"واحات الأحساء", compliance:77, status:"PASS", updated:"2025-10-08" },
  { id:"P-1009", name:"مركز أعمال — القطيف", org:"الشرقية الحديثة", city:"القطيف", scope:"مكتبي", style:"القطيف", compliance:64, status:"UNDER_REVIEW", updated:"2025-10-06" },
  { id:"P-1010", name:"سوق تراثي — الطائف", org:"طائف عمران", city:"الطائف", scope:"تجاري", style:"الطائف", compliance:72, status:"PASS", updated:"2025-10-02" },
  { id:"P-1011", name:"إسكان — عنيزة", org:"القصيم", city:"عنيزة", scope:"سكني", style:"نجدية شرقية", compliance:47, status:"FAIL", updated:"2025-09-30" },
  { id:"P-1012", name:"كورنيش — جازان", org:"جزر فرسان", city:"جازان", scope:"سياحي", style:"جزر فرسان", compliance:85, status:"PASS", updated:"2025-09-29" }
] as const;

// inline icons
const Icons = {
  logo: ()=> (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.6"/></svg>),
  plus: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/></svg>),
  upload: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 16V6m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.8"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5"/></svg>),
  search: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M21 21l-3.4-3.4" stroke="currentColor" strokeWidth="1.6"/></svg>),
  chevron: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/></svg>),
  pass: ()=> (<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">PASS</span>),
  fail: ()=> (<span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px]">FAIL</span>),
  review: ()=> (<span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px]">Review</span>),
  close: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2"/></svg>),
};

// modal
function Modal({open,onClose,children,title}:{open:boolean; onClose:()=>void; children:React.ReactNode; title:string}){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">{title}</h3>
            <button aria-label="close" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-50"><Icons.close/></button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

// progress pill
function Compliance({v}:{v:number}){
  const pct = Math.max(0, Math.min(v, 100));
  const tone = pct>=75?"bg-emerald-100 text-emerald-800":pct>=60?"bg-amber-100 text-amber-900":"bg-rose-100 text-rose-800";
  return (
    <div className={cls("min-w-[72px] inline-flex items-center justify-center rounded-full text-[11px] px-2 py-0.5", tone)}>{pct}%</div>
  );
}

export default function SimaProjectsList(){
  const [lang,setLang]=useState<"ar"|"en">("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  // state
  const [role,setRole]=useState<typeof ROLES[number]>("consultant");
  const [q,setQ]=useState("");
  const [city,setCity]=useState<string>("");
  const [status,setStatus]=useState<typeof STATUSES[number]|"">("");
  const [sortKey,setSortKey]=useState<keyof typeof SEED[number]>("updated");
  const [sortDir,setSortDir]=useState<"asc"|"desc">("desc");
  const [page,setPage]=useState(1);
  const pageSize=8;

  const cities = useMemo(()=>Array.from(new Set(SEED.map(r=>r.city))),[]);

  // derived
  const filtered = useMemo(()=>{
    let rows = SEED.slice();
    if(q){ const needle=q.toLowerCase(); rows = rows.filter(r=> (r.name+" "+r.org).toLowerCase().includes(needle)); }
    if(city){ rows = rows.filter(r=> r.city===city); }
    if(status){ rows = rows.filter(r=> r.status===status); }
    rows.sort((a:any,b:any)=>{
      const A=a[sortKey], B=b[sortKey];
      if(sortKey==="updated") return sortDir==="asc"? (A>B?1:-1) : (A<B?1:-1);
      if(typeof A==="number" && typeof B==="number") return sortDir==="asc"?A-B:B-A;
      return sortDir==="asc"? String(A).localeCompare(String(B)) : String(B).localeCompare(String(A));
    });
    return rows;
  },[q,city,status,sortKey,sortDir]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total/pageSize));
  const start = (page-1)*pageSize;
  const view = filtered.slice(start, start+pageSize);

  useEffect(()=>{ if(page>pages) setPage(1); },[pages]);

  // modal create
  const [open,setOpen]=useState(false);
  const [np, setNP] = useState({ name:"", city:"", scope:"", style:"" });
  const [err, setErr] = useState<Record<string,string>>({});

  function createProject(e:React.FormEvent){
    e.preventDefault();
    const E:Record<string,string>={};
    if(!np.name) E.name=t.modal.required;
    if(!np.city) E.city=t.modal.required;
    if(!np.scope) E.scope=t.modal.required;
    if(!np.style) E.style=t.modal.required;
    setErr(E);
    if(Object.keys(E).length) return;
    alert((rtl?"تم إنشاء المشروع: ":"Created: ")+np.name+ (rtl?" — سيتم نقلك لصفحة التفاصيل.":" — redirecting to overview."));
    setOpen(false);
  }

  // self tests
  const tests = useMemo(()=>{
    const hasCols = !!T.ar.columns && !!T.en.columns;
    const hasData = SEED.length>=10 && SEED.every(r=> typeof r.compliance==="number" && r.compliance>=0 && r.compliance<=100);
    const hasI18n = !!T.ar && !!T.en && !!T.ar.filters.role && !!T.en.filters.role;
    return { ok: hasCols && hasData && hasI18n, tip: `cols:${hasCols} data:${hasData} i18n:${hasI18n}` };
  },[]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Icons.logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{document.documentElement.classList.toggle('dark')}} className="px-3 py-1.5 rounded-xl text-sm text-slate-600 hover:text-slate-900">☾/☀︎</button>
            <button onClick={()=>setLang("ar")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='ar'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>عربي</button>
            <button onClick={()=>setLang("en")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='en'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>EN</button>
          </div>
        </div>
      </header>

      {/* Hero / Controls */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">{t.title}</h1>
            <div className="text-[12px] text-slate-600 mt-1">RBAC: {t.roles[role]}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm"><Icons.plus/> {t.newProject}</button>
            <button onClick={()=>alert('Bulk import placeholder — CSV/Excel ingest.')} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-800"><Icons.upload/> {t.bulk}</button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <label className="relative block">
              <span className="sr-only">{t.search}</span>
              <input value={q} onChange={e=>{setQ(e.target.value); setPage(1);}} placeholder={t.search} className="w-full rounded-2xl border border-slate-300 px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
              <span className="absolute top-1/2 -translate-y-1/2" style={{[rtl?"right":"left"]: "10px"} as any}><Icons.search/></span>
            </label>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-4 gap-2">
            {/* role */}
            <select aria-label={t.filters.role} value={role} onChange={e=>setRole(e.target.value as any)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              {ROLES.map(r=>(<option key={r} value={r}>{t.roles[r]}</option>))}
            </select>
            {/* city */}
            <select aria-label={t.filters.city} value={city} onChange={e=>{setCity(e.target.value); setPage(1);}} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="">{t.clear} {t.filters.city}</option>
              {cities.map(c=>(<option key={c} value={c}>{c}</option>))}
            </select>
            {/* status */}
            <select aria-label={t.filters.status} value={status} onChange={e=>{setStatus(e.target.value as any); setPage(1);}} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="">{t.clear} {t.filters.status}</option>
              {STATUSES.map(s=>(<option key={s} value={s}>{t.statuses[s as keyof typeof t.statuses]}</option>))}
            </select>
            {/* sort */}
            <select aria-label="sort" value={`${sortKey}:${sortDir}`} onChange={e=>{const [k,d]=e.target.value.split(":"); setSortKey(k as any); setSortDir(d as any);}} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="updated:desc">{t.columns.updated} ↓</option>
              <option value="updated:asc">{t.columns.updated} ↑</option>
              <option value="compliance:desc">{t.columns.compliance} ↓</option>
              <option value="compliance:asc">{t.columns.compliance} ↑</option>
              <option value="city:asc">{t.columns.city} A→Z</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[12px] text-slate-600">
                <th className="px-3">{t.columns.name}</th>
                <th className="px-3">{t.columns.city}</th>
                <th className="px-3">{t.columns.scope}</th>
                <th className="px-3">{t.columns.style}</th>
                <th className="px-3">{t.columns.compliance}</th>
                <th className="px-3">{t.columns.status}</th>
                <th className="px-3">{t.columns.updated}</th>
                <th className="px-3"></th>
              </tr>
            </thead>
            <tbody>
              {view.map(r=> (
                <tr key={r.id} className="bg-white rounded-2xl shadow-sm align-middle">
                  <td className="px-3 py-3">
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-[11px] text-slate-500">{r.org}</div>
                  </td>
                  <td className="px-3 text-sm">{r.city}</td>
                  <td className="px-3 text-sm">{r.scope}</td>
                  <td className="px-3 text-sm">{r.style}</td>
                  <td className="px-3"><Compliance v={r.compliance}/></td>
                  <td className="px-3">
                    {r.status==="PASS"? <Icons.pass/> : r.status==="FAIL"? <Icons.fail/>: <Icons.review/>}
                  </td>
                  <td className="px-3 text-sm text-slate-600">{r.updated}</td>
                  <td className="px-3">
                    <div className="flex gap-1">
                      <a className="text-[11px] underline decoration-slate-300 hover:decoration-slate-700" href={`/project/${r.id}`}>{t.actions.view}</a>
                      <span className="text-slate-300">•</span>
                      <a className="text-[11px] underline decoration-slate-300 hover:decoration-slate-700" href={`/project/${r.id}/analysis`}>{t.actions.analyze}</a>
                      <span className="text-slate-300">•</span>
                      <a className="text-[11px] underline decoration-slate-300 hover:decoration-slate-700" href={`/certificate/${r.id}`}>{t.actions.report}</a>
                    </div>
                  </td>
                </tr>
              ))}
              {view.length===0 && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-500 text-sm py-12">{rtl?"لا توجد نتائج مطابقة":"No matching results"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-[12px] text-slate-600">
          <div>{t.rows}: <span className="font-medium">{start+1}-{Math.min(start+pageSize,total)}</span> {t.of} {total}</div>
          <div className="flex items-center gap-2">
            <button aria-label="prev" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className={cls("rounded-lg border px-2 py-1", page===1?"opacity-40 cursor-not-allowed":"hover:bg-slate-50 border-slate-300")}>
              {rtl? <Icons.chevron/> : <span style={{transform:'rotate(180deg)'}}><Icons.chevron/></span>}
            </button>
            <div className="min-w-[60px] text-center">{page}/{pages}</div>
            <button aria-label="next" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className={cls("rounded-lg border px-2 py-1", page===pages?"opacity-40 cursor-not-allowed":"hover:bg-slate-50 border-slate-300")}>
              {rtl? <span style={{transform:'rotate(180deg)'}}><Icons.chevron/></span> : <Icons.chevron/>}
            </button>
          </div>
        </div>
      </main>

      {/* Modal: Create */}
      <Modal open={open} onClose={()=>setOpen(false)} title={t.modal.title}>
        <form onSubmit={createProject} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>{t.modal.name}</span>
            <input value={np.name} onChange={e=>setNP({...np, name:e.target.value})} className={cls("rounded-xl border px-3 py-2 text-sm", err.name?"border-rose-400":"border-slate-300")} />
            {err.name && <div className="text-rose-600 text-[11px]">{err.name}</div>}
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>{t.modal.city}</span>
              <input value={np.city} onChange={e=>setNP({...np, city:e.target.value})} className={cls("rounded-xl border px-3 py-2 text-sm", err.city?"border-rose-400":"border-slate-300")} />
              {err.city && <div className="text-rose-600 text-[11px]">{err.city}</div>}
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t.modal.scope}</span>
              <input value={np.scope} onChange={e=>setNP({...np, scope:e.target.value})} className={cls("rounded-xl border px-3 py-2 text-sm", err.scope?"border-rose-400":"border-slate-300")} />
              {err.scope && <div className="text-rose-600 text-[11px]">{err.scope}</div>}
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>{t.modal.style}</span>
            <input value={np.style} onChange={e=>setNP({...np, style:e.target.value})} className={cls("rounded-xl border px-3 py-2 text-sm", err.style?"border-rose-400":"border-slate-300")} />
            {err.style && <div className="text-rose-600 text-[11px]">{err.style}</div>}
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t.modal.files}</span>
            <input type="file" multiple className="rounded-xl border px-3 py-2 text-sm border-slate-300" />
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={()=>setOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">{t.modal.cancel}</button>
            <button type="submit" className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">{t.modal.create}</button>
          </div>
        </form>
      </Modal>

      {/* footer */}
      <footer className="py-8 border-t border-slate-200 text-center text-[11px] text-slate-600">Sima AI · Projects List</footer>

      {/* tests badge */}
      <div className="fixed bottom-3 left-3 z-50">
        <div title={tests.tip} className={cls("px-2.5 py-1.5 rounded-full text-[10px]", tests.ok?"bg-emerald-600 text-white":"bg-amber-500 text-black")}>{tests.ok?"Tests: PASS":"Tests: CHECK"}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}
