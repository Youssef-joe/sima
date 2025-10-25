import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 06: Project Overview
 * - Hero with name, status pill, compliance donut
 * - Meta grid: city, scope, style, climate (placeholder), updated
 * - Actions: Analyze, 3D Studio, Report PDF, Start Workflow (role-aware)
 * - Files section (PDF/DWG/IFC) + upload
 * - Simple SVG KSA map with city pin (no external libs)
 * - Team section (roles & permissions)
 * - Audit Log timeline
 * - i18n AR/EN + RTL; inline SVG icons only
 * - Self tests badge (PASS when schema & i18n ok)
 */

// —————————————— i18n ——————————————
const T = {
  ar: {
    brand: "Sima AI — تفاصيل المشروع",
    back: "عودة إلى قائمة المشاريع",
    analyze: "تحليل ذكي",
    studio3d: "الاستوديو ثلاثي الأبعاد",
    report: "تقرير / شهادة",
    startWorkflow: "بدء مسار الاعتماد",
    meta: { city: "المدينة", scope: "النطاق", style: "الطراز", climate: "المناخ", updated: "آخر تحديث" },
    files: { title: "الملفات المرفوعة", upload: "رفع ملف", empty: "لا توجد ملفات مرفوعة." },
    team: { title: "فريق العمل", add: "إضافة عضو" },
    audit: { title: "سجل النشاط" },
    status: { PASS: "ناجح", FAIL: "فاشل", UNDER_REVIEW: "قيد المراجعة" },
    climateHint: "بيانات من أطلس المدن (قريبًا)",
    role: { authority: "جهة الاعتماد", consultant: "استشاري", client: "عميل" },
    disabledByRole: "غير متاح لدورك الحالي",
    langAr: "عربي", langEn: "EN",
  },
  en: {
    brand: "Sima AI — Project Overview",
    back: "Back to Projects List",
    analyze: "AI Analysis",
    studio3d: "3D Studio",
    report: "Report / Certificate",
    startWorkflow: "Start Workflow",
    meta: { city: "City", scope: "Scope", style: "Style", climate: "Climate", updated: "Updated" },
    files: { title: "Uploaded Files", upload: "Upload file", empty: "No files uploaded." },
    team: { title: "Team", add: "Add member" },
    audit: { title: "Audit Log" },
    status: { PASS: "PASS", FAIL: "FAIL", UNDER_REVIEW: "Under review" },
    climateHint: "From City Atlas (soon)",
    role: { authority: "Authority", consultant: "Consultant", client: "Client" },
    disabledByRole: "Not permitted for your role",
    langAr: "AR", langEn: "EN",
  }
};

// —————————————— helpers & seed ——————————————
const cls=(...a:string[])=>a.filter(Boolean).join(" ");

type Status = "PASS"|"FAIL"|"UNDER_REVIEW";

type Project = {
  id:string; name:string; org:string; city:string; scope:string; style:string; climate:string; compliance:number; status:Status; updated:string;
  files: { id:string; name:string; type:"PDF"|"DWG"|"IFC"; size:string; }[];
  team: { id:string; name:string; role:"Architect"|"Consultant"|"Authority"; email:string; }[];
  audit: { id:string; ts:string; actor:string; action:string; note?:string; }[];
};

const PROJECTS: Record<string, Project> = {
  "P-1003": {
    id:"P-1003", name:"فندق تراثي — وسط جدة", org:"معمار الحجاز", city:"جدة", scope:"فندقي", style:"حجازي ساحلي", climate:"حار رطب ساحلي", compliance:74, status:"PASS", updated:"2025-10-17",
    files:[
      {id:"F1", name:"واجهات_جدة.pdf", type:"PDF", size:"3.2 MB"},
      {id:"F2", name:"موقع_المشروع.dwg", type:"DWG", size:"1.1 MB"},
      {id:"F3", name:"نموذج.gltf", type:"IFC", size:"22.8 MB"},
    ],
    team:[
      {id:"U1", name:"سارة الحربي", role:"Architect", email:"sarah@studio.sa"},
      {id:"U2", name:"Anas Al Harbi", role:"Consultant", email:"a.harbi@consult.sa"},
      {id:"U3", name:"DASC Reviewer", role:"Authority", email:"review@dasc.gov.sa"},
    ],
    audit:[
      {id:"A1", ts:"2025-10-12 09:11", actor:"سارة", action:"إنشاء المشروع"},
      {id:"A2", ts:"2025-10-12 09:22", actor:"سارة", action:"رفع ملف", note:"واجهات_جدة.pdf"},
      {id:"A3", ts:"2025-10-13 14:05", actor:"Anas", action:"تعديل وصف الطراز"},
      {id:"A4", ts:"2025-10-15 10:40", actor:"AI", action:"تحليل أولي", note:"هوية 78%"},
      {id:"A5", ts:"2025-10-17 16:02", actor:"Authority", action:"اعتماد مبدئي"},
    ],
  },
};

