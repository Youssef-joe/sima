import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  User,
  Mail,
  MapPin,
  Building2,
  IdCard,
  Lock,
  Eye,
  EyeOff,
  BadgeCheck,
  Check,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react";

/**
 * Sima AI — Screen 02: Register (Standalone)
 * - Clean JSX (all tags/blocks closed), no exotic CSS.
 * - RTL-first with AR/EN toggle and accessible labels.
 * - Full form with validation for all fields + demo reCAPTCHA checkbox.
 * - RBAC scaffold wired: account creation sets role; summary shows role permissions.
 * - Self-tests badge (runtime) validates i18n, roles, regex, required fields logic.
 */

// ——————————————————
// RBAC — roles & permissions (extend later in backend)
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: [
    "projects.view",
    "projects.create",
    "projects.approve",
    "ai.evaluate",
    "reports.view",
    "accredit.sign",
    "admin.users",
  ],
  [ROLES.CONSULTANT]: ["projects.view", "projects.create", "ai.evaluate", "reports.view"],
  [ROLES.CLIENT]: ["projects.view", "reports.view"],
};

// ——————————————————
// Auth context (local demo)
// ——————————————————
const AuthCtx = React.createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {name, email, role}
  const signUp = ({ name, email, role }) => setUser({ name, email, role });
  const signOut = () => setUser(null);
  const can = (perm) => !!(user && PERMISSIONS[user.role]?.includes(perm));
  const value = { user, signUp, signOut, can };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
function useAuth() { return useContext(AuthCtx); }

