import React, { useMemo, useState, useEffect, useContext, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Shield, Landmark, CheckCircle2, Target, Sparkles, Layers3, FileCheck2, BarChart3,
  BookOpenCheck, Globe2, Building2, Play, ChevronRight, BadgeCheck, Palette, Cpu,
  Sun, Wind, Droplets, User, Mail, Lock, Eye, EyeOff, Check, ArrowRight, LogOut, KeyRound,
} from "lucide-react";

/**
 * Sima AI — Apple‑inspired cinematic About + in‑page Film Modal + smooth scroll to 19 Characters
 * Includes a minimal in‑file router (About / Register / Login) and an RBAC scaffold (roles & permissions).
 * RTL‑first, clean JSX, no exotic CSS. All tags/blocks closed; self‑tests badge included.
 */

// ——————————————————
// Mini in‑file router
// ——————————————————
const PAGES = { ABOUT: "about", REGISTER: "register", LOGIN: "login" };

// ——————————————————
// RBAC scaffold
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: [
    "projects.view", "projects.create", "projects.approve",
    "ai.evaluate", "reports.view", "accredit.sign", "admin.users",
  ],
  [ROLES.CONSULTANT]: [
    "projects.view", "projects.create", "ai.evaluate", "reports.view",
  ],
  [ROLES.CLIENT]: [
    "projects.view", "reports.view",
  ],
};

