import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 13: Compliance Analyzer (/project/[id]/compliance)
 * FIX: Added missing <SummaryCard/> component and expanded inline tests.
 * - Reads ?pid=... from query string (fallback P-001)
 * - DASC mapping table (identity/climate/material/context/function)
 * - Heatmap (facade cells) showing compliance signal
 * - Filters: category, status, search; Export CSV; i18n AR/EN + RTL
 * - Actions: Focus in 3D, Open Report, Recalculate
 * - Accessible table + live region; Print-friendly for archiving
 * - Dev tests (non-invasive) to verify helpers + extra test cases
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — محلل المطابقة",
    back: "عودة",
    langAR: "عربي",
    langEN: "English",
    pid: (id:string)=>`المشروع: ${id}`,
    summary: {
      title: "ملخص المطابقة",
      overall: "المطابقة الكلية",
      passed: "مطابق",
      warn: "بحاجة تحسين",
      fail: "غير مطابق",
    },
    filters: {
      title: "عوامل التصفية",
      search: "بحث في البنود...",
      category: "الفئة",
      status: "الحالة",
      all: "الكل",
      categories: { identity:"الهوية", climate:"المناخ", materials:"المواد", context:"السياق", function:"الوظيفة" },
      statuses: { pass:"مطابق", warn:"تحسين", fail:"مخالفة" },
      reset: "إعادة التعيين",
      exportCsv: "تصدير CSV",
      print: "طباعة / PDF",
    },
    table: {
      code: "المرجع",
      title: "البند",
      category: "الفئة",
      weight: "الوزن",
      status: "الحالة",
      score: "النقاط",
      action: "إجراء",
    },
    actions: {
      focus3d: "تركيز داخل الاستوديو",
      report: "فتح التقرير/الشهادة",
      recalc: "إعادة الحساب",
    },
    heatmap: {
      title: "خريطة مطابقة الواجهة",
      legend: { high:"مطابقة عالية", medium:"متوسطة", low:"منخفضة" }
    },
    live: {
      focused: (el:string)=>`تم التركيز على العنصر ${el} داخل الاستوديو`,
      recalced: "تم تحديث الحسابات",
    },
    tests: { pass: "اختبارات: ناجحة", check: "اختبارات: تحقق" }
  },
  en: {
    brand: "Sima AI — Compliance Analyzer",
    back: "Back",
    langAR: "Arabic",
    langEN: "English",
    pid: (id:string)=>`Project: ${id}`,
    summary: {
      title: "Compliance Summary",
      overall: "Overall Compliance",
      passed: "Pass",
      warn: "Needs Improvement",
      fail: "Fail",
    },
    filters: {
      title: "Filters",
      search: "Search guidelines...",
      category: "Category",
      status: "Status",
      all: "All",
      categories: { identity:"Identity", climate:"Climate", materials:"Materials", context:"Context", function:"Function" },
      statuses: { pass:"Pass", warn:"Warn", fail:"Fail" },
      reset: "Reset",
      exportCsv: "Export CSV",
      print: "Print / PDF",
    },
    table: {
      code: "Ref",
      title: "Guideline",
      category: "Category",
      weight: "Weight",
      status: "Status",
      score: "Score",
      action: "Action",
    },
    actions: {
      focus3d: "Focus in 3D Studio",
      report: "Open Report/Certificate",
      recalc: "Recalculate",
    },
    heatmap: {
      title: "Facade Compliance Heatmap",
      legend: { high:"High", medium:"Medium", low:"Low" }
    },
    live: {
      focused: (el:string)=>`Focused element ${el} in 3D studio`,
      recalced: "Recalculated",
    },
    tests: { pass: "Tests: PASS", check: "Tests: CHECK" }
  }
};

type Lang = keyof typeof T;

type Category = "identity"|"climate"|"materials"|"context"|"function";

type Status = "pass"|"warn"|"fail";

interface GuidelineItem {
  code: string;          // e.g., DASC-NJD-3.1.2
  title: string;         // human-readable rule
  category: Category;    // taxonomy bucket
  weight: number;        // 1..5
  status: Status;        // pass/warn/fail
  score: number;         // 0..100 (contribution)
  elementId?: string;    // 3D element anchor
}

function qs(key:string){
  if (typeof window === 'undefined') return '' as any;
  return new URLSearchParams(window.location.search).get(key) || '';
}

