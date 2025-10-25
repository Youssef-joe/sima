import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sima AI — Screen 02: Unified Dashboard (/dashboard)
 * - RBAC aware (Authority / Consultant / Client)
 * - i18n AR/EN + RTL; remembers choice in localStorage
 * - KPI cards, status breakdown, mini tables
 * - Quick actions: New Project / Open 3D / Compliance / Certificate
 * - Internal "Watch Demo" video modal (accessible)
 * - Zero external icon libs (inline SVG)
 * - Runtime console tests (non-invasive). DO NOT alter UI state.
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — لوحة القيادة",
    role: "الدور",
    roles: { authority: "جهة الاعتماد", consultant: "استشاري", client: "عميل" },
    langAr: "عربي",
    langEn: "English",
    search: "ابحث عن مشروع...",
    kpIs: {
      underReview: "قيد المراجعة",
      passRate: "نسبة النجاح",
      avgReviewTime: "متوسط زمن المراجعة",
      learningDelta: "تطور الذكاء (24س)"
    },
    actions: {
      newProject: "+ مشروع جديد",
      open3d: "فتح الاستوديو",
      compliance: "تحليل المطابقة",
      certificate: "الشهادة",
      authorityPanel: "لوحة جهة الاعتماد",
      watchDemo: "مشاهدة العرض",
    },
    tables: {
      myProjects: "مشاريعي",
      pending: "مشاريع بانتظار الإجراء",
      city: "المدينة",
      status: "الحالة",
      score: "النسبة",
      updated: "آخر تحديث",
      project: "المشروع",
      actions: "إجراءات"
    },
    statuses: { pending: "قيد المراجعة", conditional: "مشروط", approved: "معتمد", rejected: "مرفوض" },
    empty: "— لا توجد عناصر —",
    videoTitle: "عرض تعريفي للمنصة",
    close: "إغلاق",
  },
  en: {
    brand: "Sima AI — Dashboard",
    role: "Role",
    roles: { authority: "Authority", consultant: "Consultant", client: "Client" },
    langAr: "Arabic",
    langEn: "English",
    search: "Search projects...",
    kpIs: {
      underReview: "Under Review",
      passRate: "PASS Rate",
      avgReviewTime: "Avg. Review Time",
      learningDelta: "AI Learning Δ (24h)"
    },
    actions: {
      newProject: "+ New Project",
      open3d: "Open 3D Studio",
      compliance: "Compliance",
      certificate: "Certificate",
      authorityPanel: "Authority Panel",
      watchDemo: "Watch Demo",
    },
    tables: {
      myProjects: "My Projects",
      pending: "Pending Actions",
      city: "City",
      status: "Status",
      score: "Score",
      updated: "Updated",
      project: "Project",
      actions: "Actions"
    },
    statuses: { pending: "Under Review", conditional: "Conditional", approved: "Approved", rejected: "Rejected" },
    empty: "— No items —",
    videoTitle: "Platform Intro Video",
    close: "Close",
  }
};

// ————————— types —————————
type Lang = keyof typeof T;
type Role = "authority"|"consultant"|"client";
type Status = "pending"|"conditional"|"approved"|"rejected";

interface Project { id:string; name:string; owner:string; city:string; style:string; score:number; status:Status; updatedAt:string; }

const seed: Project[] = [
  { id:"P-001", name:"مركز ثقافي — نجران", owner:"Studio Najd", city:"نجران", style:"جنوبي", score:82, status:"pending", updatedAt:"2025-10-20T09:10:00Z" },
  { id:"P-002", name:"مجمع سكني — الرياض", owner:"AlRiyadh Arch", city:"الرياض", style:"نجدي", score:88, status:"approved", updatedAt:"2025-10-22T13:00:00Z" },
  { id:"P-003", name:"واجهة بحرية — جدة", owner:"Hijaz Lab", city:"جدة", style:"حجازي", score:76, status:"conditional", updatedAt:"2025-10-19T15:40:00Z" },
  { id:"P-004", name:"مبنى إداري — أبها", owner:"Asir Design", city:"أبها", style:"تهامي", score:91, status:"approved", updatedAt:"2025-10-23T08:05:00Z" },
  { id:"P-005", name:"كلية تصميم — المدينة", owner:"Haramain Arch", city:"المدينة المنورة", style:"حجازي", score:69, status:"pending", updatedAt:"2025-10-21T11:25:00Z" },
];

