import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 01: Authentication (Login / Register / Forgot)
 * - i18n (AR/EN) + RTL switching
 * - Roles: Authority / Consultant / Client (RBAC-ready)
 * - Forms: Login, Register, Forgot
 * - Validations + reCAPTCHA placeholder + Password strength meter
 * - Mock SSO (Nafath) button (placeholder)
 * - Mock Auth flow: writes a demo JWT to localStorage and shows a success banner
 * - Self tests to ensure validators & i18n keys exist
 *
 * NOTE: This is a standalone screen component intended to be used under routes:
 *   /auth/login, /auth/register, /auth/forgot (here provided as tabs)
 *   Hook it to NextAuth/Keycloak by swapping `mockAuth` with real API calls later.
 */

// ——————————————————
// i18n dictionary
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "تسجيل الدخول وإنشاء الحساب",
    subtitle: "نظام وطني للهوية المعمارية السعودية (DASC)",
    tabs: { login: "تسجيل الدخول", register: "إنشاء حساب", forgot: "استرجاع كلمة المرور" },
    email: "البريد الإلكتروني",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    show: "إظهار",
    hide: "إخفاء",
    remember: "تذكّرني",
    login: "دخول",
    sso: "دخول عبر نفاذ (SSO)",
    or: "أو",
    haveAcc: "لديك حساب؟",
    noAcc: "ليس لديك حساب؟",
    goLogin: "اذهب للدخول",
    goRegister: "أنشئ حسابًا",
    role: "نوع الدور",
    roles: { authority: "جهة الاعتماد", consultant: "استشاري التصميم", client: "العميل" },
    name: "الاسم الكامل",
    city: "المدينة",
    license: "رقم الترخيص (إن وجد)",
    agree: "أوافق على سياسة الخصوصية وشروط الاستخدام",
    register: "إنشاء الحساب",
    forgotInfo: "سنرسل رابط إعادة التعيين إلى بريدك",
    send: "إرسال الرابط",
    pdpl: "ملتزمون بنظام حماية البيانات الشخصية (PDPL)",
    captcha: "أنا لست روبوتًا",
    strength: "قوة كلمة المرور",
    successLogin: "تم تسجيل الدخول بنجاح! سيتم توجيهك للوحة التحكّم.",
    successRegister: "تم إنشاء الحساب! يمكنك الدخول الآن.",
    successForgot: "تم إرسال رابط إعادة التعيين إلى بريدك إن وُجد.",
    invalidEmail: "صيغة البريد غير صحيحة",
    required: "هذا الحقل مطلوب",
    weakPass: "كلمة المرور ضعيفة",
    minChars: "الحد الأدنى 8 أحرف",
    lang: "اللغة",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Sign in & Create account",
    subtitle: "National system for Saudi Architectural Identity (DASC)",
    tabs: { login: "Login", register: "Register", forgot: "Forgot Password" },
    email: "Email",
    username: "Username",
    password: "Password",
    show: "Show",
    hide: "Hide",
    remember: "Remember me",
    login: "Login",
    sso: "Login with Nafath (SSO)",
    or: "OR",
    haveAcc: "Already have an account?",
    noAcc: "Don’t have an account?",
    goLogin: "Go to Login",
    goRegister: "Create one",
    role: "Role",
    roles: { authority: "Authority", consultant: "Consultant", client: "Client" },
    name: "Full name",
    city: "City",
    license: "License No. (optional)",
    agree: "I agree to Privacy Policy & Terms",
    register: "Create account",
    forgotInfo: "We will send a reset link to your email",
    send: "Send link",
    pdpl: "Compliant with PDPL",
    captcha: "I'm not a robot",
    strength: "Password strength",
    successLogin: "Logged in successfully! Redirecting to dashboard…",
    successRegister: "Account created! You can login now.",
    successForgot: "If the email exists, a reset link has been sent.",
    invalidEmail: "Invalid email format",
    required: "This field is required",
    weakPass: "Weak password",
    minChars: "Minimum 8 characters",
    lang: "Language",
  }
};

