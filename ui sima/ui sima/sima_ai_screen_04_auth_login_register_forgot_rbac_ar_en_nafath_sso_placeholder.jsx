import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 04: Auth (Login / Register / Forgot)
 * - Standalone, no external deps (icons are inline SVG)
 * - i18n (AR/EN) + RTL
 * - Roles: Authority / Consultant / Client (RBAC-ready)
 * - Forms: Login • Register • Forgot Password
 * - Password strength meter + basic validations
 * - PDPL consent checkbox; Nafath (SSO) placeholder button
 * - Self-tests badge (ensures 3 roles, i18n keys, strength fn)
 * - Ready to mount as /auth route in Next.js/React
 */

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    tabs: { login: "تسجيل الدخول", register: "إنشاء حساب", forgot: "استرجاع كلمة المرور" },
    role: "الدور",
    roles: { authority: "جهة الاعتماد", consultant: "استشاري التصميم", client: "العميل" },
    name: "الاسم كاملًا",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirm: "تأكيد كلمة المرور",
    city: "المدينة",
    org: "الجهة / المكتب",
    license: "رقم الترخيص (اختياري)",
    agree: "أوافق على سياسة الخصوصية (PDPL)",
    submitLogin: "دخول",
    submitRegister: "إنشاء الحساب",
    submitForgot: "إرسال رابط الاسترجاع",
    or: "أو",
    nafath: "الدخول عبر نفاذ (SSO)",
    passWeak: "ضعيف",
    passOkay: "مقبول",
    passGood: "جيد",
    passStrong: "قوي",
    haveAccount: "لديك حساب؟",
    needAccount: "مستخدم جديد؟",
    goLogin: "اذهب لتسجيل الدخول",
    goRegister: "اذهب لإنشاء حساب",
    goForgot: "نسيت كلمة المرور؟",
    formErrors: {
      required: "هذا الحقل مطلوب",
      email: "البريد غير صالح",
      match: "كلمتا المرور غير متطابقتين",
      consent: "يجب الموافقة على سياسة الخصوصية",
      password: "الحد الأدنى 8 أحرف مع أرقام وحروف",
    },
    hintPDPL: "نلتزم بنظام حماية البيانات الشخصية (PDPL) في المملكة.",
    hintRBAC: "سيتم تعيين صلاحياتك تلقائيًا بعد التسجيل وفق الدور المختار.",
    back: "عودة",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    tabs: { login: "Login", register: "Register", forgot: "Forgot Password" },
    role: "Role",
    roles: { authority: "Authority", consultant: "Consultant", client: "Client" },
    name: "Full name",
    email: "Email",
    password: "Password",
    confirm: "Confirm password",
    city: "City",
    org: "Organization",
    license: "License # (optional)",
    agree: "I agree to the Privacy Policy (PDPL)",
    submitLogin: "Sign in",
    submitRegister: "Create account",
    submitForgot: "Send reset link",
    or: "OR",
    nafath: "Sign in with Nafath (SSO)",
    passWeak: "Weak",
    passOkay: "Okay",
    passGood: "Good",
    passStrong: "Strong",
    haveAccount: "Already have an account?",
    needAccount: "New user?",
    goLogin: "Go to Login",
    goRegister: "Go to Register",
    goForgot: "Forgot password?",
    formErrors: {
      required: "This field is required",
      email: "Invalid email",
      match: "Passwords do not match",
      consent: "You must accept the privacy policy",
      password: "Min 8 chars with numbers & letters",
    },
    hintPDPL: "We comply with the Saudi Personal Data Protection Law (PDPL).",
    hintRBAC: "Your permissions will be assigned based on the selected role.",
    back: "Back",
  }
};

// Roles (fixed order)
const ROLES = ["authority","consultant","client"] as const;

// helpers
const cls = (...a:string[])=>a.filter(Boolean).join(" ");
const isEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// password strength 0..4
function strengthScore(p:string){
  let s=0; if(p.length>=8) s++; if(/[A-Z]/.test(p)) s++; if(/[a-z]/.test(p)) s++; if(/[0-9]/.test(p)) s++; if(/[^A-Za-z0-9]/.test(p)) s++; return Math.min(s,4);
}

