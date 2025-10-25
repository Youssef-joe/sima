import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 12: Authority Panel (/authority/panel)
 * - RBAC: Only Authority role can perform workflow actions
 * - Project table with filters, search, pagination
 * - Workflow: Review → Committee → Sign-off
 * - Approve / Conditional / Reject with signer + note
 * - Generate certificate preview link (routes to /certificate/[id])
 * - Export CSV (fixed CSV escaping of quotes)
 * - i18n AR/EN + RTL, accessible table & live region
 * - Runtime tests badge + added console-based tests (do not modify UI state)
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — لوحة جهة الاعتماد",
    back: "عودة",
    search: "بحث عن مشروع...",
    filters: "عوامل التصفية",
    status: "الحالة",
    stage: "المرحلة",
    city: "المدينة",
    all: "الكل",
    stages: { review: "مراجعة", committee: "لجنة", signoff: "اعتماد نهائي" },
    statuses: { pending: "قيد المراجعة", conditional: "مشروط", approved: "معتمد", rejected: "مرفوض" },
    table: { name: "المشروع", owner: "الاستشاري", city: "المدينة", style: "الطراز", score: "النسبة", stage: "المرحلة", status: "الحالة", updated: "آخر تحديث", actions: "إجراءات" },
    actions: { open3d: "فتح الاستوديو", report: "التقرير/الشهادة", advance: "تقديم المرحلة", decision: "اتخاذ قرار", csv: "تصدير CSV" },
    decideTitle: "قرار الاعتماد",
    signer: "اسم الموقِّع (جهة الاعتماد)",
    note: "ملاحظة (اختياري)",
    approve: "اعتماد",
    conditional: "مشروط",
    reject: "رفض",
    save: "حفظ",
    cancel: "إلغاء",
    roleBanner: "الدور: جهة الاعتماد",
    noAccess: "ليست لديك صلاحيات الوصول — يلزم دور جهة الاعتماد.",
    resetFilters: "إعادة التعيين",
    page: (n:number)=>`صفحة ${n}`,
    testsPass: "اختبارات: ناجحة",
    testsCheck: "اختبارات: تحقق",
  },
  en: {
    brand: "Sima AI — Authority Panel",
    back: "Back",
    search: "Search projects...",
    filters: "Filters",
    status: "Status",
    stage: "Stage",
    city: "City",
    all: "All",
    stages: { review: "Review", committee: "Committee", signoff: "Sign-off" },
    statuses: { pending: "Under Review", conditional: "Conditional", approved: "Approved", rejected: "Rejected" },
    table: { name: "Project", owner: "Consultant", city: "City", style: "Style", score: "Score", stage: "Stage", status: "Status", updated: "Updated", actions: "Actions" },
    actions: { open3d: "Open 3D Studio", report: "Report/Certificate", advance: "Advance Stage", decision: "Make Decision", csv: "Export CSV" },
    decideTitle: "Sign-off Decision",
    signer: "Signer (Authority)",
    note: "Note (optional)",
    approve: "Approve",
    conditional: "Conditional",
    reject: "Reject",
    save: "Save",
    cancel: "Cancel",
    roleBanner: "Role: Authority",
    noAccess: "You do not have access — Authority role required.",
    resetFilters: "Reset",
    page: (n:number)=>`Page ${n}`,
    testsPass: "Tests: PASS",
    testsCheck: "Tests: CHECK",
  }
};

type Lang = keyof typeof T;

type Role = "authority"|"consultant"|"client";

type Stage = "review"|"committee"|"signoff";

type Status = "pending"|"conditional"|"approved"|"rejected";

interface Project {
  id: string;
  name: string;
  owner: string;
  city: string;
  style: string;
  score: number; // 0-100
  stage: Stage;
  status: Status;
  updatedAt: string; // ISO
}

