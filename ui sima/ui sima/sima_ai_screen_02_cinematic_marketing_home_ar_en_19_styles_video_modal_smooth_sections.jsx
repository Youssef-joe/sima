import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 02: Cinematic Marketing Home
 * - Full, ready-to-drop homepage (no external icon deps)
 * - AR/EN i18n + RTL
 * - Cinematic hero with animated gradient + floating orbs
 * - "مشاهدة العرض" video modal (YouTube privacy embed by default)
 * - Smooth scroll sections: Hero, What/Why, Features, Vision, 19 Styles, CTA, Contact
 * - Features grid (8) with inline SVG icons
 * - 19 Saudi architectural styles (official list) as interactive chips/cards
 * - Self tests badge (ensures 19 items, i18n keys)
 * - No build-time network fetches
 */

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    nav: { hero:"الرئيسية", what:"ما هو Sima AI؟", features:"المميزات", vision:"الرؤية", styles:"الطرز الـ19", contact:"تواصل" },
    title: "Sima AI — الذكاء المعماري السعودي",
    tagline1: "أول نظام ذكي لتقييم وتصميم واعتماد العمارة السعودية.",
    tagline2: "هوية رقمية… توازن بين الأصالة والابتكار.",
    ctaTry: "ابدأ التجربة",
    ctaWatch: "مشاهدة العرض",
    whatTitle: "ما هو Sima AI؟",
    whatBody: "منصة وطنية ذكية تُقيّم المشاريع المعمارية تلقائيًا، تراجع المخططات، تحاكي التصميم، وتصدر شهادة الاعتماد وفق موجهات العمارة السعودية.",
    featuresTitle: "المميزات الرئيسة",
    features: {
      a:"مراجعة ذكية للمخططات",
      b:"مطابقة الهوية السعودية",
      c:"ذكاء اصطناعي متعلّم",
      d:"استوديو ثلاثي الأبعاد تفاعلي",
      e:"توصيات تصميم حيّة",
      f:"شهادة PASS / FAIL",
      g:"مساعد صوتي معماري",
      h:"حساسات IoT وتحليل بيئي"
    },
    visionTitle: "الرؤية",
    visionBody: "تحويل العمارة السعودية من ممارسة فنية إلى علم رقمي ذكي يعزز الهوية ويرفع جودة البيئة العمرانية في كل مدينة.",
    stylesTitle: "الطرز المعمارية الـ19",
    stylesCaption: "قائمة رسمية منشورة ضمن موجهات العمارة السعودية",
    demoNote: "جرّب المنصة على demo.sima.sa",
    contactTitle: "تواصل وشراكات",
    contactEmail: "البريد الرسمي",
    footer: "© "+new Date().getFullYear()+" Sima AI — جميع الحقوق محفوظة",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    nav: { hero:"Home", what:"What is Sima AI?", features:"Features", vision:"Vision", styles:"19 Styles", contact:"Contact" },
    title: "Sima AI — Saudi Architectural Intelligence",
    tagline1: "The first intelligent system to evaluate, design and accredit Saudi architecture.",
    tagline2: "A digital identity balancing authenticity and innovation.",
    ctaTry: "Start demo",
    ctaWatch: "Watch teaser",
    whatTitle: "What is Sima AI?",
    whatBody: "A national platform that auto‑evaluates architectural projects, reviews drawings, simulates design, and issues accreditation in line with Saudi Architecture guidelines.",
    featuresTitle: "Key features",
    features: {
      a:"Smart plan review",
      b:"Saudi identity compliance",
      c:"Self‑learning AI",
      d:"Interactive 3D studio",
      e:"Live design recommendations",
      f:"PASS / FAIL certificate",
      g:"Voice architect assistant",
      h:"IoT sensors & environmental analytics"
    },
    visionTitle: "Vision",
    visionBody: "Elevate Saudi architecture from craft to a measurable, living digital science that enhances identity and urban quality across cities.",
    stylesTitle: "The 19 Architectural Styles",
    stylesCaption: "Official list per Saudi Architecture guidelines",
    demoNote: "Try the platform at demo.sima.sa",
    contactTitle: "Contact & Partnerships",
    contactEmail: "Official email",
    footer: "© "+new Date().getFullYear()+" Sima AI — All rights reserved",
  }
};

// ——————————————————
// 19 official styles list (from DASC)
// ——————————————————
const styles19 = [
  "العِمَارَة النجدية",
  "عِمَارَة المدينة المنورة",
  "عِمَارَة ريف المدينة المنورة",
  "العِمَارَة الحجازية الساحلية",
  "عِمَارَة جبال السروات",
  "عِمَارَة الطائف",
  "عِمَارَة الساحل الشرقي",
  "العِمَارَة النجدية الشرقية",
  "عِمَارَة واحات الأحساء",
  "عِمَارَة القطيف",
  "العِمَارَة النجدية الشمالية",
  "عِمَارَة ساحل تبوك",
  "عِمَارَة ساحل تهامة",
  "عِمَارَة سفوح تهامة",
  "عِمَارَة أصدار عسير",
  "عِمَارَة مرتفعات أبها",
  "عِمَارَة بيشة الصحراوية",
  "عِمَارَة جزر فرسان",
  "عِمَارَة نجران",
];

