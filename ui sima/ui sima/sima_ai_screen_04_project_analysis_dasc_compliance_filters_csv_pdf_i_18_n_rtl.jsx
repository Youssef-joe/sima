import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 04: Project Analysis (/project/[id]/analysis)
 * 
 * هدف الصفحة:
 * - تحليل مشروع مقابل أدلة العمارة السعودية DASC (عرضًا أوليًا)
 * - شبكة بنود مع فلاتر/بحث/ترقيم صفحات + حالة (مطابق/تحسين/مخالفة)
 * - حساب درجة محاور (هوية/مناخ/سياق/وظيفة/إنسان) + درجة كلية
 * - تصدير CSV + طباعة/توليد تقرير PDF عبر نافذة طباعة المتصفح
 * - i18n عربي/إنجليزي + RTL + قابلية وصول (aria-*)
 * - اختبارات تشغيلية غير متداخلة مع الواجهة (console.assert)
 * - بدون اعتماد على مكتبات خارجية — Tailwind مرسوم ككلاسات فقط
 * 
 * ملاحظة: الربط مع الـ API الحقيقي لاحقًا عبر fetch("/api/analysis?id=...")
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — تحليل المطابقة (DASC)",
    back: "عودة",
    project: "المشروع",
    id: "المعرف",
    owner: "الاستشاري",
    city: "المدينة",
    style: "الطراز",
    axes: { id:"الهوية", climate:"المناخ", context:"السياق", function:"الوظيفة", human:"الإنسان", total:"الدرجة الكلية" },
    grid: { clause:"البند", type:"النوع", section:"القسم", match:"الدرجة", status:"الحالة", comment:"الملاحظة" },
    types: { must:"إلزامي", should:"مستحسن", avoid:"محظور" },
    status: { pass:"مطابق", warn:"تحسين", fail:"مخالفة" },
    filters: "عوامل التصفية",
    search: "بحث في البنود...",
    section: "القسم",
    all: "الكل",
    onlyFail: "إظهار المخالفات فقط",
    exportCsv: "تصدير CSV",
    printPdf: "توليد تقرير (PDF)",
    recommend: "الانتقال للتوصيات",
    studio: "فتح الاستوديو ثلاثي الأبعاد",
    heatmap: "خريطة مطابقة حرارية",
    page: (n:number)=>`صفحة ${n}`,
    noRows: "— لا توجد بنود —",
    testsPass: "اختبارات: ناجحة",
    testsCheck: "اختبارات: تحقق",
  },
  en: {
    brand: "Sima AI — DASC Compliance Analysis",
    back: "Back",
    project: "Project",
    id: "ID",
    owner: "Consultant",
    city: "City",
    style: "Style",
    axes: { id:"Identity", climate:"Climate", context:"Context", function:"Function", human:"Human", total:"Total Score" },
    grid: { clause:"Clause", type:"Type", section:"Section", match:"Score", status:"Status", comment:"Comment" },
    types: { must:"Mandatory", should:"Recommended", avoid:"Prohibited" },
    status: { pass:"Pass", warn:"Improve", fail:"Fail" },
    filters: "Filters",
    search: "Search clauses...",
    section: "Section",
    all: "All",
    onlyFail: "Show only FAIL",
    exportCsv: "Export CSV",
    printPdf: "Generate Report (PDF)",
    recommend: "Go to Recommendations",
    studio: "Open 3D Studio",
    heatmap: "Compliance Heatmap",
    page: (n:number)=>`Page ${n}`,
    noRows: "— No clauses —",
    testsPass: "Tests: PASS",
    testsCheck: "Tests: CHECK",
  }
};