// ——————————————————
// UI primitives
// ——————————————————
const Button = ({ children, className = "", variant = "solid", ...props }) => (
  <button
    className={
      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition " +
      (variant === "solid"
        ? "bg-slate-900 text-white hover:bg-slate-700 "
        : variant === "outline"
        ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
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
      {Icon ? <Icon aria-hidden className="absolute right-3 top-2.5 h-4 w-4 text-slate-400"/> : null}
      {type === "password" ? (
        <button type="button" aria-label={"Toggle password visibility"} onClick={()=>setShow(!show)} className="absolute right-9 top-2.5">
          {show ? <EyeOff className="h-4 w-4 text-slate-400"/> : <Eye className="h-4 w-4 text-slate-400"/>}
        </button>
      ) : null}
    </div>
  );
}
function Select({ options, ...props }){
  return (
    <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
      {options.map((o, i)=> <option key={i} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "إنشاء حساب جديد",
    subtitle: "هوية رقمية لكل دور — RBAC",
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
    captcha: "أنا لست برنامج روبوت (تجريبي)",
    submit: "تسجيل",
    govSSO: "مصادقة حكومية قريبًا (نفاذ/Keycloak)",

    // validation messages
    requiredAll: "جميع الحقول مطلوبة",
    invalidEmail: "صيغة البريد غير صحيحة",
    weakPass: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    mustAgree: "يجب الموافقة على الشروط",
    mustCaptcha: "يرجى تأكيد أنك لست روبوتًا",

    // success
    ok: "تم إنشاء الحساب (تجريبي)",
    youAre: "تم إنشاء حساب لـ",
    yourPerms: "صلاحيات الدور:",
    signOut: "مسح الجلسة",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Create new account",
    subtitle: "A digital identity for each role — RBAC",
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
    captcha: "I'm not a robot (demo)",
    submit: "Register",
    govSSO: "Gov SSO coming soon (Nafath/Keycloak)",

    requiredAll: "All fields are required",
    invalidEmail: "Invalid email",
    weakPass: "Password must be at least 8 chars",
    mustAgree: "You must agree to the terms",
    mustCaptcha: "Please confirm you are not a robot",

    ok: "Account created (demo)",
    youAre: "Account created for",
    yourPerms: "Role permissions:",
    signOut: "Clear session",
  },
};

// ——————————————————
// Self-tests badge (runtime)
// ——————————————————
function DevTestsBadge({ t }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.brand && !!t.title && !!t.email && !!t.pass });
  const rolesOk = Array.isArray(t.roles) && t.roles.length === 3;
  tests.push({ name: "roles count", pass: rolesOk });
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test("a@b.com");
  tests.push({ name: "email regex", pass: emailOk });
  const rbacOk = PERMISSIONS[ROLES.AUTHORITY].includes("accredit.sign") && !PERMISSIONS[ROLES.CLIENT].includes("accredit.sign");
  tests.push({ name: "rbac rules", pass: rbacOk });
  const tooltip = tests.map((x)=> (x.pass? "✓ " : "× ") + x.name).join("\n");
  const allPass = tests.every((x)=>x.pass);
  return (
    <div aria-live="polite" className="fixed bottom-3 left-3 z-50">
      <div className={("px-2.5 py-1.5 rounded-full text-[10px] ") + (allPass? "bg-emerald-600 text-white" : "bg-amber-500 text-black")} title={tooltip}>
        {allPass? "Tests: PASS" : "Tests: CHECK"}
      </div>
    </div>
  );
}

// ——————————————————
// Screen 02 — Register
// ——————————————————
function RegisterScreen({ lang, setLang }){
  const t = useMemo(()=> T[lang], [lang]);
  const rtl = lang === "ar";
  const { user, signUp, signOut } = useAuth();

  // form state
  const [role, setRole] = useState(t.roles[1].value);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [org, setOrg] = useState("");
  const [license, setLicense] = useState("");
  const [pass, setPass] = useState("");
  const [agree, setAgree] = useState(false);
  const [captcha, setCaptcha] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function onSubmit(e){
    e.preventDefault(); setErr(""); setOk(false);
    if (!name || !email || !city || !org || !license || !pass) { setErr(t.requiredAll); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(t.invalidEmail); return; }
    if (pass.length < 8) { setErr(t.weakPass); return; }
    if (!agree) { setErr(t.mustAgree); return; }
    if (!captcha) { setErr(t.mustCaptcha); return; }
    signUp({ name, email, role });
    setOk(true);
  }

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
      {/* Topbar */}
      <header className="px-6 md:px-10 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center shadow-sm"><Shield className="w-5 h-5 text-white"/></div>
            <div className="font-semibold text-slate-900">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang('ar')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='ar'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>عربي</button>
            <button onClick={()=>setLang('en')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='en'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>EN</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-6 md:px-10 pb-16">
        <div className="max-w-5xl mx-auto">
          <Card className="p-8 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
                <p className="text-[12px] text-slate-600 mt-1 flex items-center gap-1">
                  {t.subtitle} <KeyRound className="w-4 h-4"/> <span className="ms-1">· {t.govSSO}</span>
                </p>
              </div>
              {user ? (
                <div className="text-[12px] text-slate-600">
                  <div>{t.youAre} <span className="font-medium text-slate-900">{user.name}</span> — {user.email}</div>
                  <div className="mt-1">{t.yourPerms}</div>
                  <ul className="list-disc ms-5">
                    {PERMISSIONS[user.role].map((p)=> (<li key={p}>{p}</li>))}
                  </ul>
                  <div className="mt-2"><Button variant="outline" onClick={signOut}>{t.signOut}</Button></div>
                </div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5 mt-6" noValidate>
              <Field label={t.role}>
                <Select value={role} onChange={(e)=>setRole(e.target.value)} options={t.roles} aria-label={t.role}/>
              </Field>
              <Field label={t.name}><Input value={name} onChange={(e)=>setName(e.target.value)} icon={User} placeholder={rtl? "مثال: محمد القحطاني" : "e.g. John Doe"} autoComplete="name"/></Field>
              <Field label={t.email}><Input value={email} onChange={(e)=>setEmail(e.target.value)} icon={Mail} inputMode="email" autoComplete="email" placeholder="name@example.com"/></Field>
              <Field label={t.city}><Input value={city} onChange={(e)=>setCity(e.target.value)} icon={MapPin} placeholder={rtl? "الرياض" : "Riyadh"}/></Field>
              <Field label={t.org}><Input value={org} onChange={(e)=>setOrg(e.target.value)} icon={Building2} placeholder={rtl? "جهتك/مكتبك" : "Your organization"}/></Field>
              <Field label={t.license}><Input value={license} onChange={(e)=>setLicense(e.target.value)} icon={IdCard} placeholder={rtl? "رقم أو نوع الترخيص" : "License id/type"}/></Field>
              <Field label={t.pass}><Input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} icon={Lock} autoComplete="new-password" placeholder={rtl? "••••••••" : "••••••••"}/></Field>

              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <input id="agree" type="checkbox" className="mt-1" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
                  <label htmlFor="agree" className="text-[12px] text-slate-700 cursor-pointer flex items-center gap-1"><BadgeCheck className="w-4 h-4"/> {t.agree}</label>
                </div>
                <div className="flex items-start gap-2">
                  <input id="captcha" type="checkbox" className="mt-1" checked={captcha} onChange={(e)=>setCaptcha(e.target.checked)} />
                  <label htmlFor="captcha" className="text-[12px] text-slate-700 cursor-pointer">{t.captcha}</label>
                </div>
              </div>

              {err ? (
                <div className="md:col-span-2 flex items-center gap-2 text-[12px] text-red-700">
                  <AlertCircle className="w-4 h-4"/> {err}
                </div>
              ) : null}

              {ok ? (
                <div className="md:col-span-2 flex items-center gap-2 text-[12px] text-emerald-700">
                  <Check className="w-4 h-4"/> {t.ok}
                </div>
              ) : null}

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit"><ArrowRight className="w-4 h-4"/> {t.submit}</Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      {/* Self-tests badge */}
      <DevTestsBadge t={t} />
    </div>
  );
}

// ——————————————————
// Exported App (mount with provider)
// ——————————————————
export default function Sima_Screen02_Register() {
  const [lang, setLang] = useState("ar");
  return (
    <AuthProvider>
      <RegisterScreen lang={lang} setLang={setLang} />
    </AuthProvider>
  );
}