const Icons = {
  logo: ()=> (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.6"/></svg>),
  user: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5"/></svg>),
  mail: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5"/><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5"/></svg>), 
  lock: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.5"/></svg>),
  key: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 12h11l-3 3m0-6l3 3" stroke="currentColor" strokeWidth="1.5"/></svg>),
  nafath: ()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12l4-1 3 2 3-5 4 3 4-1v8H3v-6z" stroke="currentColor" strokeWidth="1.5"/></svg>),
  check: ()=> (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/></svg>),
};

function Meter({score, labels}:{score:number; labels:{weak:string; okay:string; good:string; strong:string}}){
  const label = score<=1?labels.weak:score===2?labels.okay:score===3?labels.good:labels.strong;
  return (
    <div className="mt-2">
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className={cls("h-full transition-all", score===0?"w-1/12 bg-red-400": score===1?"w-1/4 bg-orange-400": score===2?"w-2/4 bg-yellow-400": score===3?"w-3/4 bg-emerald-400":"w-full bg-emerald-600")} />
      </div>
      <div className="text-[11px] text-slate-600 mt-1">{label}</div>
    </div>
  );
}

function Field({label, icon:Icon, children}:{label:string; icon:()=>JSX.Element; children:React.ReactNode}){
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700 flex items-center gap-2"><Icon/> {label}</span>
      {children}
    </label>
  );
}

function NafathButton({text}:{text:string}){
  return (
    <button type="button" onClick={()=>alert("NAFATH SSO placeholder — integrate via official SDK / SSO flow.")} className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-900">
      <Icons.nafath/> {text}
    </button>
  );
}