// ——————————————————
// helpers
// ——————————————————
const cls = (...a)=>a.filter(Boolean).join(" ");
function useDevTests(lang){
  const [ok,setOk]=useState(false); const [tip,setTip]=useState("");
  useEffect(()=>{
    const t=T[lang];
    const tests=[
      {name:"i18n title", pass: !!t?.title},
      {name:"nav keys", pass: !!t?.nav?.styles && !!t?.nav?.hero},
      {name:"19 styles", pass: styles19.length===19},
    ];
    setOk(tests.every(x=>x.pass));
    setTip(tests.map(x=>`${x.pass?"✓":"×"} ${x.name}`).join("\n"));
  },[lang]);
  return {ok,tip};
}

// ——————————————————
// inline icons (no CDN)
// ——————————————————
const Ic = {
  gear: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.5 4a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z" stroke="currentColor" strokeWidth="1.5"/></svg>),
  compass: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 5.5l-2.1 6.1-6.1 2.1 2.1-6.1 6.1-2.1z" stroke="currentColor" strokeWidth="1.5"/></svg>),
  brain: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M8 7a3 3 0 016 0M5 10a3 3 0 100 6h3m8-6a3 3 0 110 6h-3" stroke="currentColor" strokeWidth="1.5"/></svg>),
  cube: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z M4 6.5l8 4.5 8-4.5" stroke="currentColor" strokeWidth="1.5"/></svg>),
  feather: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M20 4s-5 0-9 4-5 9-5 9 5 0 9-4 5-9 5-9zM4 20l5-5" stroke="currentColor" strokeWidth="1.5"/></svg>),
  cert: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 2h12v16H6z M8 6h8M8 10h8M8 14h6" stroke="currentColor" strokeWidth="1.5"/><path d="M12 18l2 4 2-4" stroke="currentColor" strokeWidth="1.5"/></svg>),
  mic: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5 10v2a7 7 0 0014 0v-2M12 19v3" stroke="currentColor" strokeWidth="1.5"/></svg>),
  antenna: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7a7 7 0 0110 0M4.5 4.5a10.5 10.5 0 0115 0" stroke="currentColor" strokeWidth="1.5"/></svg>),
  shield: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.5"/></svg>),
  play: ()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M8 5v14l11-7-11-7z" fill="currentColor"/></svg>),
};

// ——————————————————
// Video Modal
// ——————————————————
function VideoModal({ open, onClose, src="https://www.youtube-nocookie.com/embed/5qap5aO4i9A?autoplay=1&mute=1" }){
  if(!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-black shadow-2xl">
          <button aria-label="Close" onClick={onClose} className="absolute top-3 end-3 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2"><span className="sr-only">close</span>✕</button>
          <div className="aspect-video">
            <iframe className="w-full h-full" src={src} title="Sima AI teaser" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
        </div>
      </div>
    </div>
  );
}