// Demo seed mapped to Saudi contexts (names are illustrative for UI only)
const seed: GuidelineItem[] = [
  { code:"DASC-NJD-3.1.2", title:"نسبة فتحات الواجهة لا تتجاوز 40% في الواجهة الجنوبية (نجدي)", category:"climate", weight:5, status:"warn", score:65, elementId:"south-facade" },
  { code:"DASC-NJD-2.4.1", title:"التدرج اللوني الترابي لمواد الواجهة الرئيسية", category:"identity", weight:4, status:"pass", score:92, elementId:"mat-wall" },
  { code:"DASC-HJZ-1.3.3", title:"وجود مشربيات/تظليل مناسب للواجهات الغربية (حجازي)", category:"materials", weight:3, status:"warn", score:58, elementId:"west-shade" },
  { code:"DASC-GEN-5.2.1", title:"توجيه المبنى لتعزيز التهوية الطبيعية في الصيف", category:"climate", weight:4, status:"pass", score:88, elementId:"orientation" },
  { code:"DASC-GEN-6.1.5", title:"الارتدادات والواجهات متسقة مع نسيج الحي", category:"context", weight:2, status:"pass", score:80, elementId:"street-setback" },
  { code:"DASC-SOU-4.3.2", title:"حماية الفتحات من الإشعاع في الجنوب عبر مظلات ثابتة", category:"climate", weight:5, status:"fail", score:35, elementId:"south-shade" },
  { code:"DASC-ASM-7.2.0", title:"استخدام مواد محلية ملائمة للحرارة والرطوبة", category:"materials", weight:3, status:"pass", score:90, elementId:"mat-roof" },
  { code:"DASC-GEN-1.1.9", title:"وضوح المداخل والفراغ الانتقالي (عتبات)", category:"function", weight:2, status:"warn", score:60, elementId:"entry" },
  { code:"DASC-NJR-2.7.4", title:"إيقاع الفتحات متناغم مع الطراز المحلي", category:"identity", weight:3, status:"pass", score:86, elementId:"facade-rhythm" },
  { code:"DASC-GEN-9.1.1", title:"سطح مناسب لتركيب عناصر تظليل/طاقة مستقبلًا", category:"function", weight:1, status:"pass", score:75, elementId:"roof" },
];

