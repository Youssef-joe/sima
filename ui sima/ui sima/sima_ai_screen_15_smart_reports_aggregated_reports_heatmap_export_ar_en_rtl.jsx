import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 15: Smart Reports (Aggregated)
 * Route: /reports
 *
 * • Aggregated KPIs across cities / styles / statuses
 * • Filters (date range, city, style, status), search by project
 * • Heatmap (City × Status) + simple SVG bar charts (no external deps)
 * • CSV export (RFC4180-safe) for raw and aggregated views
 * • Print to PDF (A4) with @media print
 * • i18n AR/EN + RTL, accessible tables (APG table pattern)
 * • Non-invasive runtime tests via console.assert
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — التقارير الذكية",
    back: "رجوع",
    sub: "لوحة مؤشرات إجمالية لمشاريع العمارة السعودية",
    filters: "عوامل التصفية",
    dateFrom: "من تاريخ",
    dateTo: "إلى تاريخ",
    city: "المدينة",
    style: "الطراز",
    status: "الحالة",
    all: "الكل",
    search: "بحث باسم المشروع...",
    kpis: { title: "المؤشرات الرئيسية", total: "إجمالي المشاريع", pass: "نسبة PASS", avgScore: "متوسط الدرجة", cond: "مشروط", fail: "فشل" },
    heatmap: { title: "خريطة حرارية — المدينة × الحالة" },
    bars: { byCity: "حسب المدن", byStyle: "حسب الطرز", byStatus: "حسب الحالة" },
    table: { title: "المشاريع (المصفّاة)", name: "المشروع", city: "المدينة", style: "الطراز", status: "الحالة", score: "النسبة", date: "التاريخ" },
    exportRaw: "تصدير CSV (المشاريع)",
    exportAgg: "تصدير CSV (مجاميع)",
    print: "طباعة / PDF",
    roleBanner: "الدور: جهة الاعتماد / الاستشاري / العميل",
    statuses: { approved: "معتمد", conditional: "مشروط", rejected: "مرفوض", pending: "قيد المراجعة" },
  },
  en: {
    brand: "Sima AI — Smart Reports",
    back: "Back",
    sub: "Aggregated insights for Saudi Architecture projects",
    filters: "Filters",
    dateFrom: "From",
    dateTo: "To",
    city: "City",
    style: "Style",
    status: "Status",
    all: "All",
    search: "Search by project name...",
    kpis: { title: "Key Metrics", total: "Total Projects", pass: "PASS Rate", avgScore: "Avg Score", cond: "Conditional", fail: "Fail" },
    heatmap: { title: "Heatmap — City × Status" },
    bars: { byCity: "By City", byStyle: "By Style", byStatus: "By Status" },
    table: { title: "Filtered Projects", name: "Project", city: "City", style: "Style", status: "Status", score: "Score", date: "Date" },
    exportRaw: "Export CSV (Raw)",
    exportAgg: "Export CSV (Aggregates)",
    print: "Print / PDF",
    roleBanner: "Role: Authority / Consultant / Client",
    statuses: { approved: "Approved", conditional: "Conditional", rejected: "Rejected", pending: "Under Review" },
  },
};

type Lang = keyof typeof T;

type Status = "approved" | "conditional" | "rejected" | "pending";

interface Project {
  id: string;
  name: string;
  city: string;
  style: string;
  status: Status;
  score: number; // 0-100
  dateISO: string; // updatedAt or createdAt
}

// ————————— seed data (demo) —————————
const seed: Project[] = [
  { id: "P-001", name: "مركز ثقافي — نجران", city: "نجران", style: "جنوبي", status: "approved", score: 86, dateISO: "2025-10-18T10:00:00Z" },
  { id: "P-002", name: "مجمع سكني — الرياض", city: "الرياض", style: "نجدي", status: "pending", score: 88, dateISO: "2025-10-22T13:00:00Z" },
  { id: "P-003", name: "واجهة بحرية — جدة", city: "جدة", style: "حجازي", status: "conditional", score: 76, dateISO: "2025-10-19T16:20:00Z" },
  { id: "P-004", name: "مبنى إداري — أبها", city: "أبها", style: "تهامي", status: "approved", score: 91, dateISO: "2025-10-23T08:05:00Z" },
  { id: "P-005", name: "كلية تصميم — المدينة", city: "المدينة المنورة", style: "حجازي", status: "pending", score: 69, dateISO: "2025-10-21T11:25:00Z" },
  { id: "P-006", name: "متحف حي — الدرعية", city: "الرياض", style: "نجدي", status: "approved", score: 92, dateISO: "2025-10-17T11:00:00Z" },
  { id: "P-007", name: "سوق تراثي — جدة", city: "جدة", style: "حجازي", status: "rejected", score: 48, dateISO: "2025-10-15T09:00:00Z" },
  { id: "P-008", name: "منتجع جبلي — أبها", city: "أبها", style: "تهامي", status: "conditional", score: 73, dateISO: "2025-10-18T09:30:00Z" },
];

