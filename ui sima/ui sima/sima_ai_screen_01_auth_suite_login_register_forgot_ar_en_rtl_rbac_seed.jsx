import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sima AI — Screen 01: Auth Suite (/auth)
 * - Tabs: Login / Register / Forgot
 * - Roles: Authority / Consultant / Client (RBAC seed stored to localStorage)
 * - i18n AR/EN + RTL auto + accessible labels/errors
 * - Password visibility toggle (aria-pressed) + strength meter
 * - Basic validations aligned with NIST/OWASP guidance (length, no truncation, allow long passphrases)
 * - PDPL consent checkbox for register
 * - Dev runtime tests via console.assert (non-invasive)
 * - No external deps; inline SVG icons; Tailwind utility classes
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — الدخول",
    tabLogin: "دخول",
    tabRegister: "تسجيل جديد",
    tabForgot: "استرجاع",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    show: "إظهار",
    hide: "إخفاء",
    name: "الاسم الكامل",
    city: "المدينة",
    org: "الجهة / المكتب",
    license: "نوع الترخيص",
    role: "الدور",
    roles: { authority: "جهة اعتماد", consultant: "استشاري", client: "عميل" },
    remember: "تذكرني",
    login: "تسجيل الدخول",
    sso: "دخول موحد (نفاذ) — قريبًا",
    register: "إنشاء الحساب",
    forgot: "إرسال رابط الاسترجاع",
    haveAcc: "لديك حساب؟",
    needAcc: "لا تملك حسابًا؟",
    toLogin: "اذهب إلى الدخول",
    toRegister: "اذهب إلى التسجيل",
    toForgot: "نسيت كلمة المرور؟",
    agree: "أوافق على سياسة الخصوصية وحماية البيانات (PDPL)",
    pdpl: "تعرف على PDPL",
    policyUrl: "/legal/privacy",
    errors: {
      email: "صيغة بريد غير صحيحة",
      required: "حقل إلزامي",
      passwordLen: "يجب أن تكون 8 أحرف على الأقل",
      pdpl: "يلزم الموافقة على السياسة",
    },
    successLogin: "تم تسجيل الدخول بنجاح",
    successRegister: "تم إنشاء الحساب بنجاح",
    successForgot: "تم إرسال رابط الاسترجاع إن وُجد حساب مطابق",
    strength: "قوة كلمة المرور",
    or: "أو",
    langAr: "عربي",
    langEn: "English",
  },
  en: {
    brand: "Sima AI — Sign in",
    tabLogin: "Login",
    tabRegister: "Register",
    tabForgot: "Forgot",
    email: "Email",
    password: "Password",
    show: "Show",
    hide: "Hide",
    name: "Full name",
    city: "City",
    org: "Organization / Firm",
    license: "License type",
    role: "Role",
    roles: { authority: "Authority", consultant: "Consultant", client: "Client" },
    remember: "Remember me",
    login: "Sign in",
    sso: "Single Sign-On (Nafath) — soon",
    register: "Create account",
    forgot: "Send reset link",
    haveAcc: "Already have an account?",
    needAcc: "Don't have an account?",
    toLogin: "Go to login",
    toRegister: "Go to register",
    toForgot: "Forgot password?",
    agree: "I agree to the Privacy & PDPL policy",
    pdpl: "Read PDPL",
    policyUrl: "/legal/privacy",
    errors: {
      email: "Invalid email format",
      required: "This field is required",
      passwordLen: "Minimum 8 characters",
      pdpl: "You must accept the policy",
    },
    successLogin: "Signed in successfully",
    successRegister: "Account created successfully",
    successForgot: "If an account exists, a reset link has been sent",
    strength: "Password strength",
    or: "or",
    langAr: "عربي",
    langEn: "English",
  },
};

// ————————— types —————————
type Lang = keyof typeof T;
type Role = "authority"|"consultant"|"client";

type Tab = "login"|"register"|"forgot";

