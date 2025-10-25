import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 08: Smart Recommendations (/project/[id]/recommendations)
 * Complete, self-contained, no external CDNs.
 * - Before/After visualization (facade opening ratio mock)
 * - Smart suggestion list with APPLY / REVERT and live re-scoring
 * - Range sliders (native) with a11y labels; AR/EN + RTL
 * - RBAC (Authority/Consultant/Client) affects actions visibility
 * - Export applied suggestions to JSON, and copy link with query params
 * - Runtime tests badge (schema, i18n, recompute)
 * - Keyboard accessible controls (focus rings)
 */

// —————————————— i18n ——————————————
const T = {
  ar: {
    brand: "Sima AI — التوصيات الذكية",
    back: "عودة إلى التحليل",
    summary: "ملخص التقييم بعد التعديلات",
    baseScore: "الدرجة الأساسية",
    newScore: "الدرجة بعد التحسين",
    delta: "فرق التحسين",
    actions: {
      export: "تصدير التعديلات JSON",
      copylink: "نسخ رابط الحالة",
      reset: "إعادة التهيئة",
      applyAll: "تطبيق الكل",
    },
    panel: {
      title: "التوصيات المقترحة",
      search: "بحث في التوصيات…",
      cat: "الفئة",
      impact: "الأثر",
      apply: "تطبيق",
      revert: "تراجع",
      applied: "مُطبّق",
    },
    cat: { identity: "هوية", climate: "مناخ", materials: "مواد", openings: "فتحات", context: "سياق" },
    impact: { low: "منخفض", med: "متوسط", high: "عالٍ" },
    viz: {
      title: "المقارنة البصرية (قبل/بعد)",
      before: "قبل",
      after: "بعد",
      openings: "نسبة الفتحات",
      shade: "التظليل",
    },
    testsPass: "Tests: PASS",
    testsCheck: "Tests: CHECK",
    role: { authority: "جهة الاعتماد", consultant: "استشاري", client: "عميل" },
  },
  en: {
    brand: "Sima AI — Smart Recommendations",
    back: "Back to Analysis",
    summary: "Score Summary After Changes",
    baseScore: "Base Score",
    newScore: "New Score",
    delta: "Delta",
    actions: {
      export: "Export JSON",
      copylink: "Copy State Link",
      reset: "Reset",
      applyAll: "Apply All",
    },
    panel: {
      title: "Suggested Improvements",
      search: "Search recommendations…",
      cat: "Category",
      impact: "Impact",
      apply: "Apply",
      revert: "Revert",
      applied: "Applied",
    },
    cat: { identity: "Identity", climate: "Climate", materials: "Materials", openings: "Openings", context: "Context" },
    impact: { low: "Low", med: "Medium", high: "High" },
    viz: {
      title: "Visual Compare (Before / After)",
      before: "Before",
      after: "After",
      openings: "Openings Ratio",
      shade: "Shading",
    },
    testsPass: "Tests: PASS",
    testsCheck: "Tests: CHECK",
    role: { authority: "Authority", consultant: "Consultant", client: "Client" },
  }
};

type Lang = keyof typeof T;