export default function SimaSmartReports(){
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang === "ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  // filters
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("all");
  const [style, setStyle] = useState<string>("all");
  const [status, setStatus] = useState<Status|"all">("all");
  const [from, setFrom] = useState<string>("2025-10-14");
  const [to, setTo] = useState<string>("2025-10-25");

  const cities = useMemo(()=> Array.from(new Set(seed.map(s=>s.city))), []);
  const styles = useMemo(()=> Array.from(new Set(seed.map(s=>s.style))), []);

  const filtered = useMemo(()=>{
    const fDate = (iso:string)=> {
      const d = new Date(iso); const a = new Date(from+"T00:00:00Z"); const b = new Date(to+"T23:59:59Z");
      return d >= a && d <= b;
    };
    return seed.filter(p=>
      (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
      (city==="all" || p.city===city) &&
      (style==="all" || p.style===style) &&
      (status==="all" || p.status===status) &&
      fDate(p.dateISO)
    );
  },[q,city,style,status,from,to]);

  // aggregations
  const kpi = useMemo(()=>{
    const total = filtered.length || 1;
    const pass = filtered.filter(x=>x.status==="approved").length;
    const cond = filtered.filter(x=>x.status==="conditional").length;
    const fail = filtered.filter(x=>x.status==="rejected").length;
    const avgScore = Math.round(filtered.reduce((a,b)=>a+b.score,0)/total);
    return { total: total-1+1 /* ensure >0 */, passRate: Math.round((pass/total)*100), cond, fail, avgScore };
  },[filtered]);

  const byCity = useMemo(()=> groupByCount(filtered, p=>p.city), [filtered]);
  const byStyle = useMemo(()=> groupByCount(filtered, p=>p.style), [filtered]);
  const byStatus = useMemo(()=> groupByCount(filtered, p=>p.status), [filtered]);

  const heat = useMemo(()=>{
    const citiesAll = Array.from(new Set(filtered.map(p=>p.city)));
    const statuses: Status[] = ["approved","conditional","pending","rejected"];
    const rows = citiesAll.map(c=>{
      const counts: Record<Status,number> = { approved:0, conditional:0, pending:0, rejected:0 };
      filtered.filter(p=>p.city===c).forEach(p=>{ counts[p.status]++; });
      return { city:c, counts };
    });
    return { statuses, rows };
  },[filtered]);

  function reset(){ setQ(""); setCity("all"); setStyle("all"); setStatus("all"); }

  // CSV helpers — RFC4180
  function csvEsc(val:any){ const s = String(val).replace(/"/g,'""'); return '"'+s+'"'; }
  function csvRow(arr:any[]){ return arr.map(csvEsc).join(","); }
  function downloadCsv(name:string, text:string){
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }
  function exportRaw(){
    const header = ["id","name","city","style","status","score","dateISO"]; 
    const lines = filtered.map(p=> csvRow([p.id,p.name,p.city,p.style,p.status,p.score,p.dateISO]));
    downloadCsv(`sima_reports_raw_${Date.now()}.csv`, header.join(",")+"\n"+lines.join("\n"));
  }
  function exportAgg(){
    const header = ["dim","label","count"]; 
    const L1 = Object.entries(byCity).map(([k,v])=> csvRow(["city",k,v]));
    const L2 = Object.entries(byStyle).map(([k,v])=> csvRow(["style",k,v]));
    const L3 = Object.entries(byStatus).map(([k,v])=> csvRow(["status",k,v]));
    downloadCsv(`sima_reports_agg_${Date.now()}.csv`, header.join(",")+"\n"+[...L1,...L2,...L3].join("\n"));
  }

  // Dev tests (non-invasive)
  useEffect(()=>{
    try{
      console.assert(csvEsc('He said "Hi"') === '"He said ""Hi"""', 'CSV escape should double quotes and wrap');
      console.assert(groupByCount([{a:1},{a:1},{a:2}] as any, (x:any)=>x.a)[1]===2, 'groupByCount works');
      console.assert(kpi.avgScore>=0 && kpi.passRate>=0, 'KPIs numeric');
    }catch(e){ console.warn('Dev tests warning:', e); }
  },[kpi]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <div className="hidden sm:block text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.roleBanner}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>AR</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>EN</button>
            <a href="/authority/panel" className="text-sm underline text-slate-700">{t.back}</a>
          </div>
        </div>
      </header>

      {/* filters */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <div className="p-4 md:p-5 border rounded-2xl bg-white">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <SearchIcon/>
              <input aria-label={t.search} placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"/>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm flex items-center gap-2">
                <span className="min-w-[64px] opacity-70">{t.dateFrom}</span>
                <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="px-3 py-2 border rounded-xl text-sm"/>
              </label>
              <label className="text-sm flex items-center gap-2">
                <span className="min-w-[64px] opacity-70">{t.dateTo}</span>
                <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="px-3 py-2 border rounded-xl text-sm"/>
              </label>
              {/* City */}
              <select value={city} onChange={e=>setCity(e.target.value)} className="px-3 py-2 border rounded-xl text-sm">
                <option value="all">{t.all} — {t.city}</option>
                {cities.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
              {/* Style */}
              <select value={style} onChange={e=>setStyle(e.target.value)} className="px-3 py-2 border rounded-xl text-sm">
                <option value="all">{t.all} — {t.style}</option>
                {styles.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
              {/* Status */}
              <select value={status} onChange={e=>setStatus(e.target.value as any)} className="px-3 py-2 border rounded-xl text-sm">
                <option value="all">{t.all} — {t.status}</option>
                {(["approved","conditional","pending","rejected"] as Status[]).map(s=> <option key={s} value={s}>{t.statuses[s]}</option>)}
              </select>
              <button onClick={reset} className="px-3 py-2 border rounded-xl text-sm">{t.all}</button>
              <button onClick={exportRaw} className="px-3 py-2 border rounded-xl text-sm">{t.exportRaw}</button>
              <button onClick={exportAgg} className="px-3 py-2 border rounded-xl text-sm">{t.exportAgg}</button>
              <button onClick={()=>window.print()} className="px-3 py-2 border rounded-xl text-sm">{t.print}</button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-lg font-semibold mb-3">{t.kpis.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiCard label={t.kpis.total} value={String(kpi.total)} tone="slate"/>
          <KpiCard label={t.kpis.pass} value={kpi.passRate+"%"} tone="emerald"/>
          <KpiCard label={t.kpis.avgScore} value={String(kpi.avgScore)} tone="sky"/>
          <KpiCard label={t.kpis.cond} value={String(byStatus["conditional"]||0)} tone="amber"/>
          <KpiCard label={t.kpis.fail} value={String(byStatus["rejected"]||0)} tone="rose"/>
        </div>
      </div>

      {/* Heatmap & Bars */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-6">
        <section className="p-4 border rounded-2xl">
          <h3 className="font-semibold mb-3">{t.heatmap.title}</h3>
          <HeatmapTable t={t} data={heat}/>
        </section>
        <section className="p-4 border rounded-2xl">
          <h3 className="font-semibold mb-3">{t.bars.byCity}</h3>
          <Bars data={entriesToArray(byCity)} unit=""/>
          <h3 className="font-semibold mt-6 mb-3">{t.bars.byStyle}</h3>
          <Bars data={entriesToArray(byStyle)} unit=""/>
          <h3 className="font-semibold mt-6 mb-3">{t.bars.byStatus}</h3>
          <Bars data={entriesToArray(byStatus)} unit=""/>
        </section>
      </div>

      {/* Table of filtered projects */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h3 className="font-semibold mb-3">{t.table.title}</h3>
        <div className="overflow-x-auto border rounded-2xl">
          <table className="min-w-full text-sm" aria-label="filtered-projects-table">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t.table.name}</Th>
                <Th>{t.table.city}</Th>
                <Th>{t.table.style}</Th>
                <Th>{t.table.status}</Th>
                <Th>{t.table.score}</Th>
                <Th>{t.table.date}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=> (
                <tr key={p.id} className="border-t">
                  <Td>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[12px] text-slate-500">{p.id}</div>
                  </Td>
                  <Td>{p.city}</Td>
                  <Td>{p.style}</Td>
                  <Td><Badge color={statusColor(p.status)}>{t.statuses[p.status]}</Badge></Td>
                  <Td><Badge color={scoreColor(p.score)}>{p.score}%</Badge></Td>
                  <Td>{fmtDate(p.dateISO, lang)}</Td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr>
                  <Td colSpan={6}><div className="py-8 text-center text-slate-500">— لا توجد نتائج —</div></Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
        /* Print — A4 friendly */
        @media print{ 
          header, .no-print{ display:none !important }
          body{ background:white }
        }
        @page{ size:A4; margin:12mm }
        /* Accessibility: reduce motion */
        @media (prefers-reduced-motion: reduce){ *{ animation:none !important; transition:none !important } }
      `}</style>
    </div>
  );
}

// ————————— helpers & UI bits —————————
function groupByCount<T>(arr:T[], f:(x:T)=>string){
  return arr.reduce<Record<string,number>>((acc,x)=>{ const k=f(x); acc[k]=(acc[k]||0)+1; return acc; },{});
}
function entriesToArray(obj:Record<string,number>){ return Object.entries(obj).map(([label,count])=>({label, count})); }

function fmtDate(iso:string, lang:Lang){
  try{ return new Intl.DateTimeFormat(lang==='ar'? 'ar-SA':'en-US', { dateStyle:'medium', timeStyle:'short' }).format(new Date(iso)); }
  catch{ return new Date(iso).toLocaleString(); }
}

function clsBtn(active:boolean){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }
function Th({children}:{children:React.ReactNode}){ return <th scope="col" className="text-left px-3 py-2 font-medium">{children}</th>; }
function Td({children, colSpan}:{children:React.ReactNode, colSpan?:number}){ return <td colSpan={colSpan} className="px-3 py-2 align-top">{children}</td>; }

function Badge({children, color}:{children:React.ReactNode, color:"emerald"|"amber"|"rose"|"sky"|"slate"}){
  const map = { emerald:"bg-emerald-50 text-emerald-700 border-emerald-300", amber:"bg-amber-50 text-amber-700 border-amber-300", rose:"bg-rose-50 text-rose-700 border-rose-300", sky:"bg-sky-50 text-sky-700 border-sky-300", slate:"bg-slate-50 text-slate-700 border-slate-300" } as const;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] ${map[color]}`}>{children}</span>;
}

function scoreColor(s:number){ if(s>=85) return "emerald"; if(s>=70) return "sky"; if(s>=50) return "amber"; return "rose"; }
function statusColor(s:Status){ return ({ approved:"emerald", conditional:"amber", rejected:"rose", pending:"slate" } as const)[s]; }

function KpiCard({label,value,tone}:{label:string; value:string; tone:"emerald"|"sky"|"amber"|"rose"|"slate"}){
  const ring = { emerald:"ring-emerald-200", sky:"ring-sky-200", amber:"ring-amber-200", rose:"ring-rose-200", slate:"ring-slate-200" }[tone];
  return (
    <div className={`p-4 rounded-2xl border ring-1 ${ring} bg-white`}> 
      <div className="text-[12px] opacity-70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Bars({data, unit}:{data:{label:string;count:number}[]; unit:string}){
  const max = Math.max(1, ...data.map(d=>d.count));
  return (
    <div className="space-y-2">
      {data.map(d=>{
        const w = Math.round((d.count/max)*100);
        return (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-28 text-[12px] truncate" title={d.label}>{d.label}</div>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400" style={{width:`${w}%`}}/>
            </div>
            <div className="w-12 text-right text-[12px]">{d.count}{unit}</div>
          </div>
        );
      })}
    </div>
  );
}

function HeatmapTable({t, data}:{t:any; data:{ statuses:Status[]; rows:{city:string; counts:Record<Status,number>}[] }}){
  const palette:Record<Status,string> = { approved:"bg-emerald-100", conditional:"bg-amber-100", pending:"bg-slate-100", rejected:"bg-rose-100" };
  const cellTone = (n:number)=> n>=5?"opacity-100": n>=3?"opacity-80": n>=1?"opacity-60":"opacity-30";
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm" aria-label="heatmap-city-status">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <Th>{t.city}</Th>
            {data.statuses.map(s=> <Th key={s}>{t.statuses[s]}</Th>)}
          </tr>
        </thead>
        <tbody>
          {data.rows.map(r=> (
            <tr key={r.city} className="border-t">
              <Td>{r.city}</Td>
              {data.statuses.map(s=> {
                const n = r.counts[s];
                return (
                  <Td key={s}>
                    <div className={`h-6 rounded ${palette[s]} ${cellTone(n)} grid place-items-center`} title={`${n}`}>
                      <span className="text-[12px] text-slate-700">{n}</span>
                    </div>
                  </Td>
                );
              })}
            </tr>
          ))}
          {data.rows.length===0 && (
            <tr><Td colSpan={1 + data.statuses.length}><div className="py-8 text-center text-slate-500">— لا توجد بيانات —</div></Td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Logo(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="logo">
      <path d="M4 18l8-12 8 12H4z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function SearchIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="search icon">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}