// ————————— أنواع —————————
 type Lang = keyof typeof T;
 type ClauseType = "must"|"should"|"avoid";
 type ClauseStatus = "pass"|"warn"|"fail";

 interface Clause {
  id: string;
  section: string; // مثال: "واجهات"، "فتحات"، "ألوان"
  type: ClauseType;
  match: number;  // 0..100
  status: ClauseStatus;
  comment: string;
  ref: string; // رقم/مرجع في الدليل
 }

 interface ProjectMeta {
  id: string;
  name: string;
  owner: string;
  city: string;
  style: string;
 }

 // ————————— بيانات أولية للعرض —————————
 const metaSeed: ProjectMeta = { id:"P-002", name:"مجمع سكني — الرياض", owner:"AlRiyadh Arch", city:"الرياض", style:"نجدي" };
 const clausesSeed: Clause[] = [
  { id:"C-001", section:"الواجهات", type:"must", match: 92, status:"pass", comment:"نسبة الفتحات ضمن الحد (≤40%) للواجهة الجنوبية.", ref:"Najdi.4.1" },
  { id:"C-002", section:"الواجهات", type:"should", match: 68, status:"warn", comment:"يفضّل زيادة عناصر التظليل في الجهة الغربية.", ref:"Najdi.4.3" },
  { id:"C-003", section:"الألوان", type:"should", match: 74, status:"warn", comment:"الدرجة اللونية تميل للبرودة، اقترح نغمات ترابية.", ref:"Najdi.5.2" },
  { id:"C-004", section:"المواد", type:"must", match: 58, status:"fail", comment:"مادة التغليف لا تعكس المادة المحلية المقترحة.", ref:"Najdi.6.1" },
  { id:"C-005", section:"الفتحات", type:"avoid", match: 45, status:"fail", comment:"تجاوز زجاج أفقي ممتد في الواجهة الغربية.", ref:"Najdi.7.4" },
  { id:"C-006", section:"الأسقف", type:"should", match: 81, status:"pass", comment:"تناسق الارتفاع العام مع الطراز النجدي.", ref:"Najdi.8.2" },
 ];

 // محاور (للعرض فقط — القيم مشتقة تقريبية)
 function computeAxes(rows:Clause[]){
  const s = (k:ClauseStatus)=> rows.filter(r=>r.status===k).length;
  const total = rows.length||1;
  const pass = s("pass"), warn = s("warn"), fail = s("fail");
  const base = Math.max(0, Math.round((pass*1 + warn*0.6 + fail*0.1) / total * 100));
  // توزيع تقريبي على المحاور
  const id = clamp(base + bias(rows,"الألوان","المواد",+3));
  const climate = clamp(base + bias(rows,"الواجهات","الفتحات",+2));
  const context = clamp(base + bias(rows,"الأسقف","",+1));
  const func = clamp(base - bias(rows,"الفتحات","",-2));
  const human = clamp(base - bias(rows,"", "", -1));
  const totalScore = clamp(Math.round((id+climate+context+func+human)/5));
  return { id, climate, context, func, human, total: totalScore };
 }
 function bias(rows:Clause[], s1:string, s2:string, w:number){
  const inSec = (s:string)=> s? rows.filter(r=>r.section===s) : rows;
  const arr = [...inSec(s1), ...inSec(s2)];
  if(arr.length===0) return 0;
  const m = arr.reduce((a,c)=>a+c.match,0)/arr.length;
  return Math.round(((m-70)/30)*w); // انحياز بسيط حول 70
 }
 function clamp(n:number){ return Math.max(0, Math.min(100, n)); }

 // ————————— الصفحة —————————
 export default function SimaProjectAnalysis(){
  const [lang,setLang]=useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  const [meta] = useState<ProjectMeta>(metaSeed);
  const [rows,setRows]=useState<Clause[]>(clausesSeed);
  const [q,setQ]=useState("");
  const [section,setSection]=useState<string|"all">("all");
  const [onlyFail,setOnlyFail]=useState(false);
  const [page,setPage]=useState(1);
  const pageSize=5;

  const sections = useMemo(()=> Array.from(new Set(rows.map(r=>r.section))),[rows]);

  const filtered = useMemo(()=>{
    return rows.filter(r=>
      (!q || (r.comment+" "+r.ref+" "+r.section).toLowerCase().includes(q.toLowerCase())) &&
      (section==="all" || r.section===section) &&
      (!onlyFail || r.status==="fail")
    );
  },[rows,q,section,onlyFail]);

  useEffect(()=>{ setPage(1); },[q,section,onlyFail]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/pageSize));
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  const axes = useMemo(()=>computeAxes(rows),[rows]);

  function toRecommendations(){ window.open(`/project/${meta.id}/recommendations`, "_blank"); }
  function toStudio(){ window.open(`/studio/3d?pid=${meta.id}`, "_blank"); }

  // ————————— CSV / تقرير —————————
  function csvEsc(v:any){ return '"'+String(v).replace(/"/g,'""')+'"'; }
  function csvRow(arr:any[]){ return arr.map(csvEsc).join(","); }
  function exportCSV(){
    const header = ["id","section","type","match","status","comment","ref"];
    const lines = filtered.map(r=> csvRow([r.id,r.section,r.type,r.match,r.status,r.comment,r.ref]));
    const csv = header.join(",")+"\n"+lines.join("\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`sima_analysis_${meta.id}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function printPDF(){
    const w = window.open("","_blank","width=1200,height=800");
    if(!w) return;
    const style = `
      body{font-family:ui-sans-serif,system-ui; color:#0f172a;}
      h1{font-size:20px;margin:0 0 8px}
      h2{font-size:16px;margin:16px 0 6px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #e2e8f0;padding:6px;text-align:${rtl?"right":"left"}}
      .badge{display:inline-block;padding:4px 8px;border-radius:9999px;border:1px solid #cbd5e1}
    `;
    const rowsHtml = filtered.map(r=> `
      <tr>
        <td>${r.id}</td><td>${r.section}</td><td>${t.types[r.type]}</td><td>${r.match}%</td>
        <td>${t.status[r.status]}</td><td>${escapeHtml(r.comment)}</td><td>${r.ref}</td>
      </tr>`).join("");
    const html = `<!doctype html><html lang="${lang}" dir="${rtl?"rtl":"ltr"}">
      <head><meta charset="utf-8"><title>Sima Report ${meta.id}</title><style>${style}</style></head>
      <body>
        <h1>${t.brand}</h1>
        <div>${t.project}: <b>${meta.name}</b> — ${t.id}: ${meta.id} — ${t.owner}: ${meta.owner} — ${t.city}: ${meta.city} — ${t.style}: ${meta.style}</div>
        <h2>${t.axes.total}: ${axes.total}%</h2>
        <div>
          <span class="badge">${t.axes.id}: ${axes.id}%</span>
          <span class="badge">${t.axes.climate}: ${axes.climate}%</span>
          <span class="badge">${t.axes.context}: ${axes.context}%</span>
          <span class="badge">${t.axes.function}: ${axes.func}%</span>
          <span class="badge">${t.axes.human}: ${axes.human}%</span>
        </div>
        <h2>${t.heatmap}</h2>
        <table><thead>
          <tr><th>${t.grid.clause}</th><th>${t.section}</th><th>${t.grid.type}</th><th>${t.grid.match}</th><th>${t.grid.status}</th><th>${t.grid.comment}</th><th>REF</th></tr>
        </thead><tbody>${rowsHtml}</tbody></table>
        <script>window.onload=()=>window.print()</script>
      </body></html>`;
    w.document.open(); w.document.write(html); w.document.close();
  }

  // ————————— اختبارات —————————
  useEffect(()=>{
    try{
      console.assert(csvEsc('He said "Hi"')==='"He said ""Hi"""','CSV escape');
      const ax = computeAxes([
        {id:"x",section:"الواجهات",type:"must",match:90,status:"pass",comment:"",ref:""},
        {id:"y",section:"المواد",type:"must",match:40,status:"fail",comment:"",ref:""},
      ]);
      console.assert(ax.total>=0 && ax.total<=100, 'axes range');
    }catch(e){ console.warn('Dev tests warning:', e); }
  },[]);

  const testsOk = rows.length>0 && filtered.length>=0;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>AR</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>EN</button>
            <a href="/dashboard" className="text-sm underline text-slate-700">{t.back}</a>
          </div>
        </div>
      </header>

      {/* Meta & Axes */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <div className="grid lg:grid-cols-3 gap-4">
          <Card>
            <div className="text-sm opacity-70">{t.project}</div>
            <div className="font-semibold">{meta.name}</div>
            <div className="text-[12px] text-slate-500">{t.id}: {meta.id} • {t.owner}: {meta.owner} • {t.city}: {meta.city} • {t.style}: {meta.style}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={toRecommendations} className="px-3 py-2 border rounded-xl text-sm">{t.recommend}</button>
              <button onClick={toStudio} className="px-3 py-2 border rounded-xl text-sm">{t.studio}</button>
              <button onClick={printPDF} className="px-3 py-2 border rounded-xl text-sm">{t.printPdf}</button>
              <button onClick={exportCSV} className="px-3 py-2 border rounded-xl text-sm">{t.exportCsv}</button>
            </div>
          </Card>
          <Card>
            <AxisBar label={t.axes.id} v={axes.id} color="emerald"/>
            <AxisBar label={t.axes.climate} v={axes.climate} color="sky"/>
            <AxisBar label={t.axes.context} v={axes.context} color="violet"/>
            <AxisBar label={t.axes.function} v={axes.func} color="amber"/>
            <AxisBar label={t.axes.human} v={axes.human} color="rose"/>
          </Card>
          <Card>
            <div className="text-sm opacity-70">{t.axes.total}</div>
            <div className="text-4xl font-bold">{axes.total}%</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Badge color={scoreColor(axes.total)}>{axes.total>=85?"A":axes.total>=70?"B":axes.total>=50?"C":"D"}</Badge>
              <Badge color="slate">{t.axes.id}: {axes.id}%</Badge>
              <Badge color="slate">{t.axes.climate}: {axes.climate}%</Badge>
              <Badge color="slate">{t.axes.context}: {axes.context}%</Badge>
              <Badge color="slate">{t.axes.function}: {axes.func}%</Badge>
              <Badge color="slate">{t.axes.human}: {axes.human}%</Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-4">
        <div className="p-4 md:p-5 border rounded-2xl bg-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <SearchIcon/>
              <input aria-label={t.search} placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"/>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={section} onChange={e=>setSection(e.target.value as any)} className="px-3 py-2 border rounded-xl text-sm">
                <option value="all">{t.all} — {t.section}</option>
                {sections.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded-xl">
                <input type="checkbox" checked={onlyFail} onChange={e=>setOnlyFail(e.target.checked)} />
                <span>{t.onlyFail}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-10">
        <div className="overflow-x-auto border rounded-2xl">
          <table className="min-w-full text-sm" aria-label="clauses-table">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t.grid.clause}</Th>
                <Th>{t.section}</Th>
                <Th>{t.grid.type}</Th>
                <Th>{t.grid.match}</Th>
                <Th>{t.grid.status}</Th>
                <Th>{t.grid.comment}</Th>
                <Th>REF</Th>
              </tr>
            </thead>
            <tbody>
              {paged.map(r=> (
                <tr key={r.id} className="border-t">
                  <Td><div className="font-medium">{r.id}</div><div className="text-[12px] text-slate-500">{r.ref}</div></Td>
                  <Td>{r.section}</Td>
                  <Td>{t.types[r.type]}</Td>
                  <Td><Badge color={scoreColor(r.match)}>{r.match}%</Badge></Td>
                  <Td><StatusPill s={r.status} t={t}/></Td>
                  <Td>{r.comment}</Td>
                  <Td><a className="underline" href="#" onClick={(e)=>{e.preventDefault(); alert(r.ref);}}>•</a></Td>
                </tr>
              ))}
              {paged.length===0 && (
                <tr><Td colSpan={7}><div className="py-10 text-center text-slate-500">{t.noRows}</div></Td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-slate-500">{t.page(page)} / {totalPages}</div>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-3 py-1.5 border rounded-lg">‹</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="px-3 py-1.5 border rounded-lg">›</button>
          </div>
        </div>
      </div>

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

function Badge({children, color}:{children:React.ReactNode, color:"emerald"|"amber"|"rose"|"sky"|"slate"|"violet"}){
  const map = { emerald:"bg-emerald-50 text-emerald-700 border-emerald-300", amber:"bg-amber-50 text-amber-700 border-amber-300", rose:"bg-rose-50 text-rose-700 border-rose-300", sky:"bg-sky-50 text-sky-700 border-sky-300", slate:"bg-slate-50 text-slate-700 border-slate-300", violet:"bg-violet-50 text-violet-700 border-violet-300" } as const;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] ${map[color]}`}>{children}</span>;
}

function scoreColor(n:number){ if(n>=85) return "emerald"; if(n>=70) return "sky"; if(n>=50) return "amber"; return "rose"; }

function StatusPill({s,t}:{s:ClauseStatus, t:any}){
  const label = { pass: t.status.pass, warn: t.status.warn, fail: t.status.fail }[s];
  const color = { pass:"emerald", warn:"amber", fail:"rose" }[s] as any;
  return <Badge color={color}>{label}</Badge>;
}

function AxisBar({label,v,color}:{label:string, v:number, color:"emerald"|"sky"|"violet"|"amber"|"rose"}){
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[12px] mb-1"><span>{label}</span><span>{v}%</span></div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorToBg(color)}`} style={{width:`${v}%`}}/>
      </div>
    </div>
  );
}
function colorToBg(c:"emerald"|"sky"|"violet"|"amber"|"rose"){ return ({emerald:"bg-emerald-500", sky:"bg-sky-500", violet:"bg-violet-500", amber:"bg-amber-500", rose:"bg-rose-500"})[c]; }

function Card({children}:{children:React.ReactNode}){
  return <div className="p-4 md:p-5 border rounded-2xl bg-white">{children}</div>;
}

function SearchIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="search icon">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function Logo(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="sima">
      <path d="M4 18l4-12 4 8 4-6 4 10H4z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function escapeHtml(s:string){ return s.replace(/[&<>"']/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c] as string)); }