// ——————————————————
// utilities
// ——————————————————
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateEmail(v){ return emailRx.test(String(v||"").trim()); }
function passStrength(p=""){
  let s=0; if(p.length>=8) s++; if(/[A-Z]/.test(p)) s++; if(/[a-z]/.test(p)) s++; if(/\d/.test(p)) s++; if(/[^\w]/.test(p)) s++;
  return Math.min(s,5); // 0..5
}
function cls(...a){ return a.filter(Boolean).join(" "); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// mock auth — replace with NextAuth/Keycloak later
async function mockAuth({ mode, email, password, role }){
  await sleep(600);
  if(mode!=="forgot" && (!validateEmail(email) || !password || password.length<8)){
    const err = new Error("Invalid credentials"); err.code=401; throw err;
  }
  const token = {
    sub: email,
    role: role||"client",
    iat: Math.floor(Date.now()/1000),
    exp: Math.floor(Date.now()/1000)+ 60*60,
  };
  localStorage.setItem("sima_demo_jwt", JSON.stringify(token));
  return token;
}

// inline icons (to avoid external icon deps)
function IconShield(){
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}
function IconEye({off}){
  return off? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ):(
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

// UI primitives
function Button({children, className="", variant="solid", ...props}){
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition";
  const styles = variant==="solid"? " bg-slate-900 text-white hover:bg-slate-700" :
                 variant==="outline"? " border border-slate-300 hover:bg-slate-100" :
                 variant==="ghost"? " hover:bg-slate-100" : "";
  return <button className={cls(base, styles, className)} {...props}>{children}</button>;
}
function Input(props){
  return <input {...props} className={cls("w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10", props.className)} />
}
function Card({children, className=""}){
  return <div className={cls("rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}
function Help({children}){ return <div className="text-[12px] text-slate-500 mt-1">{children}</div>; }

// ——————————————————
// Self tests (basic)
// ——————————————————
function useDevTests(lang){
  const [results, setResults] = useState([]);
  useEffect(()=>{
    const t = T[lang];
    const tests = [];
    tests.push({ name: "i18n keys", pass: !!t?.title && !!t?.tabs?.login && !!t?.roles?.authority });
    tests.push({ name: "email validator", pass: validateEmail("a@b.com") && !validateEmail("a@b") });
    tests.push({ name: "password strength", pass: passStrength("Aa1!aaaa")>=4 });
    setResults(tests);
  }, [lang]);
  const all = results.every(r=>r.pass);
  const tip = results.map(r=>`${r.pass?"✓":"×"} ${r.name}`).join("\n");
  return { all, tip };
}

// ——————————————————
// Main Screen
// ——————————————————
export default function SimaAuthScreen(){
  const [lang, setLang] = useState("ar");
  const t = useMemo(()=> T[lang], [lang]);
  const rtl = lang === "ar";
  const [tab, setTab] = useState("login"); // login | register | forgot

  // common fields
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [role, setRole] = useState("consultant"); // authority | consultant | client
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  const [agree, setAgree] = useState(false);
  const [captcha, setCaptcha] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const { all:testsOk, tip } = useDevTests(lang);

  useEffect(()=>{ setErr(""); setMsg(""); }, [tab, lang]);

  async function onLogin(e){ e.preventDefault(); setErr(""); setMsg("");
    if(!validateEmail(email)) return setErr(t.invalidEmail);
    if(!password || password.length<8) return setErr(`${t.minChars}`);
    if(!captcha) return setErr(t.captcha);
    setBusy(true);
    try {
      await mockAuth({ mode:"login", email, password, role });
      setMsg(t.successLogin);
    } catch(ex){ setErr(ex.message||"error"); }
    finally { setBusy(false); }
  }
  async function onRegister(e){ e.preventDefault(); setErr(""); setMsg("");
    if(!name) return setErr(t.required);
    if(!validateEmail(email)) return setErr(t.invalidEmail);
    const ps=passStrength(password); if(ps<3) return setErr(`${t.weakPass} — ${t.minChars}`);
    if(!agree) return setErr(t.agree);
    if(!captcha) return setErr(t.captcha);
    setBusy(true);
    try {
      await mockAuth({ mode:"register", email, password, role });
      setMsg(t.successRegister);
      setTab("login");
    } catch(ex){ setErr(ex.message||"error"); }
    finally { setBusy(false); }
  }
  async function onForgot(e){ e.preventDefault(); setErr(""); setMsg("");
    if(!validateEmail(email)) return setErr(t.invalidEmail);
    setBusy(true);
    try { await mockAuth({ mode:"forgot", email }); setMsg(t.successForgot); }
    catch(ex){ setErr(ex.message||"error"); }
    finally { setBusy(false); }
  }

  const strengthVal = passStrength(password);
  const strengthPct = (strengthVal/5)*100;

  return (
    <div dir={rtl?"rtl":"ltr"} className="min-h-screen w-full bg-[linear-gradient(180deg,#f7f9ff,white)] text-slate-900">
      {/* Topbar */}
      <header className="px-6 md:px-10 py-5 sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white"><IconShield/></div>
            <div className="font-semibold">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='ar'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>عربي</button>
            <button onClick={()=>setLang("en")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='en'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>EN</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-6 md:px-10">
        <div className="max-w-6xl mx-auto py-8 md:py-12 grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Left — Marketing blurb */}
          <Card className="p-6 lg:p-8 flex flex-col justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
              <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700 list-disc ps-5">
                <li>RBAC — {t.roles.authority} / {t.roles.consultant} / {t.roles.client}</li>
                <li>SSO — Nafath (placeholder)</li>
                <li>PDPL — {t.pdpl}</li>
              </ul>
            </div>
            <div className="mt-8 text-[12px] text-slate-500">© {new Date().getFullYear()} Sima AI</div>
          </Card>

          {/* Right — Forms */}
          <Card className="p-4 md:p-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1">
              {(["login","register","forgot"]).map(key=> (
                <button key={key} onClick={()=>setTab(key)} className={cls("flex-1 px-3 py-2 rounded-xl text-sm", tab===key?"bg-white shadow-sm border border-slate-200":"text-slate-600 hover:text-slate-900")}>
                  {t.tabs[key]}
                </button>
              ))}
            </div>

            {/* Messages */}
            {(err||msg) && (
              <div className={cls("mt-3 px-4 py-3 rounded-xl text-sm", err?"bg-rose-50 text-rose-700 border border-rose-200":"bg-emerald-50 text-emerald-700 border border-emerald-200")}>{err||msg}</div>
            )}

            {/* Login */}
            {tab==="login" && (
              <form onSubmit={onLogin} className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-sm">{t.email}</span>
                  <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm">{t.password}</span>
                  <div className="relative">
                    <Input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
                    <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute inset-y-0 end-2 my-auto px-2 rounded-lg text-slate-600 hover:text-slate-900">
                      <IconEye off={showPass}/>
                    </button>
                  </div>
                </label>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> {t.remember}</label>
                  <button type="button" onClick={()=>setTab("forgot")} className="text-sm text-slate-600 hover:text-slate-900">{t.tabs.forgot}</button>
                </div>
                <label className="inline-flex items-center gap-2 text-sm mt-1"><input type="checkbox" checked={captcha} onChange={e=>setCaptcha(e.target.checked)} /> {t.captcha}</label>

                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  <Button type="submit" disabled={busy} className="w-full">{t.login}</Button>
                  <Button type="button" variant="outline" disabled={busy} className="w-full">{t.sso}</Button>
                </div>

                <Help>
                  {t.noAcc} <button type="button" onClick={()=>setTab("register")} className="underline hover:no-underline">{t.goRegister}</button>
                </Help>
              </form>
            )}

            {/* Register */}
            {tab==="register" && (
              <form onSubmit={onRegister} className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-sm">{t.name}</span>
                  <Input value={name} onChange={e=>setName(e.target.value)} placeholder={rtl?"الاسم بالكامل":"Full name"}/>
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="grid gap-1">
                    <span className="text-sm">{t.email}</span>
                    <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm">{t.city}</span>
                    <Input value={city} onChange={e=>setCity(e.target.value)} placeholder={rtl?"الرياض":"Riyadh"}/>
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="grid gap-1">
                    <span className="text-sm">{t.password}</span>
                    <div className="relative">
                      <Input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
                      <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute inset-y-0 end-2 my-auto px-2 rounded-lg text-slate-600 hover:text-slate-900"><IconEye off={showPass}/></button>
                    </div>
                    <div className="mt-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full" style={{width:`${strengthPct}%`, background: strengthPct>70?"#16a34a":strengthPct>40?"#f59e0b":"#ef4444"}}/></div>
                      <div className="text-[11px] text-slate-600 mt-1">{t.strength}: {strengthVal}/5</div>
                    </div>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm">{t.license}</span>
                    <Input value={license} onChange={e=>setLicense(e.target.value)} placeholder="—"/>
                  </label>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {(["authority","consultant","client"]).map(r => (
                    <label key={r} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 cursor-pointer">
                      <input type="radio" name="role" value={r} checked={role===r} onChange={()=>setRole(r)} />
                      <span className="text-sm">{t.roles[r]}</span>
                    </label>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} /> {t.agree}</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={captcha} onChange={e=>setCaptcha(e.target.checked)} /> {t.captcha}</label>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  <Button type="submit" disabled={busy} className="w-full">{t.register}</Button>
                  <Button type="button" variant="outline" disabled={busy} className="w-full">{t.sso}</Button>
                </div>
                <Help>
                  {t.haveAcc} <button type="button" onClick={()=>setTab("login")} className="underline hover:no-underline">{t.goLogin}</button>
                </Help>
              </form>
            )}

            {/* Forgot */}
            {tab==="forgot" && (
              <form onSubmit={onForgot} className="mt-4 grid gap-3">
                <div className="text-sm text-slate-600">{t.forgotInfo}</div>
                <label className="grid gap-1">
                  <span className="text-sm">{t.email}</span>
                  <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
                </label>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  <Button type="submit" disabled={busy} className="w-full">{t.send}</Button>
                  <Button type="button" variant="outline" onClick={()=>setTab("login")} className="w-full">{t.goLogin}</Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>

      {/* Dev tests badge */}
      <div className="fixed bottom-3 left-3 z-50" title={tip} aria-live="polite">
        <div className={cls("px-2.5 py-1.5 rounded-full text-[10px]", testsOk?"bg-emerald-600 text-white":"bg-amber-500 text-black")}>{testsOk?"Tests: PASS":"Tests: CHECK"}</div>
      </div>

      {/* print styles */}
      <style>{`@media print{ .no-print{ display:none !important } body{ -webkit-print-color-adjust:exact } }`}</style>
    </div>
  );
}