const AuthCtx = React.createContext(null);
function AuthProvider({ children }){
  const [user, setUser] = useState(null); // {name, email, role}
  const signUp = ({ name, email, role }) => setUser({ name, email, role });
  const signIn = ({ email, role }) => setUser({ name: email.split("@")[0], email, role });
  const signOut = () => setUser(null);
  const can = (perm) => !!(user && PERMISSIONS[user.role]?.includes(perm));
  const value = { user, signUp, signIn, signOut, can };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
const useAuth = () => useContext(AuthCtx);

// ——————————————————
// UI Primitives
// ——————————————————
const Button = ({ children, className = "", variant = "solid", ...props }) => (
  <button
    className={
      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition " +
      (variant === "solid"
        ? "bg-slate-900 text-white hover:bg-slate-700 "
        : variant === "outline"
        ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
        : variant === "glass"
        ? "backdrop-blur bg-white/70 text-slate-900 border border-white/60 hover:bg-white/90 "
        : variant === "ghost"
        ? "bg-transparent text-slate-900 hover:bg-slate-100 "
        : "") +
      className
    }
    {...props}
  >
    {children}
  </button>
);

const Card = ({ className = "", children }) => (
  <div className={"rounded-3xl border border-slate-200 bg-white shadow-sm " + className}>{children}</div>
);

function Field({ label, hint, error, children }){
  return (
    <div className="space-y-1.5">
      {label ? <label className="block text-sm text-slate-700">{label}</label> : null}
      {children}
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
      {error ? <div className="text-[11px] text-red-600">{error}</div> : null}
    </div>
  );
}

function Input({ type = "text", icon: Icon, ...props }){
  const [show, setShow] = useState(false);
  const effectiveType = type === "password" && show ? "text" : type;
  return (
    <div className="relative">
      <input
        type={effectiveType}
        className="w-full rounded-2xl border border-slate-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        {...props}
      />
      {Icon ? <Icon className="absolute right-3 top-2.5 h-4 w-4 text-slate-400"/> : null}
      {type === "password" ? (
        <button type="button" onClick={()=>setShow(!show)} className="absolute right-9 top-2.5">
          {show ? <EyeOff className="h-4 w-4 text-slate-400"/> : <Eye className="h-4 w-4 text-slate-400"/>}
        </button>
      ) : null}
    </div>
  );
}

function Select({ options, ...props }){
  return (
    <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white">
      {options.map((o, i)=> <option key={i} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Pill({ children, icon }){
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
      <span className="opacity-70">{icon}</span>
      {children}
    </span>
  );
}

// ——————————————————
// Translations (AR/EN)
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    navAbout: "عن Sima",
    navRegister: "تسجيل",
    navLogin: "دخول",

    heroOver: "مرجع وطني ذكي",
    heroTitle: "عمارة سعودية… تُروى بحركة، وتُقاس بالذكاء",
    heroSub: "نأخذ موجهات الهوية من النص إلى الشاشة: تحليل، محاكاة، واعتماد رقمي.",
    ctaWatch: "مشاهدة العرض",
    ctaScroll: "استعراض الشخصيات",

    defKicker: "تعريف",
    definition:
      "مجموعة من الإرشادات والاشتراطات المعمارية والعمرانية، تُوجّه التصميم لينسجم مع الطراز المحلي الأصيل لكل نطاق جغرافي في المملكة.",

    ideaTitle: "مرجعية وطنية متكاملة",
    idea: [
      "خريطة شخصيات العمارة السعودية (19 طرازًا).",
      "تكامل مع هيئة العمارة والتصميم ومركز دعم الهيئات (DASC).",
      "ميثاق الملك سلمان كإطار قيمي وتصميمي.",
    ],

    goalsTitle: "لماذا Sima AI؟",
    goals: ["حوكمة الهوية", "اعتماد أسرع", "ذكاء عربي", "معرفة حيّة"],

    regionsTitle: "الشخصيات الـ19 — أنماط وهوية",
    roadmapTitle: "من الهوية إلى الاعتماد",
    ctaFeatures: "استكشف المميزات",

    regTitle: "إنشاء حساب جديد",
    regHint: "اختر فئتك بدقة. يمكن تغييرها لاحقًا عبر جهة الاعتماد.",
    role: "الفئة",
    roles: [
      { value: ROLES.AUTHORITY, label: "جهة اعتماد" },
      { value: ROLES.CONSULTANT, label: "استشاري" },
      { value: ROLES.CLIENT, label: "عميل" },
    ],
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    city: "المدينة",
    org: "الجهة",
    license: "رقم/نوع الترخيص",
    pass: "كلمة المرور",
    agree: "أوافق على الشروط والخصوصية",
    submit: "تسجيل",

    loginTitle: "تسجيل الدخول",
    loginSubmit: "دخول",
    forgot: "نسيت كلمة المرور؟",

    youAre: "مسجّل كـ",
    signOut: "خروج",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    navAbout: "About",
    navRegister: "Register",
    navLogin: "Login",

    heroOver: "A cinematic national reference",
    heroTitle: "Saudi Architecture — told in motion, measured by intelligence",
    heroSub: "We bring identity guidelines from text to screen: analysis, simulation, digital accreditation.",
    ctaWatch: "Watch film",
    ctaScroll: "Browse 19 Characters",

    defKicker: "Definition",
    definition:
      "A set of architectural and urban guidelines aligning design with authentic local styles across Saudi regions.",

    ideaTitle: "A coherent national foundation",
    idea: [
      "Saudi Architecture Characters Map (19 styles).",
      "Integration with ADC & DASC.",
      "King Salman Charter as a value-based framework.",
    ],

    goalsTitle: "Why Sima AI?",
    goals: ["Identity governance", "Faster accreditation", "Arabic-native AI", "Living knowledge"],

    regionsTitle: "19 Characters — styles & identity",
    roadmapTitle: "From identity to accreditation",
    ctaFeatures: "Explore features",

    regTitle: "Create new account",
    regHint: "Choose your role carefully. It can be changed later by the authority.",
    role: "Role",
    roles: [
      { value: ROLES.AUTHORITY, label: "Authority" },
      { value: ROLES.CONSULTANT, label: "Consultant" },
      { value: ROLES.CLIENT, label: "Client" },
    ],
    name: "Full name",
    email: "Email",
    city: "City",
    org: "Organization",
    license: "License id/type",
    pass: "Password",
    agree: "I agree to Terms & Privacy",
    submit: "Register",

    loginTitle: "Sign in",
    loginSubmit: "Sign in",
    forgot: "Forgot password?",

    youAre: "Signed in as",
    signOut: "Sign out",
  },
};

// ——————————————————
// Dataset (19 Characters) — placeholder structure; replace with official set if needed
// ——————————————————
const CHARACTERS = [
  { key: "najdi", ar: "نجدي مركزي", en: "Central Najdi", materials: "طين/حجر/جص", shading: "شرَفَات/أشرطة مثلثة", openings: "صغيرة/منضبطة", palette: "ترابي" },
  { key: "najdi_north", ar: "نجدي شمالي", en: "Northern Najdi", materials: "طين/حجر رملي", shading: "شرَفَات/أشرطة بسيطة", openings: "صغيرة", palette: "رملي" },
  { key: "hejazi_inner", ar: "مديني داخلي", en: "Inner Madinah", materials: "بازلت/خشب", shading: "مشربيات/روشان", openings: "أوسع/مؤطرة", palette: "رمادي/أبيض" },
  { key: "hejazi_coast", ar: "ساحل حجازي", en: "Hejazi Coast", materials: "حجر مرجاني/خشب", shading: "رواشين/بلكونات", openings: "رأسية", palette: "أبيض/أزرق" },
  { key: "tabuk_coast", ar: "ساحل تبوك", en: "Tabuk Coast", materials: "مرجان/حجر", shading: "بلكونات/مزاريب", openings: "رأسية", palette: "أبيض/خشبي" },
  { key: "madinah_rural", ar: "مديني ريفي", en: "Madinah Rural", materials: "بازلت/طين/نخل", shading: "أفاريز بسيطة", openings: "مربعة/مثلثة", palette: "غامق/ترابي" },
  { key: "taif", ar: "الطائف المرتفعات", en: "Taif Highland", materials: "حجر جبلي", shading: "ظل/تهوية", openings: "مدروسة", palette: "فاتح/زهري" },
  { key: "abha_high", ar: "أبها المرتفعات", en: "Abha Highlands", materials: "حجر/طين", shading: "قوي", openings: "مدروسة", palette: "ترابي بارد" },
  { key: "aseer_escarp", ar: "عسير الحافة", en: "Aseer Escarpment", materials: "حجر/خشب", shading: "أشرطة/شرَفَات", openings: "متفاوتة", palette: "أرضي" },
  { key: "tuhama_footh", ar: "سفوح تهامة", en: "Tuhama Foothills", materials: "حجر/طين", shading: "أفاريز", openings: "صغيرة", palette: "غامق" },
  { key: "tuhama_coast", ar: "ساحل تهامة", en: "Tuhama Coast", materials: "حجر/مرجان", shading: "شبكات/بروز", openings: "رأسية", palette: "بحري" },
  { key: "al_baha", ar: "الباحة", en: "Al-Baha", materials: "حجر/خشب", shading: "أمطار/سحب", openings: "منضبطة", palette: "بارد" },
  { key: "najran", ar: "نجران", en: "Najran", materials: "طين/حجر", shading: "كتلي", openings: "محسوبة", palette: "ترابي" },
  { key: "bisha_desert", ar: "صحراء بيشة", en: "Bisha Desert", materials: "طين/حجر", shading: "تظليل بسيط", openings: "صغيرة", palette: "صحراوي" },
  { key: "qassim", ar: "قصيم", en: "Qassim", materials: "طين/جص", shading: "أشرطة", openings: "محدودة", palette: "ترابي" },
  { key: "eastern_najdi", ar: "نجدي شرقي", en: "Eastern Najdi", materials: "طين/حجر", shading: "كاسرات", openings: "مقننة", palette: "صحراوي" },
  { key: "ahsa_oasis", ar: "واحة الأحساء", en: "Al Ahsa Oasis", materials: "طين نخلي/حجر", shading: "طبقات تظليل", openings: "مقاسة", palette: "ناري/نخلي" },
  { key: "qatif_oasis", ar: "واحة القطيف", en: "Al Qatif Oasis", materials: "حجر/خشب", shading: "مشربية/بحري", openings: "مفلترة", palette: "بحري" },
  { key: "east_coast", ar: "ساحل شرقي", en: "East Coast", materials: "خرسانة/حجر", shading: "كاسرات/بروز", openings: "مقننة", palette: "بحري فاتح" },
];

// ——————————————————
// Runtime tests badge (includes RBAC checks)
// ——————————————————
function DevTestsBadge({ t }){
  const tests = [];
  tests.push({ name: "i18n present", pass: !!t.brand && !!t.heroTitle && !!t.definition });
  tests.push({ name: "19 chars", pass: CHARACTERS.length === 19 });
  // RBAC sanity: authority must be able to accredit.sign, client must NOT
  const r1 = PERMISSIONS[ROLES.AUTHORITY].includes("accredit.sign");
  const r2 = !PERMISSIONS[ROLES.CLIENT].includes("accredit.sign");
  tests.push({ name: "rbac rules", pass: r1 && r2 });
  const tooltip = tests.map(x => (x.pass? "✓ " : "× ") + x.name).join("\n");
  const allPass = tests.every(x=>x.pass);
  return (
    <div aria-live="polite" className="fixed bottom-3 left-3 z-50">
      <div className={("px-2.5 py-1.5 rounded-full text-[10px] ") + (allPass? "bg-emerald-600 text-white" : "bg-amber-500 text-black")} title={tooltip}>
        {allPass? "Tests: PASS" : "Tests: CHECK"}
      </div>
    </div>
  );
}

// ——————————————————
// Video Modal
// ——————————————————
function VideoModal({ open, onClose }){
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        <button aria-label="Close" onClick={onClose} className="absolute z-10 top-3 right-3 rounded-full bg-white/90 hover:bg-white p-1">
          <Xmark />
        </button>
        {/* Replace VIDEO_ID with your promotional film id */}
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&rel=0"
          title="Sima AI Film"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
function Xmark(){ return (<svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>); }

// ——————————————————
// About — Apple‑inspired Cinematic (with film modal + smooth scroll)
// ——————————————————
function AboutCinematic({ t, rtl, onOpenFilm, onScrollToCharacters, charactersRef }){
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -20]);
  const y2 = useTransform(scrollY, [0, 300], [0, 20]);

  return (
    <div className="relative">
      {/* Top Hero */}
      <section className="mx-6 md:mx-10">
        <Card className="overflow-hidden">
          <div className="relative p-10 md:p-16">
            {/* animated orbs */}
            <motion.div style={{ y: y1 }} className="pointer-events-none absolute -top-40 -right-28 w-[28rem] h-[28rem] bg-indigo-300/20 blur-3xl rounded-full"/>
            <motion.div style={{ y: y2 }} className="pointer-events-none absolute -bottom-32 -left-24 w-[24rem] h-[24rem] bg-blue-300/20 blur-3xl rounded-full"/>

            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="text-[11px] uppercase tracking-wide text-slate-600 flex items-center gap-2"><BadgeCheck className="w-4 h-4"/>{t.heroOver}</div>
                <h1 className="mt-2 text-3xl md:text-[44px] font-semibold leading-[1.15]">
                  <span className="bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-transparent">{t.heroTitle}</span>
                </h1>
                <p className="mt-3 text-slate-700 md:text-lg">{t.heroSub}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={onOpenFilm}><Play className="w-4 h-4"/>{t.ctaWatch}</Button>
                  <Button variant="glass" onClick={onScrollToCharacters}><ChevronRight className="w-4 h-4"/>{t.ctaScroll}</Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <Pill icon={<Landmark className="w-3.5 h-3.5"/>}>ADC</Pill>
                  <Pill icon={<Building2 className="w-3.5 h-3.5"/>}>DASC</Pill>
                  <Pill icon={<Palette className="w-3.5 h-3.5"/>}>Identity</Pill>
                  <Pill icon={<Cpu className="w-3.5 h-3.5"/>}>AI</Pill>
                </div>
              </motion.div>

              {/* cinematic stage */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative h-[340px] rounded-2xl border border-white/50 bg-gradient-to-br from-slate-100 to-white grid place-items-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_60%)]"/>
                <div className="absolute bottom-4 right-4 text-[10px] text-slate-600 flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5"/>
                  <Wind className="w-3.5 h-3.5"/>
                  <Droplets className="w-3.5 h-3.5"/>
                </div>
                <div className="relative z-10 text-slate-600 text-sm">Cinematic placeholder — 3D city sweep</div>
              </motion.div>
            </div>
          </div>
        </Card>
      </section>

      {/* Definition + Foundation */}
      <div className="mx-6 md:mx-10 my-10">
        <Card className="p-8 md:p-10">
          <div className="grid md:grid-cols-[1.05fr_.95fr] gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 mb-2"><BadgeCheck className="w-4 h-4"/> {t.defKicker}</div>
              <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">{t.ideaTitle}</h3>
              <p className="text-slate-700 leading-relaxed text-sm">{t.definition}</p>
              <ul className="mt-4 space-y-2 text-slate-700 text-sm">
                {t.idea.map((x,i)=> (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5"/> <span>{x}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-slate-900 font-medium mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> {t.goalsTitle}</div>
              <div className="grid md:grid-cols-2 gap-3">
                {t.goals.map((g, i)=> (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 flex items-start gap-2"><BookOpenCheck className="w-4 h-4 text-indigo-600 mt-0.5"/> <span>{g}</span></div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 19 Characters grid */}
      <div className="mx-6 md:mx-10 my-10" ref={charactersRef} id="characters">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-semibold text-slate-900">{t.regionsTitle}</h3>
            <div className="text-[11px] text-slate-500 flex items-center gap-2"><Layers3 className="w-4 h-4"/> 19</div>
          </div>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
            {CHARACTERS.map((c, i)=> (
              <motion.div key={c.key} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: (i%6)*0.04 }} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900">{rtl ? c.ar : c.en}</div>
                  <Palette className="w-4 h-4 text-slate-400"/>
                </div>
                <div className="mt-1 text-[12px] text-slate-600">{c.notes || ""}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="rounded-xl border p-2"><div className="text-slate-900 text-xs">{rtl? 'المواد' : 'Materials'}</div><div>{c.materials}</div></div>
                  <div className="rounded-xl border p-2"><div className="text-slate-900 text-xs">{rtl? 'التظليل' : 'Shading'}</div><div>{c.shading}</div></div>
                  <div className="rounded-xl border p-2"><div className="text-slate-900 text-xs">{rtl? 'الفتحات' : 'Openings'}</div><div>{c.openings}</div></div>
                  <div className="rounded-xl border p-2"><div className="text-slate-900 text-xs">{rtl? 'الألوان' : 'Palette'}</div><div>{c.palette}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Roadmap / strip */}
      <div className="mx-6 md:mx-10 my-10">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 mb-2"><Globe2 className="w-4 h-4"/> {t.roadmapTitle}</div>
          <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-3">
            {[{ k: 'Q1', v: rtl? 'نمذجة قواعد الهوية والمطابقة':'Identity rules modeling & matching' },
              { k: 'Q2', v: rtl? 'استوديو 3D + محاكاة الشمس':'3D Studio + solar sim' },
              { k: 'Q3', v: rtl? 'أطلس المدن + IoT':'City Atlas + IoT' },
              { k: 'Q4', v: rtl? 'اعتماد رقمي + WebXR':'Digital accreditation + WebXR' }]
              .map((it,i)=> (
                <div key={i} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">{it.k}</div>
                    <BarChart3 className="w-4 h-4 text-slate-400"/>
                  </div>
                  <div className="mt-2 text-sm text-slate-900">{it.v}</div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* RBAC demo strip */}
      <div className="mx-6 md:mx-10 my-10">
        <Card className="p-6">
          <div className="text-sm font-medium text-slate-900 mb-2">RBAC</div>
          <div className="text-[12px] text-slate-600">استخدمنا أدوار (جهة اعتماد/استشاري/عميل) وقدرات قابلة للتوسّع: projects.*, ai.evaluate, accredit.sign, reports.view, admin.users.</div>
        </Card>
      </div>
    </div>
  );
}

// ——————————————————
// Register
// ——————————————————
function RegisterPage({ t, rtl }){
  const { signUp } = useAuth();
  const [role, setRole] = useState(t.roles[1].value);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [org, setOrg] = useState("");
  const [license, setLicense] = useState("");
  const [pass, setPass] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function onSubmit(e){
    e.preventDefault();
    setErr(""); setOk(false);
    if (!name || !email || !pass) { setErr(rtl? "الاسم/البريد/كلمة المرور مطلوبة" : "Name/Email/Password required"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(rtl? "صيغة البريد غير صحيحة" : "Invalid email"); return; }
    if (!agree) { setErr(rtl? "يجب الموافقة على الشروط" : "You must agree to terms"); return; }
    signUp({ name, email, role });
    setOk(true);
  }

  return (
    <div className="mx-6 md:mx-10">
      <Card className="p-8 md:p-10">
        <h2 className="text-2xl font-semibold mb-1">{t.regTitle}</h2>
        <p className="text-[12px] text-slate-600 mb-6">{t.regHint}</p>
        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
          <Field label={t.role}><Select value={role} onChange={(e)=>setRole(e.target.value)} options={t.roles} /></Field>
          <Field label={t.name}><Input value={name} onChange={(e)=>setName(e.target.value)} icon={User} placeholder={rtl? "مثال: محمد القحطاني" : "e.g. John Doe"}/></Field>
          <Field label={t.email}><Input value={email} onChange={(e)=>setEmail(e.target.value)} icon={Mail} placeholder="name@example.com"/></Field>
          <Field label={t.city}><Input value={city} onChange={(e)=>setCity(e.target.value)} placeholder={rtl? "الرياض" : "Riyadh"}/></Field>
          <Field label={t.org}><Input value={org} onChange={(e)=>setOrg(e.target.value)} placeholder={rtl? "جهتك/مكتبك" : "Your organization"}/></Field>
          <Field label={t.license}><Input value={license} onChange={(e)=>setLicense(e.target.value)} placeholder={rtl? "رقم أو نوع الترخيص" : "License id/type"}/></Field>
          <Field label={t.pass}><Input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} icon={Lock} placeholder={rtl? "••••••••" : "••••••••"}/></Field>
          <div className="flex items-start gap-2 md:col-span-2">
            <input id="agree" type="checkbox" className="mt-1" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
            <label htmlFor="agree" className="text-[12px] text-slate-700 cursor-pointer">{t.agree}</label>
          </div>
          {err ? <div className="md:col-span-2 text-[12px] text-red-600">{err}</div> : null}
          {ok ? <div className="md:col-span-2 text-[12px] text-emerald-700 flex items-center gap-1"><Check className="w-4 h-4"/> {(rtl? "تم إنشاء حساب تجريبي." : "Demo account created.")}</div> : null}
          <div className="md:col-span-2 flex justify-end"><Button type="submit"><ArrowRight className="w-4 h-4"/> {t.submit}</Button></div>
        </form>
      </Card>
    </div>
  );
}

// ——————————————————
// Login
// ——————————————————
function LoginPage({ t, rtl }){
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState(ROLES.CONSULTANT); // demo role choose
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function onSubmit(e){
    e.preventDefault();
    setErr(""); setOk(false);
    if (!email || !pass) { setErr(rtl? "أدخل البريد وكلمة المرور" : "Enter email & password"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(rtl? "صيغة البريد غير صحيحة" : "Invalid email"); return; }
    signIn({ email, role });
    setOk(true);
  }

  return (
    <div className="mx-6 md:mx-10">
      <Card className="p-8 md:p-10">
        <h2 className="text-2xl font-semibold mb-1">{t.loginTitle}</h2>
        <p className="text-[12px] text-slate-600 mb-6">{rtl? 'دعم تسجيل الدخول الثنائي قريبًا (Nafath/Keycloak).' : 'Two‑factor / Gov SSO to come (Nafath/Keycloak).'} <KeyRound className="inline w-4 h-4 align-[-2px]"/></p>
        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
          <Field label={t.email}><Input value={email} onChange={(e)=>setEmail(e.target.value)} icon={Mail} placeholder="name@example.com"/></Field>
          <Field label={t.pass}><Input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} icon={Lock} placeholder={rtl? "••••••••" : "••••••••"}/></Field>
          <Field label={t.role}><Select value={role} onChange={(e)=>setRole(e.target.value)} options={t.roles} /></Field>
          <div className="md:col-span-2 flex items-center justify-between text-[12px]">
            <a className="text-slate-600 hover:text-slate-900" href="#reset">{t.forgot}</a>
            <Button type="submit"><ArrowRight className="w-4 h-4"/> {t.loginSubmit}</Button>
          </div>
          {err ? <div className="md:col-span-2 text-[12px] text-red-600">{err}</div> : null}
          {ok ? <div className="md:col-span-2 text-[12px] text-emerald-700 flex items-center gap-1"><Check className="w-4 h-4"/> {(rtl? "تم تسجيل الدخول (تجريبي)." : "Signed in (demo).")}</div> : null}
        </form>
      </Card>
    </div>
  );
}

// ——————————————————
// Ability Gate (example usage)
// ——————————————————
function Ability({ can, children, fallback = null }){
  const auth = useAuth();
  return auth?.can(can) ? children : fallback;
}

// ——————————————————
// Root — Nav + Router + Film Modal + Smooth scroll
// ——————————————————
export default function SimaMarketingAuth_Apple_RBAC() {
  const [lang, setLang] = useState("ar");
  const [page, setPage] = useState(PAGES.ABOUT);
  const [filmOpen, setFilmOpen] = useState(false);
  const t = useMemo(()=> T[lang], [lang]);
  const rtl = lang === "ar";
  const { user, signOut } = useAuth() || {};
  const charactersRef = useRef(null);

  // Hash navigation
  useEffect(()=>{
    const hash = (typeof window !== 'undefined' && window.location.hash || '').replace('#','');
    if (hash === 'register') setPage(PAGES.REGISTER);
    if (hash === 'login') setPage(PAGES.LOGIN);
  },[]);

  const onScrollToCharacters = () => {
    if (charactersRef.current) {
      charactersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
      {/* Topbar */}
      <header className="px-6 md:px-10 py-5 sticky top-0 z-40 bg-[#f6f9ff]/80 backdrop-blur border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center shadow-sm"><Shield className="w-5 h-5 text-white"/></div>
            <div className="font-semibold text-slate-900">{t.brand}</div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant={page===PAGES.ABOUT? 'solid':'ghost'} onClick={()=>setPage(PAGES.ABOUT)}>{t.navAbout}</Button>
            <Button variant={page===PAGES.REGISTER? 'solid':'ghost'} onClick={()=>setPage(PAGES.REGISTER)}>{t.navRegister}</Button>
            <Button variant={page===PAGES.LOGIN? 'solid':'ghost'} onClick={()=>setPage(PAGES.LOGIN)}>{t.navLogin}</Button>
            <div className="w-px h-6 bg-slate-300 mx-2"/>
            <button onClick={()=>setLang('ar')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='ar'? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900')}>عربي</button>
            <button onClick={()=>setLang('en')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='en'? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900')}>EN</button>
            {user ? (
              <div className="ms-2 ps-3 border-s border-slate-200 text-[12px] flex items-center gap-2">
                <span className="text-slate-600">{t.youAre}:</span>
                <span className="font-medium text-slate-900">{user.email} — {user.role}</span>
                <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4"/> {t.signOut}</Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Route body */}
      <main className="pb-16">
        {page === PAGES.ABOUT ? (
          <AboutCinematic
            t={t}
            rtl={rtl}
            onOpenFilm={()=>setFilmOpen(true)}
            onScrollToCharacters={onScrollToCharacters}
            charactersRef={charactersRef}
          />
        ) : null}
        {page === PAGES.REGISTER ? <RegisterPage t={t} rtl={rtl}/> : null}
        {page === PAGES.LOGIN ? <LoginPage t={t} rtl={rtl}/> : null}

        {/* Example: gated CTA strip showing RBAC in action */}
        {page === PAGES.ABOUT ? (
          <div className="mx-6 md:mx-10">
            <Card className="p-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-700">مثال على الصلاحيات: زر "اعتماد توقيع" يظهر فقط لمن يملك القدرة <code>accredit.sign</code>.</div>
              <Ability can="accredit.sign" fallback={<span className="text-[12px] text-slate-500">(لا تملك صلاحية الاعتماد)</span>}>
                <Button><FileCheck2 className="w-4 h-4"/> اعتماد توقيع</Button>
              </Ability>
            </Card>
          </div>
        ) : null}
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      {/* Film Modal */}
      <VideoModal open={filmOpen} onClose={()=>setFilmOpen(false)} />

      {/* Self-tests badge */}
      <DevTestsBadge t={t} />
    </div>
  );
}

// ——————————————————
// Mount with provider for demo canvas environments
// ——————————————————
export function App(){
  return (
    <AuthProvider>
      <SimaMarketingAuth_Apple_RBAC />
    </AuthProvider>
  );
}