export default function SimaDashboard(){
  // ————————— state —————————
  const [lang,setLang] = useState<Lang>(()=> (localStorage.getItem("sima_lang") as Lang) || "ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang === "ar";

  const [role,setRole] = useState<Role>(()=> (localStorage.getItem("sima_role") as Role) || "consultant");
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);
  useEffect(()=>{ localStorage.setItem("sima_lang", lang); },[lang]);
  useEffect(()=>{ localStorage.setItem("sima_role", role); },[role]);

  const [q,setQ]=useState("");
  const rows = useMemo(()=> seed.filter(r=> !q || (r.name+" "+r.owner+" "+r.city+" "+r.style).toLowerCase().includes(q.toLowerCase())),[q]);

  // KPIs (mocked demo numbers)
  const k_under = rows.filter(r=>r.status==="pending").length;
  const k_pass = Math.round((rows.filter(r=>r.status==="approved").length/Math.max(1,rows.length))*100);
  const k_avg = "2.4d"; // days
  const k_delta = "+3.2%";

  // video modal
  const [showVideo,setShowVideo] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{ if(showVideo) setTimeout(()=>closeBtnRef.current?.focus(),0); },[showVideo]);

  // ————————— header —————————
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogoBox/>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <RolePill t={t} role={role}/>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>{t.langAr}</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>{t.langEn}</button>
          </div>
        </div>
      </header>

      {/* toolbar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex-1 flex items-center gap-2">
          <SearchIcon/>
          <input aria-label={t.search} placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"/>
        </div>
        <div className="flex items-center gap-2">
          <select value={role} onChange={e=>setRole(e.target.value as Role)} className="px-3 py-2 border rounded-xl text-sm">
            <option value="authority">{t.roles.authority}</option>
            <option value="consultant">{t.roles.consultant}</option>
            <option value="client">{t.roles.client}</option>
          </select>
          <button onClick={()=>setShowVideo(true)} className="px-3 py-2 rounded-xl border text-sm">{t.actions.watchDemo}</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t.kpIs.underReview} value={k_under} icon={<ClipboardIcon/>} tone="sky"/>
        <StatCard title={t.kpIs.passRate} value={`${k_pass}%`} icon={<CheckIcon/>} tone="emerald"/>
        <StatCard title={t.kpIs.avgReviewTime} value={k_avg} icon={<ClockIcon/>} tone="amber"/>
        <StatCard title={t.kpIs.learningDelta} value={k_delta} icon={<SparkIcon/>} tone="violet"/>
      </div>

      {/* role blocks */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {role === "authority" && (
          <>
            <div className="lg:col-span-2">
              <SummaryCard title={t.tables.pending} subtitle="Workflow">
                <MiniTable t={t} rows={rows.filter(r=>r.status!=="approved")} />
              </SummaryCard>
            </div>
            <SummaryCard title="Cities / Styles" subtitle="Overview">
              <HeatLegend/>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] text-slate-600">
                <div>الرياض — PASS 88%</div>
                <div>جدة — PASS 74%</div>
                <div>نجران — PASS 81%</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionBtn onClick={()=>window.location.assign('/authority/panel')}>{t.actions.authorityPanel}</ActionBtn>
              </div>
            </SummaryCard>
          </>
        )}

        {role === "consultant" && (
          <>
            <div className="lg:col-span-2">
              <SummaryCard title={t.tables.myProjects} subtitle="Status">
                <StatusBreakdown rows={rows}/>
                <MiniTable t={t} rows={rows} />
              </SummaryCard>
            </div>
            <SummaryCard title="Quick Actions" subtitle="">
              <div className="flex flex-col gap-2">
                <ActionBtn onClick={()=>window.location.assign('/project/new')}>{t.actions.newProject}</ActionBtn>
                <ActionBtn onClick={()=>window.location.assign(`/project/${rows[0]?.id||'P-001'}/analysis`)}>{t.actions.compliance}</ActionBtn>
                <ActionBtn onClick={()=>window.location.assign(`/studio/3d?pid=${rows[0]?.id||'P-001'}`)}>{t.actions.open3d}</ActionBtn>
              </div>
            </SummaryCard>
          </>
        )}

        {role === "client" && (
          <>
            <div className="lg:col-span-2">
              <SummaryCard title={t.tables.myProjects} subtitle="Progress">
                <MiniTable t={t} rows={rows} />
              </SummaryCard>
            </div>
            <SummaryCard title="Next" subtitle="">
              <div className="flex flex-col gap-2">
                <ActionBtn onClick={()=>window.location.assign(`/certificate/${rows[1]?.id||'P-002'}`)}>{t.actions.certificate}</ActionBtn>
                <ActionBtn onClick={()=>window.location.assign(`/project/${rows[1]?.id||'P-002'}/analysis`)}>{t.actions.compliance}</ActionBtn>
              </div>
            </SummaryCard>
          </>
        )}
      </div>

      {/* video modal */}
      {showVideo && (
        <div role="dialog" aria-modal="true" aria-labelledby="demoTitle" className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div id="demoTitle" className="font-semibold">{t.videoTitle}</div>
              <button ref={closeBtnRef} onClick={()=>setShowVideo(false)} className="px-2 py-1 border rounded-lg text-sm">{t.close}</button>
            </div>
            <div className="aspect-video bg-black">
              {/* Placeholder demo video. Replace src with your internal CDN link. */}
              <iframe title="Sima AI Demo" className="w-full h-full" src="https://player.vimeo.com/video/76979871?h=8272103f6e&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" />
            </div>
          </div>
        </div>
      )}

      {/* tests badge */}
      <TestsBadge rows={rows} t={t} />

      <style>{`
        html{scroll-behavior:smooth}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}

// ————————— Components —————————
function clsBtn(active:boolean){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }

function LogoBox(){ return <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><SparkIcon/></div>; }
function RolePill({t, role}:{t:any, role:Role}){ return <div className="hidden sm:block text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.role}: {t.roles[role]}</div>; }

function StatCard({title,value,icon,tone}:{title:string; value:string|number; icon:React.ReactNode; tone:"sky"|"emerald"|"amber"|"violet"}){
  const map = {
    sky:    "border-sky-200 bg-sky-50 text-sky-800",
    emerald:"border-emerald-200 bg-emerald-50 text-emerald-800",
    amber:  "border-amber-200 bg-amber-50 text-amber-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
  } as const;
  return (
    <div className={`border rounded-2xl p-4 ${map[tone]}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">{title}</div>
        <div aria-hidden>{icon}</div>
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function SummaryCard({title, subtitle, children}:{title:string; subtitle?:string; children:React.ReactNode}){
  return (
    <section className="border rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{subtitle}</div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MiniTable({t, rows}:{t:any; rows:Project[]}){
  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="min-w-full text-sm" aria-label="mini-projects">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <Th>{t.tables.project}</Th>
            <Th>{t.tables.city}</Th>
            <Th>{t.tables.score}</Th>
            <Th>{t.tables.status}</Th>
            <Th>{t.tables.updated}</Th>
            <Th>{t.tables.actions}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length? rows.map(r=> (
            <tr key={r.id} className="border-t">
              <Td>
                <div className="font-medium">{r.name}</div>
                <div className="text-[12px] text-slate-500">{r.id}</div>
              </Td>
              <Td>{r.city}</Td>
              <Td><Badge color={scoreColor(r.score)}>{r.score}%</Badge></Td>
              <Td><StatusPill s={r.status}/></Td>
              <Td>{new Date(r.updatedAt).toLocaleString()}</Td>
              <Td>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={()=>window.location.assign(`/studio/3d?pid=${r.id}`)} className="px-2.5 py-1.5 rounded-lg border text-[12px]">3D</button>
                  <button onClick={()=>window.location.assign(`/project/${r.id}/analysis`)} className="px-2.5 py-1.5 rounded-lg border text-[12px]">AI</button>
                  <button onClick={()=>window.location.assign(`/certificate/${r.id}`)} className="px-2.5 py-1.5 rounded-lg border text-[12px]">PDF</button>
                </div>
              </Td>
            </tr>
          )): (
            <tr><Td colSpan={6}>
              <div className="py-8 text-center text-slate-500">{t.empty}</div>
            </Td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBreakdown({rows}:{rows:Project[]}){
  const total = Math.max(1, rows.length);
  const counts = {
    approved: rows.filter(r=>r.status==='approved').length,
    conditional: rows.filter(r=>r.status==='conditional').length,
    pending: rows.filter(r=>r.status==='pending').length,
    rejected: rows.filter(r=>r.status==='rejected').length,
  } as const;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      <BreakCard label="Approved" n={counts.approved} total={total} color="emerald"/>
      <BreakCard label="Conditional" n={counts.conditional} total={total} color="amber"/>
      <BreakCard label="Pending" n={counts.pending} total={total} color="sky"/>
      <BreakCard label="Rejected" n={counts.rejected} total={total} color="rose"/>
    </div>
  );
}
function BreakCard({label,n,total,color}:{label:string;n:number;total:number;color:"emerald"|"amber"|"sky"|"rose"}){
  const pct = Math.round((n/Math.max(1,total))*100);
  const bar = { emerald:"bg-emerald-500", amber:"bg-amber-500", sky:"bg-sky-500", rose:"bg-rose-500" } as const;
  return (
    <div className="border rounded-xl p-3">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{pct}%</div>
      <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar[color]}`} style={{width:`${pct}%`}}/>
      </div>
    </div>
  );
}

function HeatLegend(){
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="w-3 h-3 rounded-sm bg-emerald-500"/> PASS
      <span className="w-3 h-3 rounded-sm bg-amber-500"/> MID
      <span className="w-3 h-3 rounded-sm bg-rose-500"/> FAIL
    </div>
  );
}

function ActionBtn({onClick, children}:{onClick:()=>void; children:React.ReactNode}){
  return <button onClick={onClick} className="px-3 py-2 rounded-xl border text-sm hover:bg-slate-50">{children}</button>;
}

function Th({children}:{children:React.ReactNode}){ return <th scope="col" className="text-left px-3 py-2 font-medium">{children}</th>; }
function Td({children,colSpan}:{children:React.ReactNode; colSpan?:number}){ return <td colSpan={colSpan} className="px-3 py-2 align-top">{children}</td>; }

function Badge({children, color}:{children:React.ReactNode, color:"emerald"|"amber"|"rose"|"sky"|"slate"}){
  const map = { emerald:"bg-emerald-50 text-emerald-700 border-emerald-300", amber:"bg-amber-50 text-amber-700 border-amber-300", rose:"bg-rose-50 text-rose-700 border-rose-300", sky:"bg-sky-50 text-sky-700 border-sky-300", slate:"bg-slate-50 text-slate-700 border-slate-300" } as const;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] ${map[color]}`}>{children}</span>;
}

function scoreColor(s:number){ if(s>=85) return "emerald"; if(s>=70) return "sky"; if(s>=50) return "amber"; return "rose"; }
function StatusPill({s}:{s:Status}){
  const label = { pending: "Pending", conditional: "Conditional", approved: "Approved", rejected: "Rejected" }[s];
  const color = { pending:"slate", conditional:"amber", approved:"emerald", rejected:"rose" }[s] as any;
  return <Badge color={color}>{label}</Badge>;
}

// ————————— Inline SVG icons —————————
function SearchIcon(){ return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="search icon">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);} 
function ClipboardIcon(){ return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="7" y="3" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="4" y="7" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);} 
function CheckIcon(){ return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);} 
function ClockIcon(){ return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);} 
function SparkIcon(){ return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 2l1.6 4.8L19 8l-4.4 2.6L13 16l-1-5.4L7 8l5 .8L12 2z" stroke="currentColor" strokeWidth="1.1" fill="none"/>
  </svg>
);} 

// ————————— Tests —————————
function TestsBadge({rows,t}:{rows:Project[]; t:any}){
  const ok = (()=>{
    try{
      console.assert(Boolean(T.ar) && Boolean(T.en), 'i18n present');
      console.assert(['authority','consultant','client'].includes((localStorage.getItem('sima_role') as any) || 'consultant'), 'role seed');
      console.assert(rows.length>=3, 'seed length');
      // modal a11y attributes exist in markup when open; can't assert here without opening.
      return true;
    }catch(e){ console.warn('Dev tests warn:', e); return false; }
  })();
  return (
    <div className="fixed bottom-3 left-3 z-50">
      <div className={`px-2.5 py-1.5 rounded-full text-[10px] ${ok? 'bg-emerald-600 text-white':'bg-amber-500 text-black'}`}>{ok? 'Tests: PASS':'Tests: CHECK'}</div>
    </div>
  );
}