// simple pin coordinates within an SVG map box (0..100)
const CITY_POS: Record<string,{x:number,y:number}> = {
  "الرياض":{x:55,y:50}, "جدة":{x:28,y:60}, "مكة":{x:33,y:62}, "الدمام":{x:75,y:48}, "أبها":{x:35,y:78}, "نجران":{x:45,y:88}, "تبوك":{x:22,y:28}, "الطائف":{x:37,y:65}, "الهفوف":{x:73,y:55}, "القطيف":{x:76,y:52}
};

const Icons = {
  logo: ()=> (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.6"/></svg>),
  arrow: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/></svg>),
  filePDF: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="14" height="18" rx="2" stroke="currentColor"/><path d="M8 9h3M8 12h5M8 15h2" stroke="currentColor"/></svg>),
  fileDWG: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="14" height="18" rx="2" stroke="currentColor"/><path d="M7 14h10M7 10h7M7 17h6" stroke="currentColor"/></svg>),
  fileIFC: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 5v8l-8 5-8-5V8l8-5z" stroke="currentColor"/><path d="M12 8v8" stroke="currentColor"/></svg>),
  upload: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V6m0 0l-3 3m3-3l3 3" stroke="currentColor"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor"/></svg>),
  check: ()=> (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2"/></svg>),
  lock: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor"/><path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor"/></svg>),
};

function StatusPill({s}:{s:Status}){
  const map:Record<Status,string> = { PASS:"bg-emerald-100 text-emerald-700", FAIL:"bg-rose-100 text-rose-700", UNDER_REVIEW:"bg-amber-100 text-amber-900" };
  const label = s as keyof typeof map; // same keys
  return <span className={cls("px-2 py-0.5 rounded-full text-[11px]", map[label])}>{label}</span>;
}

function Donut({value}:{value:number}){
  const pct = Math.max(0,Math.min(100,value));
  const r=28, c=r*2*Math.PI; const dash = (pct/100)*c;
  const tone = pct>=75?"#10b981": pct>=60?"#f59e0b":"#ef4444";
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={tone} strokeWidth="8" strokeDasharray={`${dash} ${c-dash}`} transform="rotate(-90 40 40)" strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#111827">{pct}%</text>
    </svg>
  );
}

function MapKSA({city}:{city:string}){
  const pos = CITY_POS[city] || {x:50,y:55};
  return (
    <svg viewBox="0 0 100 100" className="w-full h-48 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
      {/* simplified silhouette */}
      <path d="M16 22l8-6 12-3 16 2 10 8 10 6 6 10-4 12-8 12-4 10-12 6-10 6-16-4-8-10-6-12 2-18 4-8z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6" />
      {/* pin */}
      <g transform={`translate(${pos.x} ${pos.y})`}>
        <circle r="2.5" fill="#0ea5e9" />
        <circle r="1" fill="#0369a1" />
      </g>
    </svg>
  );
}