export default function SimaAuthSuite(){
  const [lang,setLang]=useState<Lang>(()=> (localStorage.getItem("sima_lang") as Lang) || "ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  const [tab,setTab]=useState<Tab>("login");
  const [role,setRole]=useState<Role>(()=> (localStorage.getItem("sima_role") as Role) || "consultant");

  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; document.documentElement.lang=lang; localStorage.setItem("sima_lang", lang); },[rtl,lang]);

  // focus first field on tab change
  const firstFieldRef = useRef<HTMLInputElement|null>(null);
  useEffect(()=>{ firstFieldRef.current?.focus(); },[tab,lang]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>{t.langAr}</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>{t.langEn}</button>
          </div>
        </div>
      </header>

      {/* main card */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 grid md:grid-cols-2 gap-6">
        {/* left: tabs + forms */}
        <section className="p-5 border rounded-2xl bg-white">
          <nav className="flex gap-2 mb-4">
            <TabButton active={tab==='login'} onClick={()=>setTab('login')}>{t.tabLogin}</TabButton>
            <TabButton active={tab==='register'} onClick={()=>setTab('register')}>{t.tabRegister}</TabButton>
            <TabButton active={tab==='forgot'} onClick={()=>setTab('forgot')}>{t.tabForgot}</TabButton>
          </nav>

          {tab==='login' && <LoginForm t={t} role={role} setRole={setRole} firstRef={firstFieldRef} onSuccess={()=>handleSuccess("login", role)}/>} 
          {tab==='register' && <RegisterForm t={t} role={role} setRole={setRole} firstRef={firstFieldRef} onSuccess={()=>handleSuccess("register", role)}/>} 
          {tab==='forgot' && <ForgotForm t={t} firstRef={firstFieldRef} onSuccess={()=>notify(t.successForgot)}/>} 
        </section>

        {/* right: role explainer */}
        <aside className="p-5 border rounded-2xl bg-slate-50">
          <h3 className="font-semibold mb-3">{t.role}</h3>
          <ul className="space-y-2 text-sm">
            <li className={role==='authority'? 'font-medium':''}><Badge color="emerald">{t.roles.authority}</Badge> — {lang==='ar'? 'إدارة الاعتماد وإصدار الشهادات.':'Manage approvals and certificates.'}</li>
            <li className={role==='consultant'? 'font-medium':''}><Badge color="sky">{t.roles.consultant}</Badge> — {lang==='ar'? 'رفع المشاريع والتحليل والتعديلات.':'Upload, analyze, iterate.'}</li>
            <li className={role==='client'? 'font-medium':''}><Badge color="slate">{t.roles.client}</Badge> — {lang==='ar'? 'متابعة الحالة والمحاكاة والشهادات.':'Follow status, simulations, certificates.'}</li>
          </ul>

          <div className="mt-5 text-xs text-slate-600">
            <p>
              {lang==='ar'
                ? 'تتوافق الصفحة مع ممارسات الوصول (WAI-ARIA) للحوار والنماذج ونمط الأزرار المتبدلة.'
                : 'This page follows WAI-ARIA practices for dialogs/forms and toggle button patterns.'}
            </p>
            <a className="underline" href={t.policyUrl} target="_blank" rel="noreferrer">{t.pdpl}</a>
          </div>
        </aside>
      </main>

      {/* toast */}
      <div id="toast" aria-live="polite" className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none"></div>

      {/* styles */}
      <style>{`
        html{scroll-behavior:smooth}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );

  function handleSuccess(kind: "login"|"register", r: Role){
    localStorage.setItem("sima_role", r);
    if(kind==='register') notify(t.successRegister); else notify(t.successLogin);
    // redirect by role
    const to = r==='authority'? '/authority/panel' : '/dashboard';
    setTimeout(()=> window.location.assign(to), 400);
  }
}

// ————————— Forms —————————
function LoginForm({t, role, setRole, firstRef, onSuccess}:{t:any, role:Role, setRole:(r:Role)=>void, firstRef:any, onSuccess:()=>void}){
  const [email,setEmail]=useState("");
  const [pwd,setPwd]=useState("");
  const [show,setShow]=useState(false); // aria-pressed toggle
  const [remember,setRemember]=useState(true);
  const [err,setErr]=useState<{email?:string;pwd?:string}>({});

  function submit(e:React.FormEvent){ e.preventDefault();
    const e1 = !isEmail(email)? t.errors.email : undefined;
    const e2 = pwd.length<8? t.errors.passwordLen : undefined; // NIST min 8
    setErr({email:e1, pwd:e2});
    if(!e1 && !e2){ onSuccess(); }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-3">
        <label className="block" htmlFor="login-email">
          <span className="text-[12px] text-slate-600">{t.email}</span>
          <input ref={firstRef} id="login-email" inputMode="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={Boolean(err.email)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="you@example.com"/>
          {err.email && <FieldErr>{err.email}</FieldErr>}
        </label>
        <label className="block" htmlFor="login-pwd">
          <span className="text-[12px] text-slate-600">{t.password}</span>
          <div className="relative mt-1">
            <input id="login-pwd" type={show? 'text':'password'} autoComplete="current-password" value={pwd} onChange={e=>setPwd(e.target.value)} aria-invalid={Boolean(err.pwd)} className="w-full px-3 py-2 border rounded-xl text-sm pr-12" placeholder="••••••••"/>
            <button type="button" aria-label={show? t.hide:t.show} aria-pressed={show} onClick={()=>setShow(s=>!s)} className="absolute inset-y-0 end-1 my-1 px-2 rounded-lg text-[12px] border bg-white">
              {show? t.hide:t.show}
            </button>
          </div>
          {err.pwd && <FieldErr>{err.pwd}</FieldErr>}
        </label>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
            <span>{t.remember}</span>
          </label>
          <button type="button" className="text-sm underline" onClick={()=>{
            const el=document.getElementById('tab-forgot'); el?.focus();
          }} >{t.toForgot}</button>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">{t.login}</button>
          <span className="text-xs opacity-60">{t.or}</span>
          <button type="button" disabled className="px-3 py-2 rounded-xl border text-sm opacity-60 cursor-not-allowed">{t.sso}</button>
        </div>

        <fieldset className="mt-3">
          <legend className="text-[12px] text-slate-600">{t.role}</legend>
          <div className="flex flex-wrap gap-2 mt-1">
            <RoleChip active={role==='authority'} onClick={()=>setRole('authority')}>{t.roles.authority}</RoleChip>
            <RoleChip active={role==='consultant'} onClick={()=>setRole('consultant')}>{t.roles.consultant}</RoleChip>
            <RoleChip active={role==='client'} onClick={()=>setRole('client')}>{t.roles.client}</RoleChip>
          </div>
        </fieldset>

        <p className="text-xs text-slate-500 mt-2">
          <a href="/legal/privacy" className="underline" target="_blank" rel="noreferrer">{t.pdpl}</a>
        </p>
      </div>
    </form>
  );
}

function RegisterForm({t, role, setRole, firstRef, onSuccess}:{t:any, role:Role, setRole:(r:Role)=>void, firstRef:any, onSuccess:()=>void}){
  const [form,setForm]=useState({name:"", email:"", city:"", org:"", license:"", pwd:"", agree:false});
  const [show,setShow]=useState(false);
  const [err,setErr]=useState<any>({});

  function submit(e:React.FormEvent){ e.preventDefault();
    const eMap:any = {};
    if(!form.name) eMap.name=t.errors.required;
    if(!isEmail(form.email)) eMap.email=t.errors.email;
    if(!form.city) eMap.city=t.errors.required;
    if(!form.org) eMap.org=t.errors.required;
    if(!form.license) eMap.license=t.errors.required;
    if((form.pwd||'').length<8) eMap.pwd=t.errors.passwordLen;
    if(!form.agree) eMap.agree=t.errors.pdpl;
    setErr(eMap);
    if(Object.keys(eMap).length===0){ onSuccess(); }
  }

  const strength = useMemo(()=> pwStrength(form.pwd),[form.pwd]);

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-3">
        <label className="block" htmlFor="reg-name">
          <span className="text-[12px] text-slate-600">{t.name}</span>
          <input ref={firstRef} id="reg-name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} aria-invalid={Boolean(err.name)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"/>
          {err.name && <FieldErr>{err.name}</FieldErr>}
        </label>
        <label className="block" htmlFor="reg-email">
          <span className="text-[12px] text-slate-600">{t.email}</span>
          <input id="reg-email" inputMode="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} aria-invalid={Boolean(err.email)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="you@example.com"/>
          {err.email && <FieldErr>{err.email}</FieldErr>}
        </label>

        <div className="grid md:grid-cols-3 gap-3">
          <label className="block" htmlFor="reg-city">
            <span className="text-[12px] text-slate-600">{t.city}</span>
            <input id="reg-city" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} aria-invalid={Boolean(err.city)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"/>
            {err.city && <FieldErr>{err.city}</FieldErr>}
          </label>
          <label className="block" htmlFor="reg-org">
            <span className="text-[12px] text-slate-600">{t.org}</span>
            <input id="reg-org" value={form.org} onChange={e=>setForm({...form, org:e.target.value})} aria-invalid={Boolean(err.org)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"/>
            {err.org && <FieldErr>{err.org}</FieldErr>}
          </label>
          <label className="block" htmlFor="reg-license">
            <span className="text-[12px] text-slate-600">{t.license}</span>
            <input id="reg-license" value={form.license} onChange={e=>setForm({...form, license:e.target.value})} aria-invalid={Boolean(err.license)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"/>
            {err.license && <FieldErr>{err.license}</FieldErr>}
          </label>
        </div>

        <label className="block" htmlFor="reg-pwd">
          <span className="text-[12px] text-slate-600">{t.password}</span>
          <div className="relative mt-1">
            <input id="reg-pwd" type={show? 'text':'password'} autoComplete="new-password" value={form.pwd} onChange={e=>setForm({...form, pwd:e.target.value})} aria-invalid={Boolean(err.pwd)} className="w-full px-3 py-2 border rounded-xl text-sm pr-12" placeholder="••••••••"/>
            <button type="button" aria-label={show? t.hide:t.show} aria-pressed={show} onClick={()=>setShow(s=>!s)} className="absolute inset-y-0 end-1 my-1 px-2 rounded-lg text-[12px] border bg-white">{show? t.hide:t.show}</button>
          </div>
          {err.pwd && <FieldErr>{err.pwd}</FieldErr>}
          <Strength t={t} score={strength.score} hints={strength.hints}/>
        </label>

        <fieldset className="mt-2">
          <legend className="text-[12px] text-slate-600">{t.role}</legend>
          <div className="flex flex-wrap gap-2 mt-1">
            <RoleChip active={role==='authority'} onClick={()=>setRole('authority')}>{t.roles.authority}</RoleChip>
            <RoleChip active={role==='consultant'} onClick={()=>setRole('consultant')}>{t.roles.consultant}</RoleChip>
            <RoleChip active={role==='client'} onClick={()=>setRole('client')}>{t.roles.client}</RoleChip>
          </div>
        </fieldset>

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.agree} onChange={e=>setForm({...form, agree:e.target.checked})}/>
          <span>{t.agree} — <a className="underline" href="/legal/privacy" target="_blank" rel="noreferrer">{t.pdpl}</a></span>
        </label>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">{t.register}</button>
          <span className="text-xs opacity-60">{t.or}</span>
          <button type="button" disabled className="px-3 py-2 rounded-xl border text-sm opacity-60 cursor-not-allowed">{t.sso}</button>
        </div>
      </div>
    </form>
  );
}

function ForgotForm({t, firstRef, onSuccess}:{t:any, firstRef:any, onSuccess:()=>void}){
  const [email,setEmail]=useState("");
  const [err,setErr]=useState<string|undefined>();
  function submit(e:React.FormEvent){ e.preventDefault();
    const e1 = !isEmail(email)? t.errors.email : undefined;
    setErr(e1);
    if(!e1) onSuccess();
  }
  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-3">
        <label className="block" htmlFor="forgot-email">
          <span className="text-[12px] text-slate-600">{t.email}</span>
          <input ref={firstRef} id="forgot-email" inputMode="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={Boolean(err)} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="you@example.com"/>
          {err && <FieldErr>{err}</FieldErr>}
        </label>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm w-max">{t.forgot}</button>
        <p className="text-xs text-slate-500"><a href="#" className="underline" onClick={(e)=>{e.preventDefault();}}>{t.toLogin}</a></p>
      </div>
    </form>
  );
}

// ————————— UI helpers —————————
function RoleChip({active, onClick, children}:{active:boolean; onClick:()=>void; children:React.ReactNode}){
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-xl text-sm border ${active? 'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700'}`}>{children}</button>
  );
}