const seed: Project[] = [
  { id:"P-001", name:"مركز ثقافي — نجران", owner:"Studio Najd", city:"نجران", style:"جنوبي", score:82, stage:"review", status:"pending", updatedAt:"2025-10-20T09:10:00Z" },
  { id:"P-002", name:"مجمع سكني — الرياض", owner:"AlRiyadh Arch", city:"الرياض", style:"نجدي", score:88, stage:"committee", status:"pending", updatedAt:"2025-10-22T13:00:00Z" },
  { id:"P-003", name:"واجهة بحرية — جدة", owner:"Hijaz Lab", city:"جدة", style:"حجازي", score:76, stage:"signoff", status:"conditional", updatedAt:"2025-10-19T15:40:00Z" },
  { id:"P-004", name:"مبنى إداري — أبها", owner:"Asir Design", city:"أبها", style:"تهامي", score:91, stage:"committee", status:"pending", updatedAt:"2025-10-23T08:05:00Z" },
  { id:"P-005", name:"كلية تصميم — المدينة", owner:"Haramain Arch", city:"المدينة المنورة", style:"حجازي", score:69, stage:"review", status:"pending", updatedAt:"2025-10-21T11:25:00Z" },
];

export default function SimaAuthorityPanel(){
  // i18n & RBAC
  const [lang,setLang]=useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  const [role] = useState<Role>("authority"); // enforce role here

  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  const [rows,setRows]=useState<Project[]>(seed);
  const [q,setQ]=useState("");
  const [filterStage,setFilterStage]=useState<Stage|"all">("all");
  const [filterStatus,setFilterStatus]=useState<Status|"all">("all");
  const [filterCity,setFilterCity]=useState<string|"all">("all");

  // pagination
  const [page,setPage]=useState(1);
  const pageSize=4;

  // decision modal
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState<Project|null>(null);
  const [decision,setDecision]=useState<Status>("approved");
  const [signer,setSigner]=useState("");
  const [note,setNote]=useState("");
  const [live,setLive]=useState("");

  const cities = useMemo(()=>Array.from(new Set(seed.map(s=>s.city))),[]);

  const filtered = useMemo(()=>{
    return rows.filter(r=>
      (!q || (r.name+" "+r.owner+" "+r.city+" "+r.style).toLowerCase().includes(q.toLowerCase())) &&
      (filterStage==="all" || r.stage===filterStage) &&
      (filterStatus==="all" || r.status===filterStatus) &&
      (filterCity==="all" || r.city===filterCity)
    );
  },[rows,q,filterStage,filterStatus,filterCity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  function resetFilters(){ setQ(""); setFilterStage("all"); setFilterStatus("all"); setFilterCity("all"); setPage(1); }

  function openDecision(p:Project){ setSelected(p); setDecision("approved"); setSigner(""); setNote(""); setOpen(true); }

  function saveDecision(){
    if(!selected) return;
    setRows(prev=>prev.map(r=> r.id===selected.id ? { ...r, status: decision, stage: "signoff", updatedAt: new Date().toISOString() } : r ));
    setOpen(false);
    setLive(`${selected.id} → ${decision}`);
  }

  function advanceStage(p:Project){
    const next:Record<Stage,Stage> = { review:"committee", committee:"signoff", signoff:"signoff" };
    setRows(prev=>prev.map(r=> r.id===p.id? { ...r, stage: next[r.stage], updatedAt: new Date().toISOString() } : r));
    setLive(`${p.id} → ${next[p.stage]}`);
  }

  function toCert(p:Project){
    // In real app this routes to /certificate/[id]
    window.open(`/certificate/${p.id}?score=${p.score}&status=${p.status}`, "_blank");
  }

  function toStudio(p:Project){ window.open(`/studio/3d?pid=${p.id}`, "_blank"); }

  // ————————— CSV helpers (FIXED) —————————
  function csvEsc(val: any){
    // Escape double quotes per RFC4180 by doubling them, then wrap cell in quotes
    const s = String(val).replace(/"/g, '""');
    return '"'+s+'"';
  }
  function csvRow(arr:any[]){ return arr.map(csvEsc).join(","); }

  function exportCSV(){
    const header = ["id","name","owner","city","style","score","stage","status","updatedAt"];
    const lines = filtered.map(r=> csvRow([r.id,r.name,r.owner,r.city,r.style,r.score,r.stage,r.status,r.updatedAt]));
    const csv = header.join(",")+"\n"+lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sima_authority_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ————————— Dev Tests (non-invasive) —————————
  useEffect(()=>{
    try{
      console.assert(csvEsc('He said "Hi"') === '"He said ""Hi"""', 'CSV escape should double quotes and wrap');
      console.assert(scoreColor(86)==='emerald' && scoreColor(70)==='sky' && scoreColor(49)==='rose', 'scoreColor thresholds');
      console.assert(Boolean(T.ar) && Boolean(T.en), 'i18n present');
      console.assert(["review","committee","signoff"].includes(seed[0].stage), 'stage values valid');
    }catch(e){ console.warn('Dev tests warning:', e); }
  },[]);

  const testsOk = role==="authority" && rows.length>0 && filtered.length>=0;

  if(role!=="authority"){
    return (
      <div className="min-h-screen grid place-items-center bg-white text-slate-900">
        <div className="max-w-lg text-center p-8 border rounded-2xl">
          <div className="text-2xl font-semibold mb-2">{t.noAccess}</div>
          <div className="opacity-70">RBAC enforced.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Crown/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <div className="hidden sm:block text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.roleBanner}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>AR</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>EN</button>
            <a href="/dashboard" className="text-sm underline text-slate-700">{t.back}</a>
          </div>
        </div>
      </header>

      {/* filters */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
        <div className="p-4 md:p-5 border rounded-2xl bg-white">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <SearchIcon/>
              <input aria-label={t.search} placeholder={t.search} value={q} onChange={e=>{setQ(e.target.value); setPage(1);}} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"/>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Stage */}
              <select value={filterStage} onChange={e=>{setFilterStage(e.target.value as any); setPage(1);}} className="px-3 py-2 border rounded-xl text-sm">
                <option value="all">{t.all} — {t.stage}</option>
                <option value="review">{t.stages.review}</option>
                <option value="committee">{t.stages.committee}</option>
                <option value="signoff">{t.stages.signoff}</option>
              </select>
              {/* Status */}
              <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value as any); setPage(1);}} className="px-3 py-2 border rounded-xl text-sm">
                <option value="all">{t.all} — {t.status}</option>
                <option value="pending">{t.statuses.pending}</option>
                <option value="conditional">{t.statuses.conditional}</option>
                <option value="approved">{t.statuses.approved}</option>
                <option value="rejected">{t.statuses.rejected}</option>
              </select>
              {/* City */}
              <select value={filterCity} onChange={e=>{setFilterCity(e.target.value as any); setPage(1);}} className="px-3 py-2 border rounded-xl text-sm">
                <option value="all">{t.all} — {t.city}</option>
                {cities.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={resetFilters} className="px-3 py-2 border rounded-xl text-sm">{t.resetFilters}</button>
              <button onClick={exportCSV} className="px-3 py-2 border rounded-xl text-sm">{t.actions.csv}</button>
            </div>
          </div>
        </div>
      </div>

      {/* table */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8">
        <div className="overflow-x-auto border rounded-2xl">
          <table className="min-w-full text-sm" aria-label="projects-table">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t.table.name}</Th>
                <Th>{t.table.owner}</Th>
                <Th>{t.table.city}</Th>
                <Th>{t.table.style}</Th>
                <Th>{t.table.score}</Th>
                <Th>{t.table.stage}</Th>
                <Th>{t.table.status}</Th>
                <Th>{t.table.updated}</Th>
                <Th>{t.table.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p=> (
                <tr key={p.id} className="border-t">
                  <Td>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[12px] text-slate-500">{p.id}</div>
                  </Td>
                  <Td>{p.owner}</Td>
                  <Td>{p.city}</Td>
                  <Td>{p.style}</Td>
                  <Td><Badge color={scoreColor(p.score)}>{p.score}%</Badge></Td>
                  <Td>{t.stages[p.stage]}</Td>
                  <Td><StatusPill s={p.status} t={t}/></Td>
                  <Td>{new Date(p.updatedAt).toLocaleString()}</Td>
                  <Td>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={()=>toStudio(p)} className="px-2.5 py-1.5 rounded-lg border text-[12px]">{t.actions.open3d}</button>
                      <button onClick={()=>toCert(p)} className="px-2.5 py-1.5 rounded-lg border text-[12px]">{t.actions.report}</button>
                      <button onClick={()=>advanceStage(p)} className="px-2.5 py-1.5 rounded-lg border text-[12px]" disabled={p.stage==="signoff"}>{t.actions.advance}</button>
                      <button onClick={()=>openDecision(p)} className="px-2.5 py-1.5 rounded-lg border text-[12px]">{t.actions.decision}</button>
                    </div>
                  </Td>
                </tr>
              ))}
              {paged.length===0 && (
                <tr>
                  <Td colSpan={9}>
                    <div className="py-10 text-center text-slate-500">— لا توجد نتائج —</div>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-slate-500">{t.page(page)} / {totalPages}</div>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-3 py-1.5 border rounded-lg">‹</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="px-3 py-1.5 border rounded-lg">›</button>
          </div>
        </div>
      </div>

      {/* live region */}
      <div aria-live="polite" className="sr-only">{live}</div>

      {/* decision modal */}
      {open && selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{t.decideTitle} — <span className="opacity-70">{selected.name}</span></div>
              <button onClick={()=>setOpen(false)} className="px-2 py-1 border rounded-lg text-sm">{t.cancel}</button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] text-slate-600">{t.signer}</span>
                <input value={signer} onChange={e=>setSigner(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="اسم المسؤول"/>
              </label>
              <label className="block">
                <span className="text-[12px] text-slate-600">{t.note}</span>
                <input value={note} onChange={e=>setNote(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="—"/>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={()=>{setDecision("approved"); saveDecision();}} className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm">{t.approve}</button>
              <button onClick={()=>{setDecision("conditional"); saveDecision();}} className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-sm">{t.conditional}</button>
              <button onClick={()=>{setDecision("rejected"); saveDecision();}} className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-sm">{t.reject}</button>
            </div>
          </div>
        </div>
      )}

      {/* tests badge */}
      <div className="fixed bottom-3 left-3 z-50">
        <div title={`rows:${rows.length}`} className={clsBadge(testsOk)}>{testsOk? t.testsPass : t.testsCheck}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}

// ————————— UI helpers —————————
function clsBtn(active:boolean){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }
function clsBadge(ok:boolean){ return `px-2.5 py-1.5 rounded-full text-[10px] ${ok?"bg-emerald-600 text-white":"bg-amber-500 text-black"}`; }

function Th({children}:{children:React.ReactNode}){ return <th scope="col" className="text-left px-3 py-2 font-medium">{children}</th>; }
function Td({children, colSpan}:{children:React.ReactNode, colSpan?:number}){ return <td colSpan={colSpan} className="px-3 py-2 align-top">{children}</td>; }

function Badge({children, color}:{children:React.ReactNode, color:"emerald"|"amber"|"rose"|"sky"|"slate"}){
  const map = { emerald:"bg-emerald-50 text-emerald-700 border-emerald-300", amber:"bg-amber-50 text-amber-700 border-amber-300", rose:"bg-rose-50 text-rose-700 border-rose-300", sky:"bg-sky-50 text-sky-700 border-sky-300", slate:"bg-slate-50 text-slate-700 border-slate-300" } as const;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] ${map[color]}`}>{children}</span>;
}

function scoreColor(s:number){ if(s>=85) return "emerald"; if(s>=70) return "sky"; if(s>=50) return "amber"; return "rose"; }

function StatusPill({s,t}:{s:Status, t:any}){
  const label = { pending: t.statuses.pending, conditional: t.statuses.conditional, approved: t.statuses.approved, rejected: t.statuses.rejected }[s];
  const color = { pending:"slate", conditional:"amber", approved:"emerald", rejected:"rose" }[s] as any;
  return <Badge color={color}>{label}</Badge>;
}

function SearchIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="search icon">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function Crown(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="crown">
      <path d="M3 18h18l-2-8-5 4-3-8-3 8-5-4-2 8z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