export default function SimaProjectOverview(){
  const [lang,setLang]=useState<"ar"|"en">("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  // role awareness
  const [role,setRole]=useState<"authority"|"consultant"|"client">("consultant");

  // pick project by URL ?pid=, default P-1003
  const [pid,setPid] = useState<string>(()=>{
    try{ const u=new URL(window.location.href); return u.searchParams.get("pid")||"P-1003"; }catch{ return "P-1003"; }
  });
  const p = PROJECTS[pid] || PROJECTS["P-1003"];

  // upload handler (mock)
  const [uploading,setUploading]=useState(false);
  function handleUpload(ev:React.ChangeEvent<HTMLInputElement>){
    const files = Array.from(ev.target.files||[]);
    if(!files.length) return;
    setUploading(true);
    setTimeout(()=>{ alert((rtl?"تم رفع ":"Uploaded ")+files.map(f=>f.name).join(", ")); setUploading(false); }, 600);
  }

  // tests
  const tests = useMemo(()=>{
    const hasProject = !!p && typeof p.compliance==="number";
    const hasI18n = !!T.ar.meta.city && !!T.en.meta.city;
    return { ok: hasProject && hasI18n, tip:`project:${hasProject} i18n:${hasI18n}` };
  },[p]);

  const roleCanStart = role!=="client"; // authority & consultant only

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
            <a className="text-sm text-slate-700 underline decoration-slate-300 hover:decoration-slate-800" href="/projects">{t.back}</a>
            <button onClick={()=>setLang("ar")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='ar'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>{t.langAr}</button>
            <button onClick={()=>setLang("en")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='en'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>{t.langEn}</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Donut value={p.compliance}/>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">{p.name}</h1>
              <div className="text-[12px] text-slate-600">{p.org} • <StatusPill s={p.status}/></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>window.location.href=`/project/${p.id}/analysis`} className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">{t.analyze}</button>
            <a href={`/studio/3d?pid=${p.id}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-800">{t.studio3d}</a>
            <a href={`/certificate/${p.id}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-800">{t.report}</a>
            <button disabled={!roleCanStart} title={!roleCanStart? (rtl?t.disabledByRole:t.disabledByRole):""} onClick={()=>alert(rtl?"تم بدء مسار الاعتماد":"Workflow started")} className={cls("rounded-xl px-4 py-2 text-sm", roleCanStart?"bg-emerald-600 text-white":"bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1")}>{!roleCanStart && <Icons.lock/>}{t.startWorkflow}</button>
          </div>
        </div>

        {/* Meta + Map */}
        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><div className="text-slate-500 text-[11px]">{t.meta.city}</div><div className="font-medium">{p.city}</div></div>
              <div><div className="text-slate-500 text-[11px]">{t.meta.scope}</div><div className="font-medium">{p.scope}</div></div>
              <div><div className="text-slate-500 text-[11px]">{t.meta.style}</div><div className="font-medium">{p.style}</div></div>
              <div><div className="text-slate-500 text-[11px]">{t.meta.climate}</div><div className="font-medium">{p.climate}</div><div className="text-[11px] text-slate-500">{t.climateHint}</div></div>
              <div><div className="text-slate-500 text-[11px]">{t.meta.updated}</div><div className="font-medium">{p.updated}</div></div>
            </div>
            <div className="mt-4"><MapKSA city={p.city}/></div>
          </div>
          <div className="lg:col-span-1 p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{t.files.title}</h3>
              <label className="inline-flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                <input type="file" multiple className="hidden" onChange={handleUpload} />
                <Icons.upload/> {uploading? (rtl?"جاري الرفع…":"Uploading…") : t.files.upload}
              </label>
            </div>
            {p.files.length? (
              <ul className="grid gap-2">
                {p.files.map(f=> (
                  <li key={f.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-sm">
                      {f.type==="PDF"? <Icons.filePDF/> : f.type==="DWG"? <Icons.fileDWG/> : <Icons.fileIFC/>}
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-[11px] text-slate-500">{f.type} · {f.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]">
                      <a className="underline decoration-slate-300 hover:decoration-slate-800" href="#">عرض</a>
                      <span className="text-slate-300">•</span>
                      <a className="underline decoration-slate-300 hover:decoration-slate-800" href="#">تنزيل</a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">{t.files.empty}</div>
            )}
          </div>
        </div>

        {/* Team + Audit */}
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{t.team.title}</h3>
              <button onClick={()=>alert(rtl?"إضافة عضو (نموذج)":"Add member (modal)")} className="text-sm underline decoration-slate-300 hover:decoration-slate-800">{t.team.add}</button>
            </div>
            <ul className="grid gap-2">
              {p.team.map(m=> (
                <li key={m.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-200 text-sm">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-slate-500">{m.role}</div>
                  <div className="text-slate-500">{m.email}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[11px] text-slate-500">RBAC: {t.role[role]}</div>
            <div className="mt-1 flex gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"><Icons.check/> View</span>
              {role!=="client" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"><Icons.check/> Edit</span>}
              {role==="authority" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"><Icons.check/> Approve</span>}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            <h3 className="font-semibold text-sm mb-2">{t.audit.title}</h3>
            <ol className="relative ml-3">
              {p.audit.map(a=> (
                <li key={a.id} className="mb-3">
                  <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-slate-400" />
                  <div className="text-[12px] text-slate-500">{a.ts}</div>
                  <div className="text-sm"><span className="font-medium">{a.actor}</span> — {a.action} {a.note? `(${a.note})`: ''}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-200 text-center text-[11px] text-slate-600">Sima AI · Project Overview</footer>

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