// ——————————————————
// Main Component
// ——————————————————
export default function SimaHomeCinematic(){
  const [lang,setLang]=useState("ar");
  const t = useMemo(()=>T[lang], [lang]);
  const rtl = lang==="ar";
  const {ok,tip} = useDevTests(lang);
  const [videoOpen,setVideoOpen]=useState(false);

  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  function scrollTo(id){ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:"smooth"}); }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white"><Ic.shield/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <button onClick={()=>scrollTo("hero")} className="hover:text-slate-900 text-slate-600">{t.nav.hero}</button>
            <button onClick={()=>scrollTo("what")} className="hover:text-slate-900 text-slate-600">{t.nav.what}</button>
            <button onClick={()=>scrollTo("features")} className="hover:text-slate-900 text-slate-600">{t.nav.features}</button>
            <button onClick={()=>scrollTo("vision")} className="hover:text-slate-900 text-slate-600">{t.nav.vision}</button>
            <button onClick={()=>scrollTo("styles")} className="hover:text-slate-900 text-slate-600">{t.nav.styles}</button>
            <button onClick={()=>scrollTo("contact")} className="hover:text-slate-900 text-slate-600">{t.nav.contact}</button>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='ar'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>عربي</button>
            <button onClick={()=>setLang("en")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='en'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>EN</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 animate-[grad_12s_linear_infinite] bg-[radial-gradient(1200px_500px_at_20%_-10%,rgba(59,130,246,0.25),transparent),radial-gradient(1000px_500px_at_80%_-10%,rgba(99,102,241,0.25),transparent)]"/>
          <div className="absolute -top-24 -start-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-[float_8s_ease-in-out_infinite]"/>
          <div className="absolute -top-16 end-[-40px] w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl animate-[float_9s_ease-in-out_infinite]"/>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">{t.title}</h1>
            <p className="text-base md:text-lg text-slate-700 mt-4">{t.tagline1}</p>
            <p className="text-sm md:text-base text-slate-600 mt-2">{t.tagline2}</p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <a href="https://demo.sima.sa" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-700 text-sm">
                <Ic.shield/> {t.ctaTry}
              </a>
              <button onClick={()=>setVideoOpen(true)} className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-sm">
                <Ic.play/> {t.ctaWatch}
              </button>
            </div>
            <div className="mt-6 text-xs text-slate-500">{t.demoNote}</div>
          </div>
          {/* decorative panel simulating 3D city */}
          <div className="rounded-[28px] border border-slate-200 bg-white/70 shadow-sm p-4">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden relative bg-gradient-to-br from-slate-50 to-slate-100">
              <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c7d2fe"/><stop offset="100%" stopColor="#e2e8f0"/>
                  </linearGradient>
                </defs>
                {/* ground */}
                <rect x="0" y="280" width="600" height="80" fill="#e5e7eb"/>
                {/* sun */}
                <circle cx="520" cy="60" r="20" fill="#fde68a"/>
                {/* blocks */}
                {Array.from({length:12}).map((_,i)=>{
                  const x=30+i*45; const h=50+((i*37)%120);
                  return <rect key={i} x={x} y={260-h} width="30" height={h} fill="url(#g)" stroke="#cbd5e1"/>;
                })}
              </svg>
              <div className="absolute bottom-3 end-3 text-[10px] text-slate-500">مشهد توضيحي</div>
            </div>
          </div>
        </div>
      </section>

      {/* What */}
      <section id="what" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <h2 className="text-xl md:text-2xl font-semibold">{t.whatTitle}</h2>
          </div>
          <div className="lg:col-span-2 text-slate-700 leading-8">
            {t.whatBody}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-xl md:text-2xl font-semibold">{t.featuresTitle}</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {k:"a", icon:Ic.gear}, {k:"b", icon:Ic.compass}, {k:"c", icon:Ic.brain}, {k:"d", icon:Ic.cube},
              {k:"e", icon:Ic.feather}, {k:"f", icon:Ic.cert}, {k:"g", icon:Ic.mic}, {k:"h", icon:Ic.antenna},
            ].map(({k,icon:Icon})=> (
              <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl grid place-items-center bg-slate-900 text-white"><Icon/></div>
                <div className="text-sm font-medium leading-5">{t.features[k]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section id="vision" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <h2 className="text-xl md:text-2xl font-semibold">{t.visionTitle}</h2>
          </div>
          <div className="lg:col-span-2 text-slate-700 leading-8">
            {t.visionBody}
          </div>
        </div>
      </section>

      {/* 19 Styles */}
      <section id="styles" className="py-14 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">{t.stylesTitle}</h2>
              <div className="text-xs text-slate-500 mt-1">{t.stylesCaption}</div>
            </div>
            <button onClick={()=>scrollTo("contact")} className="text-sm underline decoration-slate-300 hover:decoration-slate-700">{rtl?"تواصل معنا":"Contact us"}</button>
          </div>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {styles19.map((s,idx)=> (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{s}</div>
                <span className="text-[10px] text-slate-500">#{String(idx+1).padStart(2,'0')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <h2 className="text-xl md:text-2xl font-semibold">{t.contactTitle}</h2>
          </div>
          <div className="lg:col-span-2">
            <form className="grid sm:grid-cols-2 gap-3">
              <input className="rounded-2xl border border-slate-300 px-3 py-2 text-sm" placeholder={rtl?"الاسم":"Full name"} />
              <input className="rounded-2xl border border-slate-300 px-3 py-2 text-sm" placeholder={rtl?"البريد الإلكتروني":"Email"} />
              <input className="rounded-2xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2" placeholder={rtl?"الموضوع":"Subject"} />
              <textarea rows={5} className="rounded-2xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2" placeholder={rtl?"اكتب رسالتك هنا":"Write your message here"} />
              <div className="sm:col-span-2 flex items-center justify-between gap-3 mt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600"><input type="checkbox"/> {rtl?"أوافق على سياسة الخصوصية":"I agree to Privacy Policy"}</label>
                <button type="button" className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-700 text-sm"><Ic.shield/> {rtl?"إرسال":"Send"}</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 text-center text-xs text-slate-600">{t.footer}</footer>

      {/* Video Modal */}
      <VideoModal open={videoOpen} onClose={()=>setVideoOpen(false)} />

      {/* Dev tests badge */}
      <div className="fixed bottom-3 left-3 z-50" title={tip} aria-live="polite">
        <div className={cls("px-2.5 py-1.5 rounded-full text-[10px]", ok?"bg-emerald-600 text-white":"bg-amber-500 text-black")}>{ok?"Tests: PASS":"Tests: CHECK"}</div>
      </div>

      {/* animations + smooth scroll */}
      <style>{`
        html{scroll-behavior:smooth}
        @keyframes grad{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(12px)}}
      `}</style>
    </div>
  );
}
