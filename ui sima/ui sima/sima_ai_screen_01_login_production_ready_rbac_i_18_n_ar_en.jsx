import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowRight,
  KeyRound,
  LogIn,
} from "lucide-react";

/**
 * Sima AI — Screen 01: Login (Standalone)
 * - Clean JSX (no exotic CSS). All tags & blocks closed.
 * - RTL-first with AR/EN toggle.
 * - RBAC scaffold (roles/permissions) to program upon.
 * - Accessible form (labels, aria, keyboard focus), client-side validation.
 * - Self-tests badge (runtime) to catch regressions fast.
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
  const [user, setUser] = useState(null); // {email, role}
  const signIn = ({ email, role }) => setUser({ email, role });
  const signOut = () => setUser(null);
  const can = (perm) => !!(user && PERMISSIONS[user.role]?.includes(perm));
  const value = { user, signIn, signOut, can };
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
    title: "تسجيل الدخول",
    subtitle: "دخول آمن بصلاحيات واضحة — RBAC",
    email: "البريد الإلكتروني",
    pass: "كلمة المرور",
    role: "الدور",
    roles: [
      { value: ROLES.AUTHORITY, label: "جهة اعتماد" },
      { value: ROLES.CONSULTANT, label: "استشاري" },
      { value: ROLES.CLIENT, label: "عميل" },
    ],
    remember: "تذكرني",
    forgot: "نسيت كلمة المرور؟",
    submit: "دخول",
    invalidEmail: "صيغة البريد غير صحيحة",
    required: "جميع الحقول مطلوبة",
    ok: "تم تسجيل الدخول (تجريبي)",
    youAre: "تم تسجيل الدخول كـ",
    yourPerms: "صلاحياتك:",
    signOut: "خروج",
    ssoHint: "دعم الدخول الحكومي (نفاذ/Keycloak) لاحقًا",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Sign in",
    subtitle: "Secure access with clear roles — RBAC",
    email: "Email",
    pass: "Password",
    role: "Role",
    roles: [
      { value: ROLES.AUTHORITY, label: "Authority" },
      { value: ROLES.CONSULTANT, label: "Consultant" },
      { value: ROLES.CLIENT, label: "Client" },
    ],
    remember: "Remember me",
    forgot: "Forgot password?",
    submit: "Sign in",
    invalidEmail: "Invalid email format",
    required: "All fields are required",
    ok: "Signed in (demo)",
    youAre: "Signed in as",
    yourPerms: "Your permissions:",
    signOut: "Sign out",
    ssoHint: "Gov SSO (Nafath/Keycloak) coming soon",
  },
};

// ——————————————————
// Self-tests badge (runtime)
// ——————————————————
function DevTestsBadge({ t }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.brand && !!t.title && !!t.email && !!t.pass });
  const hasRbac = PERMISSIONS[ROLES.AUTHORITY].includes("accredit.sign") && !PERMISSIONS[ROLES.CLIENT].includes("accredit.sign");
  tests.push({ name: "rbac rules", pass: hasRbac });
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test("a@b.com");
  tests.push({ name: "email regex", pass: emailOk });
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
// Screen 01 — Login
// ——————————————————
function LoginScreen({ lang, setLang }){
  const t = useMemo(()=> T[lang], [lang]);
  const rtl = lang === "ar";
  const { user, signIn, signOut } = useAuth();

  // form state
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState(ROLES.CONSULTANT);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function onSubmit(e){
    e.preventDefault(); setErr(""); setOk(false);
    if (!email || !pass || !role) { setErr(t.required); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(t.invalidEmail); return; }
    // success (demo)
    signIn({ email, role });
    setOk(true);
  }

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
      {/* Topbar */}
      <header className="px-6 md:px-10 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
                <p className="text-[12px] text-slate-600 mt-1 flex items-center gap-1">
                  {t.subtitle} <KeyRound className="w-4 h-4"/> <span className="ms-1">· {t.ssoHint}</span>
                </p>
              </div>
              {user ? (
                <div className="text-[12px] text-slate-600">
                  <div>{t.youAre} <span className="font-medium text-slate-900">{user.email}</span></div>
                  <div className="mt-1">{t.yourPerms}</div>
                  <ul className="list-disc ms-5">
                    {PERMISSIONS[user.role].map((p)=> (<li key={p}>{p}</li>))}
                  </ul>
                  <div className="mt-2"><Button variant="outline" onClick={signOut}>{t.signOut}</Button></div>
                </div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5 mt-6" noValidate>
              <Field label={t.email}>
                <Input value={email} onChange={(e)=>setEmail(e.target.value)} icon={Mail} inputMode="email" autoComplete="username" placeholder="name@example.com" />
              </Field>
              <Field label={t.pass}>
                <Input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} icon={Lock} autoComplete="current-password" placeholder={rtl? "••••••••" : "••••••••"} />
              </Field>
              <Field label={t.role}>
                <Select value={role} onChange={(e)=>setRole(e.target.value)} options={t.roles} aria-label={t.role} />
              </Field>

              <div className="flex items-start gap-2">
                <input id="remember" type="checkbox" className="mt-1" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                <label htmlFor="remember" className="text-[12px] text-slate-700 cursor-pointer">{t.remember}</label>
              </div>

              <div className="md:col-span-2 flex items-center justify-between text-[12px]">
                <a className="text-slate-600 hover:text-slate-900" href="#reset">{t.forgot}</a>
                <Button type="submit"><LogIn className="w-4 h-4"/> {t.submit}</Button>
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
export default function Sima_Screen01_Login() {
  const [lang, setLang] = useState("ar");
  return (
    <AuthProvider>
      <LoginScreen lang={lang} setLang={setLang} />
    </AuthProvider>
  );
}