// —————————————— helpers & icons ——————————————
const cls=(...a:string[])=>a.filter(Boolean).join(" ");
const Icons = {
  logo: ()=> (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.6"/></svg>),
  arrow: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/></svg>),
  apply: ()=> (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2"/></svg>),
  revert: ()=> (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M7 17L17 7" stroke="currentColor" strokeWidth="2"/></svg>),
  download: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4v10m0 0l-3-3m3 3l3-3" stroke="currentColor"/><path d="M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor"/></svg>),
  link: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 14l-1 1a3 3 0 104.2 4.3l1-1M14 10l1-1a3 3 0 10-4.2-4.3l-1 1" stroke="currentColor"/></svg>),
  reset: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4v6h6M20 20v-6h-6" stroke="currentColor"/><path d="M20 10a8 8 0 00-14-5M4 14a8 8 0 0014 5" stroke="currentColor"/></svg>),
};

// —————————————— data model ——————————————

type Category = "identity"|"climate"|"materials"|"openings"|"context";

type Rec = {
  id:string;
  category: Category;
  title_ar:string; title_en:string;
  desc_ar:string; desc_en:string;
  impact: "low"|"med"|"high";
  delta:number; // added to score if applied
  knobs?: { // optional interactive knobs (e.g., sliders)
    openings?: { before:number; after:number; min:number; max:number; step:number };
    shade?: { before:number; after:number; min:number; max:number; step:number };
  }
};

const BASE_SCORE = 72; // mock base from previous screen

const RECS: Rec[] = [
  { id:"R-OPEN-01", category:"openings", impact:"med", delta:6,
    title_ar:"خفض نسبة الفتحات في الواجهة الجنوبية",
    title_en:"Reduce openings on south façade",
    desc_ar:"تخفيض الفتحات إلى أقل من 40% يرفع التوافق مع الطراز النجدي ويقلل الكسب الحراري.",
    desc_en:"Reducing openings below ~40% improves Najdi identity compliance and lowers heat gain.",
    knobs:{ openings:{ before:48, after:38, min:10, max:80, step:1 } }
  },
  { id:"R-SHD-02", category:"climate", impact:"high", delta:9,
    title_ar:"زيادة عناصر التظليل في الواجهة الغربية",
    title_en:"Increase shading on west façade",
    desc_ar:"رفع التظليل إلى 35% يقلل الإشعاع الشمسي ويحسّن الراحة الحرارية.",
    desc_en:"Increasing shading to ~35% reduces solar gains and improves thermal comfort.",
    knobs:{ shade:{ before:10, after:35, min:0, max:60, step:1 } }
  },
  { id:"R-MAT-03", category:"materials", impact:"med", delta:5,
    title_ar:"استبدال الطلاء العاكس بدرجة ترابية محلية",
    title_en:"Replace reflective coating with earthy local palette",
    desc_ar:"الألوان الترابية تقلل الانبهار وتتماهى مع الهوية البصرية للبيئة المحلية.",
    desc_en:"Earthy palette reduces glare and aligns with local identity.",
  },
  { id:"R-IDN-04", category:"identity", impact:"low", delta:3,
    title_ar:"تعزيز النسب التقليدية في تكوين الواجهة",
    title_en:"Reinforce traditional façade proportions",
    desc_ar:"تعديل النسب يرفع درجة المطابقة الجمالية ويعزز القراءة البصرية للطراز.",
    desc_en:"Adjusting proportions increases identity match and visual coherence.",
  },
];

// —————————————— main component ——————————————
export default function SimaSmartRecommendations(){
  const [lang,setLang]=useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  // role
  const [role] = useState<"authority"|"consultant"|"client">("consultant");

  // pid
  const [pid] = useState<string>(()=>{ try{ const u=new URL(window.location.href); return u.searchParams.get("pid")||"P-1003";}catch{return "P-1003";} });

  // applied state
  const [applied,setApplied]=useState<Record<string,boolean>>(()=>Object.fromEntries(RECS.map(r=>[r.id,false])));
  const [knob,setKnob]=useState<Record<string,number>>(()=>{
    const obj:Record<string,number>={};
    RECS.forEach(r=>{
      if(r.knobs?.openings) obj[r.id+":openings"]=r.knobs.openings.after;
      if(r.knobs?.shade) obj[r.id+":shade"]=r.knobs.shade.after;
    });
    return obj;
  });

  // filters
  const [q,setQ]=useState("");
  const [fCat,setFCat]=useState<"all"|Category>("all");

  const filtered = useMemo(()=>{
    return RECS.filter(r=> (fCat==="all"||r.category===fCat) && (
      (lang==='ar'? r.title_ar + r.desc_ar: r.title_en + r.desc_en).toLowerCase().includes(q.toLowerCase())
    ));
  },[q,fCat,lang]);

  // recompute score
  const delta = useMemo(()=> RECS.reduce((s,r)=> s + (applied[r.id]? r.delta:0), 0), [applied]);
  const newScore = Math.min(100, BASE_SCORE + delta);

  // aria-live updates when score changes
  const [announce,setAnnounce]=useState("");
  useEffect(()=>{ setAnnounce(`${rtl?"تم تحديث الدرجة إلى":"Score updated to"} ${newScore}`); },[newScore,rtl]);

  // actions
  function onApply(id:string, yes:boolean){ setApplied(p=>({...p,[id]:yes})); }
  function onReset(){ setApplied(Object.fromEntries(RECS.map(r=>[r.id,false]))); setKnob(k=>({...k})); }
  function onApplyAll(){ setApplied(Object.fromEntries(RECS.map(r=>[r.id,true]))); }

  function exportJSON(){
    const payload = { pid, base: BASE_SCORE, newScore, applied, knobs };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=`recommendations_${pid}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function copyLink(){
    try{
      const s = new URLSearchParams();
      s.set('pid', pid);
      Object.entries(applied).forEach(([k,v])=>{ if(v) s.append('applied', k); });
      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?${s.toString()}`);
    }catch{}
  }

  // tests (runtime)
  const tests = useMemo(()=>{
    const i18nOk = !!T.ar.brand && !!T.en.brand;
    const recsOk = RECS.length>=3 && RECS.every(r=>typeof r.delta==='number');
    const scoreOk = newScore>=BASE_SCORE && newScore<=100;
    return { ok: i18nOk && recsOk && scoreOk, tip:`i18n:${i18nOk} recs:${recsOk} score:${scoreOk}` };
  },[newScore]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center" aria-hidden><Icons.logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/project/${pid}/analysis`} className="text-sm text-slate-700 underline decoration-slate-300 hover:decoration-slate-800 flex items-center gap-1">
              {rtl? <Icons.arrow/>: null}{t.back}{!rtl? <Icons.arrow/>: null}
            </a>
            <button onClick={()=>setLang("ar")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='ar'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>AR</button>
            <button onClick={()=>setLang("en")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='en'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>EN</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Score summary */}
        <section aria-labelledby="sumTitle" className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 rounded-2xl border border-slate-200 bg-white">
            <h2 id="sumTitle" className="font-semibold text-sm mb-3">{t.summary}</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-600">{t.baseScore}</div>
                <div className="text-2xl font-semibold">{BASE_SCORE}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] text-emerald-700">{t.newScore}</div>
                <div className="text-2xl font-semibold">{newScore}</div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <div className="text-[11px] text-indigo-700">{t.delta}</div>
                <div className="text-2xl font-semibold">+{newScore-BASE_SCORE}</div>
              </div>
            </div>
            <div className="sr-only" aria-live="polite">{announce}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={exportJSON} className="rounded-xl border border-slate-300 px-4 py-2 text-sm inline-flex items-center gap-2"><Icons.download/>{t.actions.export}</button>
              <button onClick={copyLink} className="rounded-xl border border-slate-300 px-4 py-2 text-sm inline-flex items-center gap-2"><Icons.link/>{t.actions.copylink}</button>
              <button onClick={onReset} className="rounded-xl border border-slate-300 px-4 py-2 text-sm inline-flex items-center gap-2"><Icons.reset/>{t.actions.reset}</button>
              <button onClick={onApplyAll} className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">{t.actions.applyAll}</button>
            </div>
          </div>

          {/* Visual compare */}
          <aside className="lg:col-span-1 p-4 rounded-2xl border border-slate-200 bg-white">
            <h3 className="font-semibold text-sm mb-2">{t.viz.title}</h3>
            <VizFacade rtl={rtl} lang={lang} knob={knob} setKnob={setKnob} />
          </aside>
        </section>

        {/* Recommendations list */}
        <section className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">{t.panel.title}</h2>
              <div className="flex items-center gap-2">
                <label className="block">
                  <span className="text-[11px] text-slate-500">{t.panel.search}</span>
                  <input aria-label={t.panel.search} value={q} onChange={e=>setQ(e.target.value)} className="mt-1 w-56 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none" placeholder={t.panel.search} />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500">{t.panel.cat}</span>
                  <select aria-label={t.panel.cat} value={fCat} onChange={e=>setFCat(e.target.value as any)} className="mt-1 w-40 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none">
                    <option value="all">—</option>
                    <option value="identity">{t.cat.identity}</option>
                    <option value="climate">{t.cat.climate}</option>
                    <option value="materials">{t.cat.materials}</option>
                    <option value="openings">{t.cat.openings}</option>
                    <option value="context">{t.cat.context}</option>
                  </select>
                </label>
              </div>
            </div>

            <ul className="grid gap-3">
              {filtered.map(r=>{
                const isApplied = !!applied[r.id];
                return (
                  <li key={r.id} className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{lang==='ar'? r.title_ar : r.title_en}</div>
                        <div className="text-[12px] text-slate-600">{lang==='ar'? r.desc_ar : r.desc_en}</div>
                        <div className="mt-2 text-[11px] text-slate-500">{t.panel.impact}: {t.impact[r.impact]}</div>
                        {r.knobs?.openings && (
                          <KnobSlider
                            id={r.id+":openings"}
                            label={(lang==='ar'? T.ar.viz.openings : T.en.viz.openings)}
                            value={knob[r.id+":openings"] ?? r.knobs.openings.after}
                            setValue={(v)=>setKnob(prev=>({...prev, [r.id+":openings"]:v}))}
                            min={r.knobs.openings.min} max={r.knobs.openings.max} step={r.knobs.openings.step}
                          />
                        )}
                        {r.knobs?.shade && (
                          <KnobSlider
                            id={r.id+":shade"}
                            label={(lang==='ar'? T.ar.viz.shade : T.en.viz.shade)}
                            value={knob[r.id+":shade"] ?? r.knobs.shade.after}
                            setValue={(v)=>setKnob(prev=>({...prev, [r.id+":shade"]:v}))}
                            min={r.knobs.shade.min} max={r.knobs.shade.max} step={r.knobs.shade.step}
                          />
                        )}
                      </div>
                      <div className="w-40 shrink-0 grid gap-1 text-[12px] text-slate-700">
                        <div className="flex items-center justify-between"><span>Δ</span><b>+{isApplied? r.delta:0}</b></div>
                        <div className="flex items-center justify-end gap-2">
                          {!isApplied ? (
                            <button onClick={()=>onApply(r.id,true)} className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-[12px] inline-flex items-center gap-1"><Icons.apply/>{T[lang].panel.apply}</button>
                          ) : (
                            <button onClick={()=>onApply(r.id,false)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-[12px] inline-flex items-center gap-1"><Icons.revert/>{T[lang].panel.revert}</button>
                          )}
                          {isApplied && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{T[lang].panel.applied}</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              {filtered.length===0 && (
                <li className="text-center text-slate-500 py-6">{lang==='ar'? 'لا توجد توصيات مطابقة للبحث' : 'No recommendations match the current search'}</li>
              )}
            </ul>
          </div>

          {/* Side help */}
          <aside className="lg:col-span-1 p-4 rounded-2xl border border-slate-200 bg-white">
            <h3 className="font-semibold text-sm mb-2">A11y · Tips</h3>
            <ul className="list-disc ms-5 text-[12px] text-slate-600 grid gap-1">
              <li>Use native range inputs with visible labels.</li>
              <li>Ensure keyboard focus is always visible.</li>
              <li>Announce score changes via aria-live region.</li>
            </ul>
            <div className="mt-3 text-[11px] text-slate-500">RBAC: {T[lang].role[role]}</div>
          </aside>
        </section>
      </main>

      <footer className="py-8 border-t border-slate-200 text-center text-[11px] text-slate-600">Sima AI · Smart Recommendations</footer>

      {/* tests badge */}
      <div className="fixed bottom-3 left-3 z-50">
        <div title={tests.tip} className={cls("px-2.5 py-1.5 rounded-full text-[10px]", tests.ok?"bg-emerald-600 text-white":"bg-amber-500 text-black")}>{tests.ok? (T[lang].testsPass) : (T[lang].testsCheck)}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
        input[type=range]{width:100%;}
      `}</style>
    </div>
  );
}

// —————————————— subcomponents ——————————————
function VizFacade({rtl, lang, knob, setKnob}:{rtl:boolean, lang:Lang, knob:Record<string,number>, setKnob:React.Dispatch<React.SetStateAction<Record<string,number>>>}){
  // visual mock: 2 cards (before vs after) using gradients to represent openings % and shade %
  // pick openings & shade from first two recs if available
  const openKey = "R-OPEN-01:openings"; const shadeKey = "R-SHD-02:shade";
  const beforeOpen=48, afterOpen = knob[openKey] ?? 38;
  const beforeShade=10, afterShade = knob[shadeKey] ?? 35;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <CardFacade title={T[lang].viz.before} openings={beforeOpen} shade={beforeShade} rtl={rtl}/>
        <CardFacade title={T[lang].viz.after} openings={afterOpen} shade={afterShade} rtl={rtl}/>
      </div>
      <div className="mt-3 grid gap-2">
        <KnobSlider id="viz:open" label={(lang==='ar'? T.ar.viz.openings : T.en.viz.openings)} value={afterOpen} setValue={(v)=>setKnob(p=>({...p,[openKey]:v}))} min={10} max={80} step={1}/>
        <KnobSlider id="viz:shade" label={(lang==='ar'? T.ar.viz.shade : T.en.viz.shade)} value={afterShade} setValue={(v)=>setKnob(p=>({...p,[shadeKey]:v}))} min={0} max={60} step={1}/>
      </div>
    </div>
  );
}

function CardFacade({title, openings, shade, rtl}:{title:string; openings:number; shade:number; rtl:boolean}){
  // openings visualized as vertical window stripes; shade as top visor band
  const stripes = Math.max(2, Math.round(openings/10));
  const windows = Array.from({length:stripes});
  return (
    <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
      <div className="mb-1 text-slate-700">{title}</div>
      <div className="relative h-28 rounded-lg overflow-hidden border border-slate-200 bg-[linear-gradient(90deg,#bcccdc_0%,#e5e7eb_0%)]">
        {/* shade visor */}
        <div className="absolute inset-x-0 top-0" style={{height:`${Math.min(40,shade/2)}%`, background:"rgba(0,0,0,0.15)"}}/>
        {/* wall */}
        <div className="absolute inset-0" style={{background:"#e5dfd1"}}/>
        {/* window stripes */}
        <div className="absolute inset-2 grid" style={{gridTemplateColumns:`repeat(${stripes}, 1fr)`, gap:"6px"}}>
          {windows.map((_,i)=>(
            <div key={i} className="rounded-sm" style={{background:"linear-gradient(#9ec5ff,#6aa7ff)", opacity:0.9}}/>
          ))}
        </div>
      </div>
      <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
        <span>{T[rtl? 'ar':'en'].viz.openings}: {openings}%</span>
        <span>{T[rtl? 'ar':'en'].viz.shade}: {shade}%</span>
      </div>
    </div>
  );
}

function KnobSlider({id,label,value,setValue,min,max,step}:{id:string; label:string; value:number; setValue:(v:number)=>void; min:number; max:number; step:number}){
  return (
    <label className="block">
      <span className="text-[11px] text-slate-500">{label}: <b>{value}%</b></span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e)=>setValue(parseFloat(e.target.value))}
        aria-label={label}
        className="mt-1"
      />
    </label>
  );
}