function FieldErr({children}:{children:React.ReactNode}){
  return <div className="text-[12px] text-rose-600 mt-1">{children}</div>;
}

function Strength({t, score, hints}:{t:any, score:number, hints:string[]}){
  const colors = ["rose","amber","sky","emerald"]; // 0..3
  const labels = langAware(t, ["ضعيفة","متوسطة","جيدة","قوية"], ["Weak","Fair","Good","Strong"]);
  const c = colors[Math.max(0, Math.min(3, score))];
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 text-[12px]">
        <span className="opacity-70">{t.strength}:</span>
        <Badge color={c as any}>{labels[Math.max(0, Math.min(3, score))]}</Badge>
      </div>
      {hints.length>0 && (
        <ul className="mt-1 text-[12px] text-slate-600 list-disc ms-4 space-y-0.5">
          {hints.map((h,i)=> <li key={i}>{h}</li>)}
        </ul>
      )}
    </div>
  );
}

function Badge({children, color}:{children:React.ReactNode, color:"emerald"|"amber"|"rose"|"sky"|"slate"}){
  const map = { emerald:"bg-emerald-50 text-emerald-700 border-emerald-300", amber:"bg-amber-50 text-amber-700 border-amber-300", rose:"bg-rose-50 text-rose-700 border-rose-300", sky:"bg-sky-50 text-sky-700 border-sky-300", slate:"bg-slate-50 text-slate-700 border-slate-300" } as const;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] ${map[color]}`}>{children}</span>;
}

function TabButton({active, onClick, children}:{active:boolean; onClick:()=>void; children:React.ReactNode}){
  return <button id={children==='Forgot'? 'tab-forgot': undefined} onClick={onClick} className={`px-3 py-1.5 rounded-xl text-sm border ${active? 'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700'}`}>{children}</button>;
}

function clsBtn(active:boolean){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }

function isEmail(s:string){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

function langAware(t:any, arArr:string[], enArr:string[]){ return t===T.ar? arArr: enArr; }

function pwStrength(pwd:string){
  let score = 0; const hints:string[]=[];
  if(!pwd || pwd.length<8){ hints.push(T.ar.errors? T.ar.errors.passwordLen : 'min 8'); return {score, hints}; }
  // length bonuses
  if(pwd.length>=12) score++;
  if(pwd.length>=16) score++;
  // diversity
  const classes = [/[a-z]/,/[A-Z]/,/\d/,/[^A-Za-z0-9]/].reduce((acc,r)=>acc + (r.test(pwd)?1:0),0);
  if(classes>=3) score++;
  // blacklist common (toy)
  const common = ["password","123456","qwerty","11111111","letmein","sima1234"];
  if(common.some(c=> pwd.toLowerCase().includes(c))){ score = Math.max(0, score-2); hints.push(T.ar===T.ar? 'تجنّب العبارات الشائعة مثل password' : 'Avoid common phrases like password'); }
  return {score: Math.max(0, Math.min(3, score)), hints};
}

function notify(msg:string){
  const host = document.getElementById('toast');
  if(!host) return;
  const el = document.createElement('div');
  el.className = 'pointer-events-auto bg-slate-900 text-white text-sm px-3 py-2 rounded-xl shadow mb-2';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 2200);
}

function Logo(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="logo">
      <path d="M3 12l4-7 10 0 4 7-4 7-10 0-4-7z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

// ————————— Dev runtime tests —————————
(function tests(){
  try{
    console.assert(isEmail('a@b.com'), 'email ok');
    console.assert(!isEmail('a@b'), 'email fail');
    const s1=pwStrength('123'); console.assert(s1.score===0, 'short pwd');
    const s2=pwStrength('LongerPass123!'); console.assert(s2.score>=2, 'strong-ish pwd');
    console.assert(typeof localStorage!=="undefined", 'localStorage exists');
    console.assert(Boolean(T.ar)&&Boolean(T.en), 'i18n present');
  }catch(e){ console.warn('Auth tests warning:', e); }
})();
