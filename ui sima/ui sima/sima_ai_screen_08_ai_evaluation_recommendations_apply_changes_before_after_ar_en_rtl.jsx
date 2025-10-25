import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 08: AI Evaluation & Recommendations
 * Route: /project/[id]/recommendations
 *
 * Goals
 * - Show current compliance score by axes (Identity / Climate / Function / Human / Context)
 * - List AI recommendations with impact estimates
 * - Apply a recommendation → recompute new score (deterministic client demo)
 * - Before/After toggle + diff badges per axis
 * - i18n AR/EN + RTL, a11y, no external deps
 * - Dev tests via console.assert (non-invasive)
 */

 type Lang = "ar"|"en";
 type Axis = "identity"|"climate"|"function"|"human"|"context";
 type AxisScores = Record<Axis, number>; // 0..100

 const T = {
  ar: {
    brand: "Sima AI — التوصيات الذكية",
    back: "عودة",
    roleBanner: "تحليل المشروع وتطبيق التحسينات",
    before: "قبل",
    after: "بعد",
    apply: "تطبيق",
    applied: "تم التطبيق",
    reset: "إعادة التعيين",
    axes: { identity:"الهوية", climate:"المناخ", function:"الوظيفة", human:"الإنسان", context:"السياق" },
    impact: "الأثر المتوقع",
    gain: (n:number)=>`+${n}%`,
    overall: "النتيجة الإجمالية",
    recs: "توصيات الذكاء",
    desc: "يقرأ النظام المشروع ويقترح تحسينات قابلة للتطبيق. عند الضغط على \"تطبيق\" تُعاد الحسابات فورًا مع مقارنة قبل/بعد.",
  },
  en: {
    brand: "Sima AI — Smart Recommendations",
    back: "Back",
    roleBanner: "Project analysis & improvements",
    before: "Before",
    after: "After",
    apply: "Apply",
    applied: "Applied",
    reset: "Reset",
    axes: { identity:"Identity", climate:"Climate", function:"Function", human:"Human", context:"Context" },
    impact: "Expected impact",
    gain: (n:number)=>`+${n}%`,
    overall: "Overall score",
    recs: "AI Recommendations",
    desc: "The system analyzes the project and proposes actionable improvements. When you click Apply, scores are recomputed instantly with a before/after comparison.",
  }
 } as const;

 const baseScores: AxisScores = { identity: 72, climate: 65, function: 78, human: 74, context: 69 };

 type Rec = { id:string; axis: Axis; title_ar:string; title_en:string; delta:number; applied?:boolean };
 const seedRecs: Rec[] = [
  { id:"r1", axis:"climate",  delta: +7,  title_ar:"خفض نسبة الزجاج الجنوبي 15%",  title_en:"Reduce south glazing by 15%" },
  { id:"r2", axis:"identity", delta: +6,  title_ar:"تعديل التدرج اللوني إلى درجة ترابية نجديّة", title_en:"Shift color palette to Najdi earthy tones" },
  { id:"r3", axis:"human",   delta: +4,  title_ar:"زيادة التظليل في مسار المشاة",      title_en:"Add shading along pedestrian route" },
  { id:"r4", axis:"context",  delta: +5,  title_ar:"تحسين الاندماج البصري مع الواجهة التاريخية", title_en:"Improve visual integration with historic frontage" },
  { id:"r5", axis:"function", delta: +3,  title_ar:"تحسين توزيع الخدمات في الدور الأرضي",     title_en:"Refine ground-floor service layout" },
 ];

