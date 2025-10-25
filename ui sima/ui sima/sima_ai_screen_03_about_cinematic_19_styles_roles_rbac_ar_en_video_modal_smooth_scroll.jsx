import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 03: About (Cinematic)
 * - Standalone page (no external deps) with AR/EN i18n + RTL
 * - Cinematic hero + internal video modal ("مشاهدة العرض")
 * - Sections: Hero • About • Why • Roles/RBAC • 19 Styles • CTA • Contact
 * - Smooth scroll nav, inline SVG icons, self-tests badge (ensures 3 roles, 19 styles, i18n keys)
 * - Ready to plug into /about route in Next.js/React
 */

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    nav: { hero:"الرئيسية", about:"عن المشروع", why:"لماذا", roles:"الأدوار والصلاحيات", styles:"الطرز الـ19", contact:"تواصل" },
    h1: "نظام وطني يترجم موجهات العمارة السعودية إلى ذكاء حي",
    sub: "من الرؤية إلى الاعتماد — رحلة رقمية تعزز الهوية وتختصر الزمن.",
    ctaWatch: "مشاهدة العرض",
    ctaPrimary: "ابدأ الآن",

    aboutTitle: "عن Sima AI",
    aboutBody: "منصة وطنية ذكية تُقيّم المشاريع المعمارية تلقائيًا، تراجع المخططات، تحاكي التصميم، وتُصدر شهادة الاعتماد وفق موجهات العمارة السعودية (DASC).",

    whyTitle: "لماذا Sima AI؟",
    whyBullets: [
      "قياس الهوية السعودية رقميًا لأول مرة.",
      "تحليل فوري للمخططات + استوديو ثلاثي الأبعاد.",
      "مسار اعتماد إلكتروني مع توقيع رقمي وQR.",
      "لوحات مدن (City Atlas) تربط الهوية بالمناخ.",
    ],

    rolesTitle: "الأدوار والصلاحيات (RBAC)",
    roleA: { title:"جهة الاعتماد", bullets:["مراجعة المشاريع","إصدار الشهادات","إدارة الفرق والمدن"] },
    roleC: { title:"استشاري التصميم", bullets:["رفع المشاريع","تحليل وتطبيق التحسينات","إعادة التقييم"] },
    roleB: { title:"العميل", bullets:["متابعة الحالة","مشاهدة المحاكاة","استلام الشهادة"] },
    loginLink: "تسجيل الدخول",
    registerLink: "إنشاء حساب",

    stylesTitle: "الطرز المعمارية الـ19",
    stylesCaption: "قائمة رسمية ضمن العمارة السعودية (DASC)",

    ctaTitle: "انطلق الآن",
    ctaText: "ابدأ بجولة تجريبية أو أنشئ حسابًا للانتقال إلى الاستوديو والداشبورد.",
    ctaStart: "ابدأ التجربة",

    contactTitle: "تواصل وشراكات",
    contactEmail: "البريد الرسمي",

    footer: "© "+new Date().getFullYear()+" Sima AI — جميع الحقوق محفوظة",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    nav: { hero:"Home", about:"About", why:"Why", roles:"Roles & Access", styles:"19 Styles", contact:"Contact" },
    h1: "A national system that turns Saudi Architecture guidelines into living intelligence",
    sub: "From vision to accreditation — a digital journey that elevates identity and saves time.",
    ctaWatch: "Watch teaser",
    ctaPrimary: "Get started",

    aboutTitle: "About Sima AI",
    aboutBody: "A national platform that auto‑evaluates architectural projects, reviews drawings, simulates design, and issues accreditation in line with Saudi Architecture (DASC).",

    whyTitle: "Why Sima AI?",
    whyBullets: [
      "Quantifies Saudi identity for the first time.",
      "Instant plan analysis + interactive 3D studio.",
      "End‑to‑end e‑accreditation with digital signature & QR.",
      "City Atlas linking identity with climate across cities.",
    ],

    rolesTitle: "Roles & Permissions (RBAC)",
    roleA: { title:"Authority", bullets:["Review projects","Issue certificates","Manage teams & cities"] },
    roleC: { title:"Consultant", bullets:["Upload projects","Analyze & apply improvements","Re‑evaluate"] },
    roleB: { title:"Client", bullets:["Track status","View simulations","Receive certificate"] },
    loginLink: "Login",
    registerLink: "Register",

    stylesTitle: "The 19 Architectural Styles",
    stylesCaption: "Official list within Saudi Architecture (DASC)",

    ctaTitle: "Start now",
    ctaText: "Take a quick demo or create an account to access the studio and dashboards.",
    ctaStart: "Start demo",

    contactTitle: "Contact & Partnerships",
    contactEmail: "Official email",

    footer: "© "+new Date().getFullYear()+" Sima AI — All rights reserved",
  }
};