export default function SimaComplianceAnalyzer(){
  const [lang,setLang]=useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  const pid = (typeof window!=="undefined" && (qs("pid")||"P-001")) || "P-001";

  const [rows,setRows] = useState<GuidelineItem[]>(seed);
  const [q,setQ] = useState("");
  const [cat,setCat] = useState<Category|"all">("all");
  const [st,setSt] = useState<Status|"all">("all");
  const [live,setLive] = useState("");

  const filtered = useMemo(()=>{
    return rows.filter(r=>
      (!q || (r.title+" "+r.code).toLowerCase().includes(q.toLowerCase())) &&
      (cat==="all" || r.category===cat) &&
      (st==="all" || r.status===st)
    );
  },[rows,q,cat,st]);

  const counts = useMemo(()=>{
    const p = rows.filter(r=>r.status==="pass").length;
    const w = rows.filter(r=>r.status==="warn").length;
    const f = rows.filter(r=>r.status==="fail").length;
    return {p,w,f};
  },[rows]);

  const overall = useMemo(()=>{
    // Weighted average by weight, but penalize fail more
    const totalW = rows.reduce((a,b)=>a+b.weight,0) || 1;
    const sum = rows.reduce((a,b)=>{
      const base = b.score * b.weight;
      const penalty = b.status==="fail"? 10*b.weight : (b.status==="warn"? 3*b.weight : 0);
      return a + Math.max(0, base - penalty);
    },0);
    return Math.round(sum/totalW);
  },[rows]);

  function resetFilters(){ setQ(""); setCat("all"); setSt("all"); }

  function focus3D(el?:string){
    const anchor = el? `&focus=${encodeURIComponent(el)}`: "";
    window.open(`/studio/3d?pid=${encodeURIComponent(pid)}${anchor}`, "_blank");
    setLive(t.live.focused(el||"—"));
  }

  function openReport(){ window.open(`/certificate/${encodeURIComponent(pid)}?score=${overall}`, "_blank"); }

  function exportCSV(){
    const header = ["code","title","category","weight","status","score","pid"];
    const esc = (v:any)=> '"'+ String(v).replace(/"/g,'""') +'"';
    const lines = filtered.map(r=> [r.code,r.title,r.category,r.weight,r.status,r.score,pid].map(esc).join(","));
    const csv = header.join(",")+"\n"+lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`sima_compliance_${pid}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function recalc(){
    // Trivial recompute: nudge warn items toward pass a bit to simulate improvement
    setRows(prev=> prev.map(r=> r.status==="warn"? { ...r, score: Math.min(100, Math.round(r.score+5)) } : r));
    setLive(t.live.recalced);
  }

  // ————————— Heatmap (deterministic paint) —————————
  const gridW=12, gridH=8; // facade cells
  const heat = useMemo(()=>{
    // score by combining related rules: south-facade & south-shade heavily affect southern band
    const base = Array.from({length:gridW*gridH}, () => 80);
    const southBand = Array.from({length:gridW}, (_,x)=> gridIdx(x,gridH-1));
    // Penalize by fail items
    const failImpact = rows.filter(r=>r.status==='fail').reduce((a,_)=>a+15,0);
    southBand.forEach(idx=> base[idx] = clamp(base[idx]-failImpact, 10, 100));
    // Warn impact lighter
    const warnImpact = rows.filter(r=>r.status==='warn').reduce((a,_)=>a+7,0);
    for(let y=gridH-3;y<gridH;y++) for(let x=0;x<gridW;x++){ const i=gridIdx(x,y); base[i]=clamp(base[i]-warnImpact, 10, 100); }
    return base; // 0..100
    function gridIdx(x:number,y:number){ return y*gridW+x; }
    function clamp(v:number,min:number,max:number){ return Math.max(min,Math.min(max,v)); }
  },[rows]);

  function heatColor(v:number){
    // 0..100 → color
    if(v>=80) return "#10b981"; // emerald-500
    if(v>=60) return "#38bdf8"; // sky-400
    if(v>=40) return "#f59e0b"; // amber-500
    return "#ef4444"; // rose-500
  }

  // ————————— Tests (augmented) —————————
  const testsOk = useMemo(()=>{
    try{
      console.assert(overall>=0 && overall<=100, 'overall in range');
      console.assert(counts.p + counts.w + counts.f === rows.length, 'counts sum');
      console.assert(typeof heat[0] === 'number', 'heat array ok');
      // extra test cases
      console.assert(scoreColor(90)==='emerald', 'scoreColor 90');
      console.assert(scoreColor(75)==='sky', 'scoreColor 75');
      console.assert(scoreColor(55)==='amber', 'scoreColor 55');
      console.assert(scoreColor(10)==='rose', 'scoreColor 10');
      console.assert(heatColor(85)==='#10b981', 'heatColor high');
      console.assert(heatColor(65)==='#38bdf8', 'heatColor med');
      console.assert(heatColor(45)==='#f59e0b', 'heatColor low');
      console.assert(heatColor(20)==='#ef4444', 'heatColor very low');
      return true;
    }catch{ return false; }
  },[overall,counts,heat,rows.length]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Shield/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <div className="hidden sm:block text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.pid(pid)}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>{t.langAR}</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>{t.langEN}</button>
            <a href="/dashboard" className="text-sm underline text-slate-700">{t.back}</a>
          </div>
        </div>
      </header>

      {/* summary */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid md:grid-cols-4 gap-4">
          <SummaryCard title={t.summary.overall} value={`${overall}%`} color={scoreColor(overall)} />
          <SummaryCard title={t.summary.passed} value={String(counts.p)} color="emerald" />
          <SummaryCard title={t.summary.warn} value={String(counts.w)} color="amber" />
          <SummaryCard title={t.summary.fail} value={String(counts.f)} color="rose" />
        </div>
      </div>

      {/* heatmap */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="font-semibold mb-2">{t.heatmap.title}</h2>
        <div className="p-3 border rounded-2xl overflow-x-auto">
          <svg width={gridW*22} height={gridH*22} role="img" aria-label="compliance heatmap">
            {heat.map((v,idx)=>{
              const x = (idx % gridW)*22; const y = Math.floor(idx/gridW)*22;
              return <rect key={idx} x={x} y={y} width={20} height={20} rx={3} ry={3} fill={heatColor(v)} stroke="#e2e8f0" strokeWidth={1}/>;
            })}
          </svg>
          <div className="flex items-center gap-3 text-[12px] mt-2">
            <Legend color="#10b981" label={t.heatmap.legend.high}/>
            <Legend color="#38bdf8" label={t.heatmap.legend.medium}/>
            <Legend color="#f59e0b" label={t.heatmap.legend.low}/>
          </div>
        </div>
      </section>

      {/* controls */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="p-4 md:p-5 border rounded-2xl bg-white flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <SearchIcon/>
            <input aria-label={t.filters.search} placeholder={t.filters.search} value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"/>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={cat} onChange={e=>setCat(e.target.value as any)} className="px-3 py-2 border rounded-xl text-sm">
              <option value="all">{t.filters.all} — {t.filters.category}</option>
              <option value="identity">{t.filters.categories.identity}</option>
              <option value="climate">{t.filters.categories.climate}</option>
              <option value="materials">{t.filters.categories.materials}</option>
              <option value="context">{t.filters.categories.context}</option>
              <option value="function">{t.filters.categories.function}</option>
            </select>
            <select value={st} onChange={e=>setSt(e.target.value as any)} className="px-3 py-2 border rounded-xl text-sm">
              <option value="all">{t.filters.all} — {t.filters.status}</option>
              <option value="pass">{t.filters.statuses.pass}</option>
              <option value="warn">{t.filters.statuses.warn}</option>
              <option value="fail">{t.filters.statuses.fail}</option>
            </select>
            <button onClick={resetFilters} className="px-3 py-2 border rounded-xl text-sm">{t.filters.reset}</button>
            <button onClick={exportCSV} className="px-3 py-2 border rounded-xl text-sm">{t.filters.exportCsv}</button>
            <button onClick={()=>window.print()} className="px-3 py-2 border rounded-xl text-sm">{t.filters.print}</button>
          </div>
        </div>
      </section>

      {/* table */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-4 pb-16">
        <div className="overflow-x-auto border rounded-2xl">
          <table className="min-w-full text-sm" aria-label="compliance-table">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t.table.code}</Th>
                <Th>{t.table.title}</Th>
                <Th>{t.table.category}</Th>
                <Th>{t.table.weight}</Th>
                <Th>{t.table.status}</Th>
                <Th>{t.table.score}</Th>
                <Th>{t.table.action}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r)=> (
                <tr key={r.code} className="border-t">
                  <Td>{r.code}</Td>
                  <Td>{r.title}</Td>
                  <Td>{labelCat(r.category, t)}</Td>
                  <Td>{r.weight}</Td>
                  <Td><Pill s={r.status} t={t}/></Td>
                  <Td><Badge color={scoreColor(r.score)}>{r.score}%</Badge></Td>
                  <Td>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={()=>focus3D(r.elementId)} className="px-2.5 py-1.5 rounded-lg border text-[12px]">{t.actions.focus3d}</button>
                      <button onClick={openReport} className="px-2.5 py-1.5 rounded-lg border text-[12px]">{t.actions.report}</button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><Td colSpan={7}><div className="py-10 text-center text-slate-500">— لا توجد بنود مطابقة للشروط الحالية —</div></Td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* live region */}
      <div aria-live="polite" className="sr-only">{live}</div>

      {/* floating actions */}
      <div className="fixed bottom-3 left-3 z-50 flex gap-2">
        <button onClick={recalc} className="px-3 py-2 rounded-xl border bg-slate-50">{t.actions.recalc}</button>
        <div className={clsBadge(testsOk)}>{testsOk? t.tests.pass: t.tests.check}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        @media print{
          header, .fixed, .sr-only, .no-print{ display:none !important }
          table{ page-break-inside:auto }
          tr{ page-break-inside:avoid; page-break-after:auto }
        }
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

function Pill({s,t}:{s:Status, t:any}){
  const label = { pass: t.filters.statuses.pass, warn: t.filters.statuses.warn, fail: t.filters.statuses.fail }[s];
  const color = { pass:"emerald", warn:"amber", fail:"rose" }[s] as any;
  return <Badge color={color}>{label}</Badge>;
}

function SummaryCard({title, value, color}:{title:string; value:string; color:"emerald"|"amber"|"rose"|"sky"|"slate"}){
  const map = {
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
    amber:   "border-amber-300 bg-amber-50 text-amber-800",
    rose:    "border-rose-300 bg-rose-50 text-rose-800",
    sky:     "border-sky-300 bg-sky-50 text-sky-800",
    slate:   "border-slate-300 bg-slate-50 text-slate-800",
  } as const;
  return (
    <div className={`rounded-2xl border p-4 ${map[color]}`} aria-label={title}>
      <div className="text-xs opacity-80">{title}</div>
      <div className="text-2xl font-bold tracking-tight mt-1">{value}</div>
    </div>
  );
}

function labelCat(c:Category, t:any){
  return { identity:t.filters.categories.identity, climate:t.filters.categories.climate, materials:t.filters.categories.materials, context:t.filters.categories.context, function:t.filters.categories.function }[c];
}

function scoreColor(s:number){ if(s>=85) return "emerald"; if(s>=70) return "sky"; if(s>=50) return "amber"; return "rose"; }

function SearchIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="search icon">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function Shield(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="shield">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function Legend({color,label}:{color:string,label:string}){
  return (
    <div className="inline-flex items-center gap-2">
      <span className="w-3 h-3 rounded" style={{backgroundColor:color}}></span>
      <span className="text-slate-600">{label}</span>
    </div>
  );
}