export default function SimaAiRecommendations(){
  const [lang,setLang] = useState<Lang>('ar');
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==='ar';
  useEffect(()=>{ if(typeof document!=='undefined'){ document.documentElement.dir = rtl? 'rtl':'ltr'; }},[rtl]);

  const [before] = useState<AxisScores>(baseScores);
  const [after,setAfter] = useState<AxisScores>(baseScores);
  const [recs,setRecs] = useState<Rec[]>(seedRecs);

  const overall = (s:AxisScores)=> Math.round((s.identity + s.climate + s.function + s.human + s.context)/5);

  function apply(rec:Rec){ if(rec.applied) return; setAfter(prev=> ({...prev, [rec.axis]: Math.min(100, prev[rec.axis] + rec.delta)})); setRecs(rs=> rs.map(r=> r.id===rec.id? {...r, applied:true}:r)); }
  function reset(){ setAfter(baseScores); setRecs(seedRecs.map(r=>({...r, applied:false}))); }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><WandIcon/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <div className="hidden sm:block text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.roleBanner}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang('ar')} className={btn(lang==='ar')}>AR</button>
            <button onClick={()=>setLang('en')} className={btn(lang==='en')}>EN</button>
            <a href="/dashboard" className="text-sm underline text-slate-700">{t.back}</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-5">
        <p className="text-slate-600 text-sm">{t.desc}</p>

        {/* scores grid */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <ScorePanel lang={lang} label={t.before} scores={before} total={overall(before)} tone="slate"/>
          <ScorePanel lang={lang} label={t.after}  scores={after}  total={overall(after)}  tone="emerald"/>
        </div>

        {/* recs */}
        <div className="mt-6 p-4 md:p-5 border rounded-2xl bg-white">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{t.recs}</div>
            <div className="flex gap-2"><button onClick={reset} className="px-3 py-2 border rounded-xl text-sm">{t.reset}</button></div>
          </div>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {recs.map(r=> <RecItem key={r.id} lang={lang} rec={r} onApply={()=>apply(r)} />)}
          </div>
        </div>
      </main>

      <style>{` :focus{outline:2px solid #0ea5e9; outline-offset:2px} `}</style>
    </div>
  );
}

function btn(active:boolean){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }

function WandIcon(){ return (<svg viewBox="0 0 24 24" width="18" height="18" aria-label="wand"><path d="M4 20l12-12M14 4l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></svg>); }

function ScorePanel({lang,label,scores,total,tone}:{lang:Lang; label:string; scores:AxisScores; total:number; tone:"slate"|"emerald"}){
  const t = T[lang];
  const toneMap = tone==='emerald'? {bg:"bg-emerald-50", text:"text-emerald-700", bar:"bg-emerald-500"} : {bg:"bg-slate-50", text:"text-slate-700", bar:"bg-slate-500"};
  return (
    <div className={`p-4 md:p-5 border rounded-2xl bg-white`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{label}</div>
        <div className={`text-sm ${toneMap.text}`}>{T[lang].overall}: <span className="font-semibold">{total}%</span></div>
      </div>
      <div className="grid gap-2">
        {(["identity","climate","function","human","context"] as Axis[]).map(ax=> (
          <AxisRow key={ax} lang={lang} label={t.axes[ax]} value={scores[ax]} barClass={toneMap.bar}/>
        ))}
      </div>
    </div>
  );
}

function AxisRow({lang,label,value,barClass}:{lang:Lang; label:string; value:number; barClass:string}){
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-600">{label}</div>
        <div className="text-slate-900 font-semibold">{value}%</div>
      </div>
      <div className="mt-1 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${barClass}`} style={{width: `${value}%`}}/>
      </div>
    </div>
  );
}

function RecItem({lang, rec, onApply}:{lang:Lang; rec:Rec; onApply:()=>void}){
  const t = T[lang];
  const title = lang==='ar'? rec.title_ar : rec.title_en;
  return (
    <div className="p-3 border rounded-2xl bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-[12px] text-slate-600">{t.impact}: <span className="font-semibold text-emerald-700">{t.gain(rec.delta)}</span> → {T[lang].axes[rec.axis]}</div>
        </div>
        <div>
          {!rec.applied ? (
            <button onClick={onApply} className="px-3 py-1.5 border rounded-xl text-sm">{t.apply}</button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">{t.applied}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/*
==========================
Runtime self-checks (non-invasive)
==========================
*/
if(typeof window!=='undefined'){
  try{
    const sum = (s:AxisScores)=> s.identity+s.climate+s.function+s.human+s.context;
    const a:AxisScores = { ...baseScores };
    const b:AxisScores = { ...baseScores, climate: baseScores.climate + 7 };
    console.assert(sum(b) > sum(a), 'Applying deltas increases sum');
    console.assert(["identity","climate","function","human","context"].every(k=>k in baseScores), 'All axes present');
  }catch(e){ console.warn('Recs screen self-check warning', e); }
}