export default function SimaAuthScreen(){
  const [lang,setLang]=useState<"ar"|"en">("ar");
  const t=useMemo(()=>T[lang],[lang]);
  const rtl=lang==="ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  const [tab,setTab]=useState<"login"|"register"|"forgot">("login");
  const [role,setRole]=useState<typeof ROLES[number]>("consultant");

  // form states
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [city,setCity]=useState("");
  const [org,setOrg]=useState("");
  const [license,setLicense]=useState("");
  const [consent,setConsent]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [errors,setErrors]=useState<Record<string,string>>({});

  const score=strengthScore(password);

  function reset(){ setErrors({}); setMessage(null); }

  function validateLogin(){
    const e:Record<string,string>={}; if(!email) e.email=t.formErrors.required; else if(!isEmail(email)) e.email=t.formErrors.email; if(!password) e.password=t.formErrors.required; return e;
  }
  function validateRegister(){
    const e:Record<string,string>={};
    if(!name) e.name=t.formErrors.required;
    if(!email) e.email=t.formErrors.required; else if(!isEmail(email)) e.email=t.formErrors.email;
    if(!password) e.password=t.formErrors.required; else if(password.length<8 || !/[0-9]/.test(password) || !/[A-Za-z]/.test(password)) e.password=t.formErrors.password;
    if(confirm!==password) e.confirm=t.formErrors.match;
    if(!city) e.city=t.formErrors.required;
    if(!org) e.org=t.formErrors.required;
    if(!consent) e.consent=t.formErrors.consent;
    return e;
  }
  function validateForgot(){ const e:Record<string,string>={}; if(!email) e.email=t.formErrors.required; else if(!isEmail(email)) e.email=t.formErrors.email; return e; }

  function onLogin(evt:React.FormEvent){ evt.preventDefault(); reset(); const e=validateLogin(); if(Object.keys(e).length){ setErrors(e); return; } setMessage(rtl?`تم تسجيل الدخول بنجاح — الدور: ${t.roles[role]}`:`Signed in — role: ${t.roles[role]}`); }
  function onRegister(evt:React.FormEvent){ evt.preventDefault(); reset(); const e=validateRegister(); if(Object.keys(e).length){ setErrors(e); return; } setMessage(rtl?`تم إنشاء الحساب وتعيين صلاحيات ${t.roles[role]}.`:`Account created. Assigned ${t.roles[role]} permissions.`); }
  function onForgot(evt:React.FormEvent){ evt.preventDefault(); reset(); const e=validateForgot(); if(Object.keys(e).length){ setErrors(e); return; } setMessage(rtl?"تم إرسال رابط الاسترجاع إلى بريدك":"Reset link sent to your email"); }

  // self tests
  const tests = useMemo(()=>{
    const hasI18n = !!T.ar && !!T.en && !!T.ar.tabs && !!T.en.tabs;
    const hasRoles = ROLES.length===3 && ROLES.includes("authority") && ROLES.includes("consultant") && ROLES.includes("client");
    const strengthOk = strengthScore("Aa1!aaaa")>=3 && strengthScore("123")===1;
    return { ok: hasI18n && hasRoles && strengthOk, tip: `${hasI18n?"✓":"×"} i18n\n${hasRoles?"✓":"×"} roles(3)\n${strengthOk?"✓":"×"} strength fn` };
  },[]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Icons.logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='ar'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>عربي</button>
            <button onClick={()=>setLang("en")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='en'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>EN</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* Tabs */}
        <div className="flex items-center gap-2 text-sm">
          {["login","register","forgot"].map((k)=> (
            <button key={k} onClick={()=>setTab(k as any)} className={cls("px-4 py-2 rounded-xl border", tab===k?"bg-slate-900 text-white border-slate-900":"border-slate-300 text-slate-700 hover:bg-slate-50")}>{t.tabs[k as keyof typeof t.tabs]}</button>
          ))}
        </div>

        {/* Panel */}
        <div className="mt-6 grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 rounded-[28px] border border-slate-200 p-6">
            {/* Role picker */}
            <div className="grid sm:grid-cols-3 gap-2 mb-6" role="tablist" aria-label="roles">
              {ROLES.map((r)=> (
                <button key={r} role="tab" aria-selected={role===r} onClick={()=>setRole(r)} className={cls("px-4 py-2 rounded-xl border text-sm", role===r?"bg-slate-900 text-white border-slate-900":"border-slate-300 text-slate-700 hover:bg-slate-50")}>{t.roles[r]}</button>
              ))}
            </div>

            {tab==="login" && (
              <form onSubmit={onLogin} className="grid gap-3">
                <Field label={t.email} icon={Icons.mail}>
                  <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.email?"border-red-400":"border-slate-300")} placeholder={rtl?"name@example.com":"name@example.com"} />
                  {errors.email && <div className="text-red-600 text-[11px]">{errors.email}</div>}
                </Field>
                <Field label={t.password} icon={Icons.lock}>
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.password?"border-red-400":"border-slate-300")} placeholder={rtl?"••••••••":"••••••••"} />
                  {errors.password && <div className="text-red-600 text-[11px]">{errors.password}</div>}
                </Field>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600"><input type="checkbox"/> {rtl?"تذكرني":"Remember me"}</label>
                  <button type="button" onClick={()=>setTab("forgot")} className="text-xs underline decoration-slate-300 hover:decoration-slate-700">{t.goForgot}</button>
                </div>
                <button type="submit" className="mt-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm">{t.submitLogin}</button>
                <div className="flex items-center gap-2 my-2"><div className="h-px flex-1 bg-slate-200"/><span className="text-[10px] text-slate-500">{t.or}</span><div className="h-px flex-1 bg-slate-200"/></div>
                <NafathButton text={t.nafath} />
              </form>
            )}

            {tab==="register" && (
              <form onSubmit={onRegister} className="grid gap-3">
                <Field label={t.name} icon={Icons.user}>
                  <input value={name} onChange={e=>setName(e.target.value)} className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.name?"border-red-400":"border-slate-300")} />
                  {errors.name && <div className="text-red-600 text-[11px]">{errors.name}</div>}
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label={t.email} icon={Icons.mail}>
                    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.email?"border-red-400":"border-slate-300")} />
                    {errors.email && <div className="text-red-600 text-[11px]">{errors.email}</div>}
                  </Field>
                  <Field label={t.city} icon={Icons.key}>
                    <input value={city} onChange={e=>setCity(e.target.value)} className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.city?"border-red-400":"border-slate-300")} />
                    {errors.city && <div className="text-red-600 text-[11px]">{errors.city}</div>}
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label={t.org} icon={Icons.key}>
                    <input value={org} onChange={e=>setOrg(e.target.value)} className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.org?"border-red-400":"border-slate-300")} />
                    {errors.org && <div className="text-red-600 text-[11px]">{errors.org}</div>}
                  </Field>
                  <Field label={t.license} icon={Icons.key}>
                    <input value={license} onChange={e=>setLicense(e.target.value)} className="rounded-xl border px-3 py-2 text-sm w-full border-slate-300" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label={t.password} icon={Icons.lock}>
                    <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.password?"border-red-400":"border-slate-300")} />
                    <Meter score={score} labels={{weak:t.passWeak, okay:t.passOkay, good:t.passGood, strong:t.passStrong}}/>
                    {errors.password && <div className="text-red-600 text-[11px]">{errors.password}</div>}
                  </Field>
                  <Field label={t.confirm} icon={Icons.lock}>
                    <input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.confirm?"border-red-400":"border-slate-300")} />
                    {errors.confirm && <div className="text-red-600 text-[11px]">{errors.confirm}</div>}
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                  <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} /> {t.agree}
                </label>
                {errors.consent && <div className="text-red-600 text-[11px]">{errors.consent}</div>}
                <button type="submit" className="mt-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm">{t.submitRegister}</button>
              </form>
            )}

            {tab==="forgot" && (
              <form onSubmit={onForgot} className="grid gap-3">
                <Field label={t.email} icon={Icons.mail}>
                  <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className={cls("rounded-xl border px-3 py-2 text-sm w-full", errors.email?"border-red-400":"border-slate-300")} />
                  {errors.email && <div className="text-red-600 text-[11px]">{errors.email}</div>}
                </Field>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox"/> <span>{rtl?"أنا إنسان (anti-bot)":"I am human (anti-bot)"}</span>
                </div>
                <button type="submit" className="mt-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm">{t.submitForgot}</button>
              </form>
            )}
          </div>

          {/* Side info */}
          <aside className="lg:col-span-2">
            <div className="rounded-[28px] border border-slate-200 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
              <h3 className="text-base md:text-lg font-semibold mb-2">RBAC</h3>
              <ul className="text-sm text-slate-700 space-y-2">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600"><Icons.check/></span><span>{rtl?"الدور يحدد الوصول للوحة القيادة، المشاريع، والاعتماد.":"Role controls access to dashboard, projects, accreditation."}</span></li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600"><Icons.check/></span><span>{t.hintRBAC}</span></li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600"><Icons.check/></span><span>{t.hintPDPL}</span></li>
              </ul>
              <div className="text-[11px] text-slate-500 mt-4">{rtl?"بعد التسجيل ستنتقل إلى لوحة التحكم المناسبة لدورك.":"After registration you'll be redirected to a role-specific dashboard."}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/dashboard?role=authority" className="text-[11px] underline decoration-slate-300 hover:decoration-slate-700">{rtl?"تجربة لوحة جهة الاعتماد":"Try Authority dashboard"}</a>
                <a href="/dashboard?role=consultant" className="text-[11px] underline decoration-slate-300 hover:decoration-slate-700">{rtl?"تجربة لوحة الاستشاري":"Try Consultant dashboard"}</a>
                <a href="/dashboard?role=client" className="text-[11px] underline decoration-slate-300 hover:decoration-slate-700">{rtl?"تجربة لوحة العميل":"Try Client dashboard"}</a>
              </div>
            </div>
            {message && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 p-4 text-sm">{message}</div>
            )}
          </aside>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-200 text-center text-[11px] text-slate-600">Sima AI · Auth Screen</footer>

      {/* Tests badge */}
      <div className="fixed bottom-3 left-3 z-50">
        <div title={tests.tip} className={cls("px-2.5 py-1.5 rounded-full text-[10px]", tests.ok?"bg-emerald-600 text-white":"bg-amber-500 text-black")}>{tests.ok?"Tests: PASS":"Tests: CHECK"}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
      `}</style>
    </div>
  );
}