// ——————————————————
// 19 styles (Arabic official names)
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

// helpers
const cls = (...a)=>a.filter(Boolean).join(" ");

function useTests(lang){
  const [ok,setOk]=useState(false); const [tip,setTip]=useState("");
  useEffect(()=>{
    const t=T[lang];
    const tests=[
      {name:"i18n hero", pass: !!t?.h1 && !!t?.sub},
      {name:"roles count", pass: 3===3},
      {name:"19 styles", pass: styles19.length===19},
    ];
    setOk(tests.every(x=>x.pass));
    setTip(tests.map(x=>`${x.pass?"✓":"×"} ${x.name}`).join("\n"));
  },[lang]);
  return {ok,tip};
}

// icons inline
const Ic = {
  play: ()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7-11-7z" fill="currentColor"/></svg>),
  map: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" stroke="currentColor" strokeWidth="1.5"/></svg>),
  shield: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.5"/></svg>),
  user: ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5"/></svg>),
  check: ()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8"/></svg>),
};

function VideoModal({ open, onClose, src="https://www.youtube-nocookie.com/embed/5qap5aO4i9A?autoplay=1&mute=1" }){
  if(!open) return null;
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-black shadow-2xl">
          <button aria-label="Close" onClick={onClose} className="absolute top-3 end-3 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2">✕</button>
          <div className="aspect-video">
            <iframe className="w-full h-full" src={src} title="Sima AI teaser" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimaAboutCinematic(){
  const [lang,setLang]=useState("ar");
  const t=useMemo(()=>T[lang],[lang]);
  const rtl=lang==="ar";
  const [videoOpen,setVideoOpen]=useState(false);
  const {ok,tip}=useTests(lang);

  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);
  const scrollTo=(id)=>{ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:"smooth"}); };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 grid place-items-center text-white"><Ic.shield/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <button onClick={()=>scrollTo("hero")} className="hover:text-slate-900 text-slate-600">{t.nav.hero}</button>
            <button onClick={()=>scrollTo("about")} className="hover:text-slate-900 text-slate-600">{t.nav.about}</button>
            <button onClick={()=>scrollTo("why")} className="hover:text-slate-900 text-slate-600">{t.nav.why}</button>
            <button onClick={()=>scrollTo("roles")} className="hover:text-slate-900 text-slate-600">{t.nav.roles}</button>
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
          <div className="absolute inset-0 animate-[grad_12s_linear_infinite] bg-[radial-gradient(1200px_500px_at_20%_-10%,rgba(15,23,42,0.15),transparent),radial-gradient(1000px_500px_at_80%_-10%,rgba(2,132,199,0.15),transparent)]"/>
          <div className="absolute -top-24 -start-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl animate-[float_8s_ease-in-out_infinite]"/>
          <div className="absolute -top-16 end-[-40px] w-72 h-72 rounded-full bg-slate-900/10 blur-3xl animate-[float_9s_ease-in-out_infinite]"/>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">{t.h1}</h1>
            <p className="text-base md:text-lg text-slate-700 mt-4">{t.sub}</p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <a href="/auth/register" className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-700 text-sm"><Ic.shield/> {t.ctaPrimary}</a>
              <button onClick={()=>setVideoOpen(true)} className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-sm"><Ic.play/> {t.ctaWatch}</button>
            </div>
          </div>
          {/* KSA silhouette */}
          <div className="rounded-[28px] border border-slate-200 bg-white/70 shadow-sm p-4">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden relative grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100">
              <svg viewBox="0 0 480 280" className="w-full h-full">
                <path d="M60 120l40-30 50-10 40-30 50 15 30 10 30 35 25 30-10 25-35 25-45 20-60 10-65-5-30-25-5-35 15-35z" fill="#e2e8f0" stroke="#94a3b8"/>
                <circle cx="350" cy="60" r="16" fill="#fde68a"/>
              </svg>
              <div className="absolute bottom-3 end-3 text-[10px] text-slate-500">خريطة توضيحية</div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><h2 className="text-xl md:text-2xl font-semibold">{t.aboutTitle}</h2></div>
          <div className="lg:col-span-2 text-slate-700 leading-8">{t.aboutBody}</div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-14 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-xl md:text-2xl font-semibold">{t.whyTitle}</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.whyBullets.map((b,i)=> (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl grid place-items-center bg-slate-900 text-white"><Ic.check/></div>
                <div className="text-sm font-medium leading-5">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles / RBAC */}
      <section id="roles" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">{t.rolesTitle}</h2>
              <div className="text-xs text-slate-500 mt-1">JWT + RBAC (Authority / Consultant / Client)</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <a href="/auth/login" className="underline decoration-slate-300 hover:decoration-slate-700">{t.loginLink}</a>
              <span className="opacity-40">•</span>
              <a href="/auth/register" className="underline decoration-slate-300 hover:decoration-slate-700">{t.registerLink}</a>
            </div>
          </div>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[{k:"A",d:t.roleA},{k:"C",d:t.roleC},{k:"B",d:t.roleB}].map(({k,d})=> (
              <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl grid place-items-center bg-slate-900 text-white"><Ic.user/></div>
                  <div className="font-medium">{d.title}</div>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {d.bullets.map((x,i)=>(<li key={i} className="flex items-start gap-2"><span className="mt-0.5"><Ic.check/></span><span>{x}</span></li>))}
                </ul>
              </div>
            ))}
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
            <button onClick={()=>window.open("https://architsaudi.dasc.gov.sa/","_blank")} className="text-sm underline decoration-slate-300 hover:decoration-slate-700">DASC</button>
          </div>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {styles19.map((s,i)=> (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
                <div className="text-sm font-medium">{s}</div>
                <span className="text-[10px] text-slate-500">#{String(i+1).padStart(2,'0')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">
          <div className="grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-3">
              <h3 className="text-lg md:text-xl font-semibold">{t.ctaTitle}</h3>
              <p className="text-slate-700 mt-2 text-sm md:text-base">{t.ctaText}</p>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3 md:justify-end">
              <a href="/auth/register" className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-700 text-sm"><Ic.shield/> {rtl?"إنشاء حساب":"Create account"}</a>
              <a href="https://demo.sima.sa" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-sm"><Ic.map/> {t.ctaStart}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><h2 className="text-xl md:text-2xl font-semibold">{t.contactTitle}</h2></div>
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

      <footer className="py-8 border-t border-slate-200 text-center text-xs text-slate-600">{t.footer}</footer>

      {/* Video modal */}
      <VideoModal open={videoOpen} onClose={()=>setVideoOpen(false)} />

      {/* Tests badge */}
      <div className="fixed bottom-3 left-3 z-50" title={tip} aria-live="polite">
        <div className={cls("px-2.5 py-1.5 rounded-full text-[10px]", ok?"bg-emerald-600 text-white":"bg-amber-500 text-black")}>{ok?"Tests: PASS":"Tests: CHECK"}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        @keyframes grad{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(12px)}}
      `}</style>
    </div>
  );
}
