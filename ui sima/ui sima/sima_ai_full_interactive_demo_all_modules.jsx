import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Shield, ArrowRight, PlayCircle, CheckCircle2, Compass, Cog, Brain, Box, Feather,
  FileCheck2, Mic, Radio, Map, Languages, User, Building2, Network, Cpu, SunMedium,
  LineChart, Layers3, Users, FileText, KeyRound, Scan, Activity, Leaf, RefreshCw
} from "lucide-react";

/**
 * Sima AI — Full Interactive Demo (All Modules)
 * ------------------------------------------------
 * Single-file, Arabic-first (RTL) interactive demo that simulates the entire Sima AI product:
 * - Marketing site
 * - Auth (Register/Login/Profile) — simulated
 * - App shell with ALL modules (Projects, AI, Studio 3D, Atlas, Accreditation, Dashboards)
 * - Live IoT simulator, Solar & Lifecycle sims, Certification preview with QR placeholder
 *
 * NOTE: This is a front-end demo with mocked services. Replace the `api` object methods
 * with real endpoints later. No external libs besides lucide-react and Tailwind assumed.
 */

// ========== UI PRIMITIVES ==========
const Button = ({ children, className = "", variant = "solid", ...props }) => (
  <button
    className={
      "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition " +
      (variant === "solid"
        ? "bg-slate-900 text-white hover:bg-slate-700 "
        : variant === "outline"
        ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
        : variant === "glass"
        ? "backdrop-blur bg-white/60 text-slate-900 border border-white/60 hover:bg-white/80 "
        : "") +
      className
    }
    {...props}
  >
    {children}
  </button>
);
const Card = ({ className = "", children }) => (
  <div className={"rounded-3xl border border-slate-200 bg-white/70 backdrop-blur shadow-sm " + className}>{children}</div>
);
const Input = ({ className = "", ...props }) => (
  <input className={"w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 " + className} {...props} />
);
const Label = ({ children }) => (<div className="text-xs text-slate-500 mb-1">{children}</div>);
const Slider = ({ value, onChange, min=0, max=100, step=1 }) => (
  <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} />
);

// ========== MOCKED API ==========
const seededRand = (seed) => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };
const api = {
  login: async ({ email, password, role }) => ({ ok: !!email && !!password, role }),
  register: async (payload) => ({ ok: true, userId: Math.floor(Math.random()*99999) }),
  listProjects: async () => ([
    { id: "p1", name:"محطة نقل حضري", city:"الرياض", scope:"عام", style:"نجدي", score:82, status:"قيد المراجعة", updated:"2025-10-15" },
    { id: "p2", name:"مركز ثقافي", city:"جدة", scope:"ثقافي", style:"حجازي", score:90, status:"PASS", updated:"2025-10-10" },
  ]),
  createProject: async (data) => ({ id: "p"+Math.floor(Math.random()*1000), ...data, score: 0, status:"جديد", updated: new Date().toISOString().slice(0,10) }),
  evaluate: async ({ desc, style, climate }) => {
    // simple scoring heuristic
    const base = 60 + Math.min(20, (desc?.length||0)/20);
    const styleBonus = style === "نجدي" ? 8 : style === "حجازي" ? 6 : style === "جنوبي" ? 5 : 4;
    const climateBonus = climate === "جاف" ? 7 : climate === "رطب" ? 4 : 5;
    const idScore = Math.min(100, Math.round(base + styleBonus));
    const climateScore = Math.min(100, Math.round(base - 10 + climateBonus));
    const humanScore = Math.min(100, Math.round(base - 5));
    const funcScore = Math.min(100, Math.round(base + 3));
    const composite = Math.round(0.35*idScore + 0.25*climateScore + 0.2*humanScore + 0.2*funcScore);
    const verdict = composite >= 85 ? "PASS" : composite >= 70 ? "UNDER REVIEW" : "FAIL";
    const rows = [
      { ref:"1.2.3", proj:"تدرّج ظلال الواجهات الشرقية", score: idScore, note: idScore>80?"مطابق":"تحسين التناسب"},
      { ref:"4.1.5", proj:"نِسب فتحات التهوية", score: humanScore, note: humanScore>75?"جيد":"زيادة التهوية"},
      { ref:"2.3.1", proj:"ملائمة المواد المحلية", score: climateScore, note: climateScore>75?"ملائم":"مادة بديلة"},
      { ref:"3.4.2", proj:"انسيابية الحركة", score: funcScore, note: funcScore>75?"فعال":"تحسين المسارات"},
    ];
    const recos = [
      style === "نجدي" ? "زيادة سمك المقرنصات بواجهة الجنوب" : "تخفيف الزخرفة الأمامية",
      climate === "جاف" ? "تظليل إضافي في الغرب والجنوب" : "استخدام مظلات قابلة للفتح",
      "تحسين نسبة WWR إلى 35% في الواجهات الحارة",
    ];
    return { verdict, composite, idScore, climateScore, humanScore, funcScore, rows, recos };
  },
  iotLatest: (pid) => ({ temp: 28 + Math.random()*4, rh: 35 + Math.random()*15, lux: 400 + Math.random()*200 }),
  lifecycle: (seed=1) => {
    // returns series for 10 years: energy, water, materials
    const years = Array.from({length: 10}, (_,i)=> i+1);
    const energy = years.map((y)=> 100 - Math.round(seededRand(seed+y)*30));
    const water = years.map((y)=> 100 - Math.round(seededRand(seed*2+y)*25));
    const materials = years.map((y)=> 100 - Math.round(seededRand(seed*3+y)*20));
    return { years, energy, water, materials };
  },
};

// ========== APP SHELL ==========
const NAV = [
  { id: "home", label: "الرئيسية" },
  { id: "about", label: "عن المشروع" },
  { id: "features", label: "المميزات" },
  { id: "ai", label: "الذكاء والبحث" },
  { id: "atlas", label: "المدن والهوية" },
  { id: "accred", label: "الشهادة" },
  { id: "innovation", label: "الابتكار" },
  { id: "field", label: "التطبيق الميداني" },
  { id: "contact", label: "اتصال" },
];

export default function SimaAIDemoFull(){
  const [route, setRoute] = useState("home");
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState("consultant"); // authority | consultant | client
  const [profile, setProfile] = useState({ name: "", org: "", license: "" });

  return (
    <div dir="rtl" className="min-h-screen w-full bg-[#f6f9ff] text-slate-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <Topbar active={route} onNav={setRoute} authed={authed} onLogout={()=>setAuthed(false)} />

        {/* Marketing */}
        {route === 'home' && <Home goAuth={()=>setRoute('login')} />}
        {route === 'about' && <About />}
        {route === 'features' && <FeaturesGrid />}
        {route === 'ai' && <AIResearch />}
        {route === 'atlas' && <CityAtlasMarketing />}
        {route === 'accred' && <AccreditationMarketing />}
        {route === 'innovation' && <Innovation />}
        {route === 'field' && <FieldMarketing />}
        {route === 'contact' && <Contact />}

        {/* Auth */}
        {route === 'register' && <Register onDone={()=>setRoute('login')} />}
        {route === 'login' && <Login onLogin={async (pickedRole, creds)=>{
          const res = await api.login({ ...creds, role: pickedRole });
          if (res.ok) { setRole(pickedRole); setAuthed(true); setRoute('app-dashboard'); }
        }} />}
        {route === 'profile' && <Profile role={role} profile={profile} setProfile={setProfile} />}

        {/* App (Protected) */}
        {route.startsWith('app-') && authed && (
          <AppShell active={route} setActive={setRoute} role={role} />
        )}

        <div className="text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI • Full Interactive Demo • RTL • All modules mocked</div>
      </div>
    </div>
  );
}

function Topbar({ active, onNav, authed, onLogout }){
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center"><Shield className="w-5 h-5 text-white"/></div>
        <div className="font-semibold text-slate-900">Sima AI — الذكاء المعماري السعودي</div>
      </div>
      <div className="hidden md:flex items-center gap-1">
        {NAV.map(n => (
          <button key={n.id} onClick={()=>onNav(n.id)} className={`px-3 py-2 rounded-xl text-sm ${active===n.id? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{n.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {!authed ? (
          <>
            <Button variant="outline" onClick={()=>onNav('register')}>تسجيل</Button>
            <Button onClick={()=>onNav('login')}>دخول</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={()=>onNav('profile')}>الملف الشخصي</Button>
            <Button onClick={onLogout}>خروج</Button>
          </>
        )}
      </div>
    </div>
  );
}

// ========== MARKETING ==========
function Section({ title, children, className = "" }){
  return (
    <section className={"rounded-[28px] border border-slate-200 bg-white/70 backdrop-blur p-6 md:p-10 " + className}>
      {title && <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-4">{title}</h2>}
      {children}
    </section>
  );
}

function Home({ goAuth }){
  const tags = [
    "من الفكرة إلى الاعتماد… بذكاء سعودي.",
    "العمارة التي تفهم مدينتك.",
    "هوية رقمية… توازن بين الأصالة والابتكار.",
  ];
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#eef5ff] via-[#f5f8ff] to-white text-slate-900 p-8 md:p-12 border border-slate-200 shadow-lg">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-blue-200/40 blur-3xl rounded-full" />
        <div className="absolute -left-28 -bottom-28 w-72 h-72 bg-indigo-200/30 blur-3xl rounded-full" />
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-[40px] font-semibold leading-tight">أول نظام ذكي لتقييم وتصميم واعتماد العمارة السعودية وفق الموجهات الوطنية للهوية.</h1>
            <ul className="mt-4 space-y-1 text-slate-700">
              {tags.map((x,i)=>(<li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/><span>{x}</span></li>))}
            </ul>
            <div className="flex gap-3 mt-6">
              <Button onClick={goAuth}>ابدأ التجربة <ArrowRight className="w-4 h-4 ms-2"/></Button>
              <Button variant="glass"><PlayCircle className="w-4 h-4 ms-2"/> عرض موجز</Button>
            </div>
          </div>
          <div className="relative rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[280px] grid place-items-center animate-pulse">
            <span className="text-slate-500 text-sm">مشهد ثلاثي الأبعاد/مدينة — Placeholder (Canvas لاحقًا)</span>
          </div>
        </div>
      </section>

      <Section title="ما هو Sima AI؟">
        <p className="text-slate-700 leading-relaxed">منصة وطنية ذكية تُقيّم المشاريع المعمارية تلقائيًا، تراجع المخططات، تحاكي التصميم، وتصدر شهادة الاعتماد وفق موجهات العمارة السعودية.</p>
      </Section>

      <Section title="الميزات الرئيسة">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { t: "مراجعة ذكية للمخططات", Icon: Cog },
            { t: "مطابقة الهوية السعودية", Icon: Compass },
            { t: "ذكاء اصطناعي متعلّم", Icon: Brain },
            { t: "استوديو ثلاثي الأبعاد تفاعلي", Icon: Box },
            { t: "توصيات تصميم حيّة", Icon: Feather },
            { t: "شهادة PASS / FAIL معتمدة", Icon: FileCheck2 },
            { t: "مساعد صوتي معماري", Icon: Mic },
            { t: "حساسات IoT وتحليل بيئي", Icon: Radio },
          ].map((g,i)=> (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 font-medium text-slate-900"><g.Icon className="w-4 h-4"/> {g.t}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="رؤية المشروع">
        <p className="text-slate-700 leading-relaxed">تحويل العمارة السعودية من ممارسة فنية إلى علم رقمي ذكي يعزز الهوية ويرفع جودة البيئة العمرانية في كل مدينة.</p>
      </Section>

      <div className="text-center">
        <a href="#" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-3 text-sm hover:bg-slate-700">
          جرّب المنصة <ArrowRight className="w-4 h-4"/>
        </a>
      </div>
    </div>
  );
}

function About(){
  const idea = [
    "بدأت المبادرة من رؤية المملكة 2030، ضمن محور جودة الحياة.",
    "بالتعاون مع هيئة العمارة والتصميم، تم تطوير Sima AI ليكون المرجع الوطني الذكي للمراجعة المعمارية.",
  ];
  const goals = [
    "تعزيز الهوية المعمارية السعودية.",
    "رفع كفاءة الاعتماد والمراجعة.",
    "تمكين المكاتب المحلية بالذكاء الوطني.",
    "بناء قاعدة بيانات للعمارة السعودية الحديثة.",
  ];
  return (
    <Section title="نظام وطني يترجم موجهات العمارة السعودية إلى ذكاء حي">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-slate-900 font-medium mb-2">الفكرة</div>
          <ul className="space-y-2 text-slate-700 text-sm">{idea.map((x,i)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> <span>{x}</span></li>))}</ul>
          <div className="text-slate-900 font-medium mt-4 mb-2">الأهداف</div>
          <ol className="list-decimal list-inside text-slate-700 text-sm space-y-1">{goals.map((x,i)=>(<li key={i}>{x}</li>))}</ol>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[220px] grid place-items-center text-slate-500 text-sm">
          خريطة المملكة بإضاءة ديناميكية توضّح اختلاف الطرز: نجدي، حجازي، جنوبي، شرقي.
        </div>
      </div>
    </Section>
  );
}

function FeaturesGrid(){
  const items = [
    { title: "التحليل الذكي للمشاريع", body: "يرفع المشروع، فيقرأ النظام المخططات والنصوص والبيانات، ثم يقيّم التوافق مع الموجهات بندًا بندًا." },
    { title: "الاستوديو ثلاثي الأبعاد والمحاكاة", body: "محاكاة فورية للبيئة السعودية (الشمس، الظل، المواد، التهوية)، مع WebXR لتجربة الواقع الافتراضي." },
    { title: "المساعد المعماري الصوتي", body: "يتفاعل مع المصمم بالعربية: \"هل هذا التصميم مناسب لمناخ نجران؟\" فيرد بالتحليل والتوصية." },
    { title: "تحليل البيانات في الزمن الحقيقي (IoT)", body: "يربط المشاريع بالحساسات الميدانية ويقيس الأداء فعليًا. من الورق إلى الواقع." },
    { title: "نظام الاعتماد الإلكتروني", body: "مسار رقمي متكامل من المراجعة إلى لجنة الاعتماد والتوقيع الإلكتروني." },
    { title: "مكتبة المدن الذكية", body: "خرائط تفاعلية تُظهر مؤشرات العمارة في كل مدينة سعودية. (نسب النجاح – الطرز – المواد – التوجهات البيئية)" },
  ];
  return (
    <div className="space-y-4">
      {items.map((f,i)=> (
        <Section key={i} title={f.title}>
          <p className="text-slate-700 leading-relaxed">{f.body}</p>
        </Section>
      ))}
    </div>
  );
}

function AIResearch(){
  const paras = [
    "يعتمد النظام على قاعدة بيانات تضم آلاف البنود من أدلة العمارة السعودية.",
    "يستخدم تقنيات تحليل اللغة العربية والهندسة المعمارية معًا.",
    "يطوّر نموذج \"الهوية الرقمية المعمارية\" Digital Architectural Identity.",
  ];
  return (
    <div className="space-y-8">
      <Section title="ذكاء معماري يتعلّم من السعودية">
        <ul className="space-y-2 text-slate-700">{paras.map((x,i)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600"/> <span>{x}</span></li>))}</ul>
      </Section>
      <Section title="الدورة البحثية">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 grid place-items-center text-slate-600 text-sm">
          إدخال مشروع → تحليل → مطابقة → توصيات → إعادة تعلم → تحسين الذكاء
        </div>
      </Section>
    </div>
  );
}

function CityAtlasMarketing(){
  const bullets = [
    "عرض المدن مع معدل التوافق المعماري (%).",
    "مقارنة بين الطرز (نجدي، حجازي، شرقي، جنوبي).",
    "مؤشرات المناخ والاستدامة.",
    "روابط لعرض مشاريع المدينة في الاستوديو.",
  ];
  return (
    <Section title="أطلس المدن والهوية">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[260px] grid place-items-center text-slate-500 text-sm">
          خريطة المملكة (placeholder) — تفاعل، نسب التوافق، والطُرز
        </div>
        <ul className="space-y-2 text-slate-700 text-sm">{bullets.map((b,i)=>(<li key={i} className="flex gap-2"><Map className="w-4 h-4 text-blue-600"/> <span>{b}</span></li>))}</ul>
      </div>
    </Section>
  );
}

function AccreditationMarketing(){
  const steps = ["رفع المشروع.","تحليل وتقييم تلقائي.","لجنة المراجعة الذكية.","التوقيع الإلكتروني.","إصدار شهادة PASS / FAIL."];
  return (
    <Section title="منصة اعتماد رقمية للعمارة السعودية">
      <ol className="list-decimal list-inside text-slate-700 space-y-1">{steps.map((s,i)=>(<li key={i}>{s}</li>))}</ol>
      <div className="mt-4"><Button><FileCheck2 className="w-4 h-4 ms-2"/> تنزيل نموذج شهادة النجاح</Button></div>
    </Section>
  );
}

function Innovation(){
  const lines = [
    "أول نظام ذكاء معماري ثقافي في العالم.",
    "يدمج بين الهوية، المناخ، والمحاكاة.",
    "قابل للتسجيل كبراءة اختراع في WIPO وUSPTO.",
    "يؤسس لمجال علمي جديد: \"الذكاء المعماري الثقافي\".",
  ];
  const circles = ["ذكاء اصطناعي", "هوية", "استدامة", "مدن ذكية"];
  return (
    <div className="space-y-8">
      <Section title="اختراع سعودي… من الفكرة إلى براءة عالمية">
        <ul className="space-y-2 text-slate-700">{lines.map((x,i)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-violet-600"/> <span>{x}</span></li>))}</ul>
      </Section>
      <Section title="رسم توضيحي">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{circles.map((c,i)=>(<div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 text-center font-medium text-slate-900">{c}</div>))}</div>
      </Section>
    </div>
  );
}

function FieldMarketing(){
  const bullets = [
    "للمفتشين والمراجعين في الميدان.",
    "تصوير المبنى وتحليل تطابقه مع المخطط عبر الواقع المعزز.",
    "إرسال الملاحظات مباشرة إلى لوحة الاعتماد.",
  ];
  return (
    <Section title="التطبيق الميداني">
      <div className="grid md:grid-cols-2 gap-6">
        <ul className="space-y-2 text-slate-700 text-sm">{bullets.map((b,i)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> <span>{b}</span></li>))}</ul>
        <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[220px] grid place-items-center text-slate-500 text-sm">صورة واجهة تطبيق الهاتف (placeholder)</div>
      </div>
    </Section>
  );
}

function Contact(){
  const social = [ { label:"X", href:"#" }, { label:"LinkedIn", href:"#" }, { label:"YouTube", href:"#" } ];
  return (
    <Section title="الاتصال والشراكات">
      <div className="grid md:grid-cols-2 gap-6">
        <form className="space-y-3">
          <div><Label>الاسم الكامل</Label><Input placeholder="الاسم الكامل"/></div>
          <div><Label>البريد الإلكتروني</Label><Input placeholder="email@example.com" type="email"/></div>
          <div><Label>رسالتك</Label><textarea className="w-full rounded-2xl border border-slate-300 p-3 text-sm" rows={4} placeholder="رسالتك"/></div>
          <Button>إرسال</Button>
        </form>
        <div className="space-y-3">
          <div className="text-sm text-slate-700"><span className="font-medium">البريد الرسمي:</span> contact@sima.sa</div>
          <div className="flex items-center gap-3 text-sm">{social.map((s,i)=>(<a key={i} href={s.href} className="underline text-slate-600 hover:text-slate-900">{s.label}</a>))}</div>
        </div>
      </div>
    </Section>
  );
}

// ========== AUTH ==========
function Register({ onDone }){
  const [payload, setPayload] = useState({ role:"consultant", name:"", email:"", city:"", org:"", license:"", pass:"", agree:false });
  const set = (k,v)=> setPayload(p=>({...p,[k]:v}));
  return (
    <Section title="إنشاء حساب — الهوية الرقمية">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <Label>الفئة</Label>
            <select className="w-full rounded-2xl border border-slate-300 p-2 text-sm" value={payload.role} onChange={e=>set('role', e.target.value)}>
              <option value="authority">جهة اعتماد</option>
              <option value="consultant">استشاري</option>
              <option value="client">عميل</option>
            </select>
          </div>
          <div><Label>الاسم</Label><Input placeholder="الاسم" onChange={e=>set('name',e.target.value)}/></div>
          <div><Label>البريد</Label><Input placeholder="email@example.com" type="email" onChange={e=>set('email',e.target.value)}/></div>
          <div><Label>المدينة</Label><Input placeholder="الرياض" onChange={e=>set('city',e.target.value)}/></div>
          <div><Label>الجهة</Label><Input placeholder="اسم الجهة" onChange={e=>set('org',e.target.value)}/></div>
          <div><Label>نوع الترخيص</Label><Input placeholder="رقم/نوع الترخيص" onChange={e=>set('license',e.target.value)}/></div>
          <div><Label>كلمة المرور</Label><Input placeholder="••••••••" type="password" onChange={e=>set('pass',e.target.value)}/></div>
          <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="rounded" onChange={e=>set('agree', e.target.checked)}/> أوافق على الشروط وسياسة الخصوصية</label>
          <div className="flex gap-2">
            <Button onClick={async ()=>{ const r=await api.register(payload); if(r.ok) onDone(); }}>إنشاء الحساب</Button>
            <Button variant="outline">تحقق من البريد</Button>
          </div>
          <div className="text-xs text-slate-500">مصادقة حكومية عبر "نفاذ" (مستقبلاً).</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[220px] grid place-items-center text-slate-500 text-sm">ملاحظات التسجيل / تعليمات الهوية</div>
      </div>
    </Section>
  );
}

function Login({ onLogin }){
  const [pickedRole, setPickedRole] = useState("consultant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <Section title="تسجيل الدخول">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <Label>الدور (للمعاينة)</Label>
            <select className="w-full rounded-2xl border border-slate-300 p-2 text-sm" value={pickedRole} onChange={e=>setPickedRole(e.target.value)}>
              <option value="authority">جهة اعتماد</option>
              <option value="consultant">استشاري</option>
              <option value="client">عميل</option>
            </select>
          </div>
          <div><Label>البريد</Label><Input placeholder="email@example.com" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div><Label>كلمة المرور</Label><Input placeholder="••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
          <div className="flex gap-2"><Button onClick={()=>onLogin(pickedRole, {email, password})}>تسجيل الدخول</Button><Button variant="outline">نسيت كلمة المرور</Button></div>
          <div className="text-xs text-slate-500">كشف النشاطات غير المصرّح بها (محاكاة).</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[220px] grid place-items-center text-slate-500 text-sm">سياسة الخصوصية وإرشادات الأمان</div>
      </div>
    </Section>
  );
}

function Profile({ role, profile, setProfile }){
  const set = (k,v)=> setProfile(p=>({...p,[k]:v}));
  return (
    <Section title="الملف الشخصي">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>الاسم</Label><Input placeholder="اسم المستخدم" value={profile.name} onChange={e=>set('name',e.target.value)}/>
          <Label>الجهة</Label><Input placeholder="الجهة" value={profile.org} onChange={e=>set('org',e.target.value)}/>
          <Label>رقم الترخيص</Label><Input placeholder="000-000" value={profile.license} onChange={e=>set('license',e.target.value)}/>
          <div className="text-xs text-slate-500">الدور الحالي: {role}</div>
        </div>
        <div className="space-y-2">
          <div className="font-medium">الإشعارات</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox"/> بريد أسبوعي</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox"/> تنبيهات فورية</label>
        </div>
        <div className="space-y-2">
          <div className="font-medium">آخر المشاريع</div>
          <ul className="text-sm list-disc list-inside text-slate-600 space-y-1">
            <li>مشروع محطة نقل حضري — قيد المراجعة</li>
            <li>مركز ثقافي — PASS</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ========== APP SHELL (PROTECTED) ==========
function AppShell({ active, setActive, role }){
  const goto = (slug) => setActive(slug);
  return (
    <div className="rounded-[28px] overflow-hidden border bg-white/60 backdrop-blur">
      <div className="grid grid-cols-[260px_1fr] min-h-[620px]">
        <aside className="border-l p-4 space-y-4 bg-white/70">
          <div className="font-bold">لوحة العمل</div>
          <NavLink label="الداشبورد" id="app-dashboard" active={active} onClick={()=>goto('app-dashboard')} icon={<Activity className="w-4 h-4"/>} />
          <div className="text-xs text-slate-500 mt-2">إدارة المشاريع</div>
          <NavLink label="قائمة المشاريع" id="app-projects" active={active} onClick={()=>goto('app-projects')} icon={<Building2 className="w-4 h-4"/>} />
          <NavLink label="تفاصيل مشروع" id="app-project" active={active} onClick={()=>goto('app-project')} icon={<FileText className="w-4 h-4"/>} />
          <NavLink label="إدارة الفرق" id="app-team" active={active} onClick={()=>goto('app-team')} icon={<Users className="w-4 h-4"/>} />
          <NavLink label="سجل النشاط" id="app-audit" active={active} onClick={()=>goto('app-audit')} icon={<KeyRound className="w-4 h-4"/>} />
          <div className="text-xs text-slate-500 mt-2">الذكاء والتحليل</div>
          <NavLink label="التحليل الذكي" id="app-ai-eval" active={active} onClick={()=>goto('app-ai-eval')} icon={<Cpu className="w-4 h-4"/>} />
          <NavLink label="التقرير التفصيلي" id="app-ai-report" active={active} onClick={()=>goto('app-ai-report')} icon={<Scan className="w-4 h-4"/>} />
          <NavLink label="التوصيات الذكية" id="app-ai-reco" active={active} onClick={()=>goto('app-ai-reco')} icon={<Brain className="w-4 h-4"/>} />
          <div className="text-xs text-slate-500 mt-2">الاستوديو والمحاكاة</div>
          <NavLink label="استوديو 3D" id="app-3d" active={active} onClick={()=>goto('app-3d')} icon={<Layers3 className="w-4 h-4"/>} />
          <NavLink label="محاكاة الشمس والظل" id="app-solar" active={active} onClick={()=>goto('app-solar')} icon={<SunMedium className="w-4 h-4"/>} />
          <NavLink label="محاكاة الاستدامة" id="app-life" active={active} onClick={()=>goto('app-life')} icon={<LineChart className="w-4 h-4"/>} />
          <div className="text-xs text-slate-500 mt-2">المدن والهوية</div>
          <NavLink label="أطلس المدن" id="app-cities" active={active} onClick={()=>goto('app-cities')} icon={<Map className="w-4 h-4"/>} />
          <div className="text-xs text-slate-500 mt-2">الاعتماد والتقارير</div>
          <NavLink label="مسار الاعتماد" id="app-workflow" active={active} onClick={()=>goto('app-workflow')} icon={<Network className="w-4 h-4"/>} />
          <NavLink label="التوقيع الإلكتروني" id="app-sign" active={active} onClick={()=>goto('app-sign')} icon={<FileCheck2 className="w-4 h-4"/>} />
          <NavLink label="الشهادة" id="app-cert" active={active} onClick={()=>goto('app-cert')} icon={<Shield className="w-4 h-4"/>} />
          <NavLink label="إعادة التقييم" id="app-reeval" active={active} onClick={()=>goto('app-reeval')} icon={<RefreshCw className="w-4 h-4"/>} />
          <div className="text-xs text-slate-500 mt-2">لوحات التحكم</div>
          <NavLink label="الجهات" id="app-dash-authority" active={active} onClick={()=>goto('app-dash-authority')} icon={<Shield className="w-4 h-4"/>} />
          <NavLink label="الاستشاريون" id="app-dash-consult" active={active} onClick={()=>goto('app-dash-consult')} icon={<User className="w-4 h-4"/>} />
          <NavLink label="الأداء الذكي" id="app-dash-ai" active={active} onClick={()=>goto('app-dash-ai')} icon={<Cpu className="w-4 h-4"/>} />
          <NavLink label="المدن" id="app-dash-cities" active={active} onClick={()=>goto('app-dash-cities')} icon={<Map className="w-4 h-4"/>} />
          <NavLink label="IoT" id="app-dash-iot" active={active} onClick={()=>goto('app-dash-iot')} icon={<Radio className="w-4 h-4"/>} />
          <NavLink label="الاستدامة" id="app-dash-sus" active={active} onClick={()=>goto('app-dash-sus')} icon={<Leaf className="w-4 h-4"/>} />
          <NavLink label="المراجعات" id="app-dash-reviews" active={active} onClick={()=>goto('app-dash-reviews')} icon={<FileText className="w-4 h-4"/>} />
          <NavLink label="النظام والإدارة" id="app-dash-system" active={active} onClick={()=>goto('app-dash-system')} icon={<Cog className="w-4 h-4"/>} />
        </aside>
        <main className="p-6 space-y-6">
          <ProtectedHeader onProfile={()=>setActive('profile')} role={role} />
          {active === 'app-dashboard' && <Dashboard role={role} />}
          {active === 'app-projects' && <ProjectsList />}
          {active === 'app-project' && <ProjectOverview />}
          {active === 'app-team' && <TeamManagement />}
          {active === 'app-audit' && <AuditLog />}

          {active === 'app-ai-eval' && <AIEval />}
          {active === 'app-ai-report' && <AIReport />}
          {active === 'app-ai-reco' && <AIReco />}

          {active === 'app-3d' && <Studio3D />}
          {active === 'app-solar' && <SolarSim />}
          {active === 'app-life' && <LifecycleSim />}

          {active === 'app-cities' && <CitiesAtlasApp />}

          {active === 'app-workflow' && <WorkflowEngine />}
          {active === 'app-sign' && <ESign />}
          {active === 'app-cert' && <Certification />}
          {active === 'app-reeval' && <ReEvaluation />}

          {active === 'app-dash-authority' && <DashAuthority />}
          {active === 'app-dash-consult' && <DashConsultants />}
          {active === 'app-dash-ai' && <DashAI />}
          {active === 'app-dash-cities' && <DashCities />}
          {active === 'app-dash-iot' && <DashIoT />}
          {active === 'app-dash-sus' && <DashSustainability />}
          {active === 'app-dash-reviews' && <DashReviews />}
          {active === 'app-dash-system' && <DashSystem />}
        </main>
      </div>
    </div>
  );
}

function NavLink({ label, id, active, onClick, icon }){
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm ${active===id? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
      <span>{label}</span>
      <span className="opacity-70">{icon}</span>
    </button>
  );
}

function ProtectedHeader({ onProfile, role }){
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-slate-600">الدور الحالي: <span className="font-medium text-slate-900">{role}</span></div>
      <Button variant="outline" onClick={onProfile}>الملف الشخصي</Button>
    </div>
  );
}

// ========== APP PAGES ==========
function Dashboard({ role }){
  const [iot, setIot] = useState({ temp: 0, rh: 0, lux: 0 });
  useEffect(()=>{
    const t = setInterval(()=> setIot(api.iotLatest("p1")), 1200);
    return ()=> clearInterval(t);
  },[]);
  const cards = [
    { t:"عدد المشاريع", v:"12" },
    { t:"نسبة النجاح", v:"78%" },
    { t:"مدن نشطة", v:"7" },
    { t:"تنبيهات", v:"3" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">داشبورد — {role === 'authority' ? 'جهة اعتماد' : role === 'consultant' ? 'استشاري' : 'عميل'}</div>
      <div className="grid md:grid-cols-4 gap-4">
        {cards.map((c,i)=>(<Card key={i} className="p-5"><div className="text-xs text-slate-500">{c.t}</div><div className="text-xl font-semibold text-slate-900">{c.v}</div></Card>))}
      </div>
      <Card className="p-5">
        <div className="font-medium mb-2">قراءات IoT (تحديث لحظي)</div>
        <div className="grid grid-cols-3 text-sm">
          <div>الحرارة: <span className="font-medium">{iot.temp.toFixed(1)}°C</span></div>
          <div>الرطوبة: <span className="font-medium">{iot.rh.toFixed(0)}%</span></div>
          <div>الإضاءة: <span className="font-medium">{iot.lux.toFixed(0)} lx</span></div>
        </div>
      </Card>
    </div>
  );
}

function ProjectsList(){
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name:"", city:"الرياض", scope:"عام", style:"نجدي" });
  const set = (k,v)=> setForm(p=>({...p,[k]:v}));
  useEffect(()=>{ api.listProjects().then(setRows); },[]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">قائمة المشاريع</div>
        <div className="flex gap-2">
          <Input placeholder="بحث…" className="w-40"/>
          <Button onClick={async ()=>{ const created = await api.createProject(form); setRows(r=>[created,...r]) }}>+ مشروع جديد</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-3">
        <div><Label>المدينة</Label><Input value={form.city} onChange={e=>set('city',e.target.value)} /></div>
        <div><Label>النطاق</Label><Input value={form.scope} onChange={e=>set('scope',e.target.value)} /></div>
        <div><Label>الطراز</Label>
          <select value={form.style} onChange={e=>set('style',e.target.value)} className="w-full rounded-2xl border border-slate-300 p-2 text-sm">
            <option>نجدي</option><option>حجازي</option><option>جنوبي</option><option>شرقي</option>
          </select>
        </div>
        <div><Label>الاسم</Label><Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="اسم المشروع"/></div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              {['الاسم','المدينة','النطاق','الطراز','النسبة','الحالة','آخر تحديث'].map((h,i)=>(<th key={i} className="px-3 py-2">{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.city}</td>
                <td className="px-3 py-2">{r.scope}</td>
                <td className="px-3 py-2">{r.style}</td>
                <td className="px-3 py-2">{r.score}%</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectOverview(){
  const [files, setFiles] = useState([]);
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">تفاصيل المشروع</div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5"><div className="text-sm font-medium">موقع المشروع</div><div className="mt-2 text-slate-500 text-sm">خريطة (placeholder)</div></Card>
        <Card className="p-5"><div className="text-sm font-medium">وصف عام</div><div className="mt-2 text-slate-600 text-sm">المساحة، الاستخدام، البيئة المناخية…</div></Card>
      </div>
      <Card className="p-5">
        <div className="text-sm font-medium">الملفات المرفوعة</div>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" onClick={()=>setFiles(f=>[...f, {name:`ملف-${f.length+1}.pdf`, size:(Math.random()*5+1).toFixed(1)+'MB'}])}>رفع ملف</Button>
          <div className="text-xs text-slate-500">يدعم: DWG، IFC، PDF</div>
        </div>
        <ul className="mt-3 text-sm text-slate-700 space-y-1">{files.map((f,i)=>(<li key={i}>• {f.name} — {f.size}</li>))}</ul>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline">تحليل ذكي</Button>
        <Button variant="outline">محاكاة</Button>
        <Button variant="outline">تقرير</Button>
      </div>
    </div>
  );
}

function TeamManagement(){
  const [members, setMembers] = useState([ {n:'م. سارة', r:'مهندس معماري'}, {n:'م. خالد', r:'استشاري'}, {n:'أ. نايف', r:'جهة اعتماد'} ]);
  const add = ()=> setMembers(m=>[...m, {n:`عضو ${m.length+1}`, r:'دور'}]);
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">إدارة الفرق</div>
      <div className="grid md:grid-cols-2 gap-4">
        {members.map((m,i)=>(<Card key={i} className="p-5"><div className="font-medium">{m.n}</div><div className="text-slate-600 text-sm">{m.r}</div></Card>))}
      </div>
      <Button onClick={add}>+ إضافة عضو</Button>
    </div>
  );
}

function AuditLog(){
  const [items, setItems] = useState(["رفع ملف IFC","تعديل وصف المشروع","اعتماد مبدئي"]);
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">سجل النشاط</div>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">{items.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
      <Button variant="outline" onClick={()=>setItems(it=>[...it, "تعليق من اللجنة"]) }>إضافة سجل</Button>
    </div>
  );
}

// ========== AI ==========
function AIEval(){
  const [desc, setDesc] = useState("");
  const [style, setStyle] = useState("نجدي");
  const [climate, setClimate] = useState("جاف");
  const [res, setRes] = useState(null);
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">التحليل الذكي (مقابل موجهات DASC)</div>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <Label>وصف المشروع</Label>
          <textarea rows={5} className="w-full rounded-2xl border border-slate-300 p-3 text-sm" placeholder="الوصف العام، المواد، الوظيفة…" value={desc} onChange={e=>setDesc(e.target.value)} />
        </div>
        <div>
          <Label>الطراز</Label>
          <select className="w-full rounded-2xl border border-slate-300 p-2 text-sm" value={style} onChange={e=>setStyle(e.target.value)}>
            <option>نجدي</option><option>حجازي</option><option>جنوبي</option><option>شرقي</option>
          </select>
          <Label className="mt-3">المناخ</Label>
          <select className="w-full rounded-2xl border border-slate-300 p-2 text-sm" value={climate} onChange={e=>setClimate(e.target.value)}>
            <option>جاف</option><option>رطب</option><option>معتدل</option>
          </select>
        </div>
        <div className="flex items-end"><Button onClick={async ()=> setRes(await api.evaluate({ desc, style, climate }))}>تشغيل التحليل</Button></div>
      </div>
      {res && (
        <>
          <div className="grid md:grid-cols-5 gap-3">
            <Card className="p-5"><div className="text-xs">الحالة</div><div className={`text-xl font-semibold ${res.verdict==='PASS'?'text-emerald-600':res.verdict==='FAIL'?'text-rose-600':'text-amber-600'}`}>{res.verdict}</div></Card>
            <Card className="p-5"><div className="text-xs">النتيجة المركّبة</div><div className="text-xl font-semibold">{res.composite}%</div></Card>
            <Card className="p-5"><div className="text-xs">الهوية</div><div className="text-xl">{res.idScore}%</div></Card>
            <Card className="p-5"><div className="text-xs">المناخ</div><div className="text-xl">{res.climateScore}%</div></Card>
            <Card className="p-5"><div className="text-xs">الإنسان/الوظيفة</div><div className="text-xl">{Math.round((res.humanScore+res.funcScore)/2)}%</div></Card>
          </div>
          <div className="text-sm text-slate-600">ملاحظات: {res.recos.join(" — ")}</div>
        </>
      )}
    </div>
  );
}

function AIReport(){
  const [rows, setRows] = useState(null);
  useEffect(()=>{ (async()=>{ const r = await api.evaluate({desc:'', style:'نجدي', climate:'جاف'}); setRows(r.rows); })(); },[]);
  if(!rows) return <div>... </div>;
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">التقرير التفصيلي</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th className="px-3 py-2">رقم البند</th><th className="px-3 py-2">النص المقابل</th><th className="px-3 py-2">درجة</th><th className="px-3 py-2">تعليق</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t"><td className="px-3 py-2">{r.ref}</td><td className="px-3 py-2">{r.proj}</td><td className="px-3 py-2">{r.score}%</td><td className="px-3 py-2">{r.note}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AIReco(){
  const [res, setRes] = useState(null);
  useEffect(()=>{ (async()=>{ const r= await api.evaluate({desc:'', style:'نجدي', climate:'جاف'}); setRes(r); })(); },[]);
  if(!res) return null;
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">التوصيات الذكية</div>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">{res.recos.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
      <Button variant="outline">إعادة حساب النتيجة</Button>
    </div>
  );
}

// ========== STUDIO ==========
function Studio3D(){
  const [material, setMaterial] = useState("حجر محلي");
  const [wwr, setWwr] = useState(35);
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">استوديو ثلاثي الأبعاد (IFC / glTF)</div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-slate-500 text-sm">Viewer placeholder — ربط لاحقًا بـ three.js / web-ifc-three</div>
          <div className="mt-4 h-64 grid place-items-center">
            <div className="w-40 h-40 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl animate-[spin_12s_linear_infinite]"/>
          </div>
        </Card>
        <Card className="p-5 space-y-3">
          <div>
            <Label>المادة</Label>
            <select className="w-full rounded-2xl border border-slate-300 p-2 text-sm" value={material} onChange={e=>setMaterial(e.target.value)}>
              <option>حجر محلي</option><option>خشب</option><option>طوب</option><option>خرسانة مكشوفة</option>
            </select>
          </div>
          <div>
            <Label>نسبة الفتحات (WWR)</Label>
            <Slider value={wwr} onChange={setWwr} />
            <div className="text-xs text-slate-500">القيمة الحالية: {wwr}%</div>
          </div>
          <div className="text-sm text-slate-600">تلميح: القيم بين 30–40% مناسبة للواجهات الحارة في الغالب.</div>
        </Card>
      </div>
    </div>
  );
}

function SolarSim(){
  const [hour, setHour] = useState(12);
  const sunAngle = useMemo(()=> Math.round(90*Math.sin((Math.PI*hour)/24)), [hour]);
  const shadowPct = Math.max(0, 80 - Math.abs(12-hour)*6); // نموذج مبسّط
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">محاكاة الضوء والظل</div>
      <Card className="p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>الوقت</Label>
            <Slider min={0} max={23} value={hour} onChange={setHour} />
            <div className="text-sm text-slate-600">الساعة: {hour}:00 — زاوية الشمس: {sunAngle}°</div>
          </div>
          <div className="grid place-items-center">
            <div className="w-48 h-24 relative bg-gradient-to-b from-yellow-100 to-amber-100 rounded-xl border">
              <div className="absolute -top-3 -right-3 text-amber-500"><SunMedium/></div>
              <div className="absolute inset-0 grid place-items-center text-xs text-slate-600">ظل تقريبي: {Math.round(shadowPct)}%</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LifecycleSim(){
  const data = useMemo(()=> api.lifecycle(7), []);
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">محاكاة الاستدامة الزمنية (10 سنوات)</div>
      <Card className="p-5">
        <SimpleLine title="الطاقة" values={data.energy} />
        <SimpleLine title="المياه" values={data.water} />
        <SimpleLine title="المواد" values={data.materials} />
      </Card>
    </div>
  );
}

function SimpleLine({ title, values }){
  const W = 300, H = 80; const max = 100; const step = W/(values.length-1);
  const points = values.map((v,i)=> `${i*step},${H - (v/max)*H}`).join(" ");
  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-1">{title}</div>
      <svg width={W} height={H} className="block">
        <polyline fill="none" stroke="#0f172a" strokeWidth="2" points={points} />
      </svg>
    </div>
  );
}

// ========== CITIES ==========
function CitiesAtlasApp(){
  const cities = [
    { n:"الرياض", pass:82, style:"نجدي" },
    { n:"جدة", pass:76, style:"حجازي" },
    { n:"نجران", pass:71, style:"جنوبي" },
    { n:"الدمام", pass:69, style:"شرقي" },
  ];
  const [sel, setSel] = useState(cities[0]);
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">أطلس المدن — لوحة مدينة</div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-2">
            {cities.map((c,i)=>(
              <button key={i} onClick={()=>setSel(c)} className={`rounded-xl border p-3 text-sm ${sel.n===c.n?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
                <div className="font-medium">{c.n}</div>
                <div className="text-xs">الطراز: {c.style} • النجاح: {c.pass}%</div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-medium">مدينة: {sel.n}</div>
          <div className="text-sm text-slate-600">أكثر الطرز استخدامًا: {sel.style} • معدل النجاح: {sel.pass}%</div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <Metric v={`${sel.pass}%`} l="هوية" />
            <Metric v={`${Math.max(50, sel.pass-10)}%`} l="مناخ" />
            <Metric v={`${Math.max(45, sel.pass-15)}%`} l="مواد" />
          </div>
        </Card>
      </div>
    </div>
  );
}
function Metric({ v, l }){ return <div className="rounded-2xl border p-4"><div className="text-xl font-semibold">{v}</div><div className="text-xs text-slate-500">{l}</div></div> }

// ========== ACCREDITATION ==========
function WorkflowEngine(){
  const [step, setStep] = useState(1);
  const next = ()=> setStep(s=> Math.min(4, s+1));
  const prev = ()=> setStep(s=> Math.max(1, s-1));
  const labels = ["المراجعة الآلية","اللجنة الفنية","التوقيع الإلكتروني","الاعتماد النهائي"];
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">مسار الاعتماد</div>
      <div className="flex gap-2 flex-wrap">
        {labels.map((l,i)=>(<div key={i} className={`px-3 py-2 rounded-xl text-sm border ${step===i+1? 'bg-slate-900 text-white':'bg-white'}`}>{i+1}. {l}</div>))}
      </div>
      <div className="text-sm text-slate-600">المرحلة الحالية: {labels[step-1]}</div>
      <div className="flex gap-2"><Button variant="outline" onClick={prev}>السابق</Button><Button onClick={next}>التالي</Button></div>
      <div className="text-xs text-slate-500">يمكن تخصيص المسار حسب نوع المشروع ومتابعة الزمن لكل مرحلة.</div>
    </div>
  );
}

function ESign(){
  const [ready, setReady] = useState(false);
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">التوقيع الإلكتروني</div>
      <div className="text-sm text-slate-600">محاكاة تهيئة جلسة توقيع مع DocuSign/Adobe Sign.</div>
      <div className="flex gap-2">
        <Button onClick={()=>setReady(true)}>بدء جلسة توقيع</Button>
        <Button variant="outline">تحميل وثيقة الاعتماد</Button>
      </div>
      {ready && <div className="text-xs text-emerald-600">تم فتح جلسة افتراضية — (API الحقيقي يربط لاحقًا).</div>}
    </div>
  );
}

function Certification(){
  const [pass, setPass] = useState(true);
  const code = useMemo(()=> Math.random().toString(36).slice(2,10).toUpperCase(), []);
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">الشهادة</div>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">رقم المشروع</div>
            <div className="text-xl font-semibold">SIMA-{code}</div>
            <div className="text-sm mt-2">الحالة: <span className={`font-semibold ${pass?'text-emerald-600':'text-rose-600'}`}>{pass? 'PASS':'FAIL'}</span></div>
          </div>
          <div className="grid place-items-center">
            <div className="w-24 h-24 grid grid-cols-6 grid-rows-6 gap-0.5">
              {Array.from({length:36}).map((_,i)=> <div key={i} className={`w-3 h-3 ${Math.random()>0.5? 'bg-slate-900':'bg-white border'}`}/>) }
            </div>
            <div className="text-[10px] text-slate-500 mt-1">QR (placeholder)</div>
          </div>
        </div>
      </Card>
      <div className="flex gap-2"><Button variant="outline" onClick={()=>setPass(p=>!p)}>تبديل PASS/FAIL</Button><Button><FileCheck2 className="w-4 h-4 ms-2"/> تنزيل الشهادة</Button></div>
    </div>
  );
}

function ReEvaluation(){
  const [delta, setDelta] = useState(0);
  const [result, setResult] = useState(null);
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">إعادة التقييم</div>
      <div className="text-sm text-slate-600">ارفع التعديلات أو غيّر القيمة أدناه لمحاكاة التحسّن:</div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>تحسين افتراضي (%)</Label>
          <Slider value={delta} onChange={setDelta} />
          <div className="text-xs text-slate-500">{delta}%</div>
        </div>
        <div className="flex items-end"><Button onClick={()=> setResult({ before:72, after: Math.min(95, 72 + Math.round(delta*0.6)) })}>إعادة تحليل فوري</Button></div>
      </div>
      {result && <div className="text-sm">النتيجة السابقة: <b>{result.before}%</b> — الحالية: <b>{result.after}%</b></div>}
    </div>
  );
}

// ========== DASHBOARDS ==========
function DashAuthority(){ return <Dash title="لوحة الجهات المعتمدة"/> }
function DashConsultants(){ return <Dash title="لوحة الاستشاريين"/> }
function DashAI(){ return <Dash title="لوحة الأداء الذكي"/> }
function DashCities(){ return <Dash title="لوحة المدن"/> }
function DashIoT(){ return <Dash title="لوحة إنترنت الأشياء"/> }
function DashSustainability(){ return <Dash title="لوحة الاستدامة"/> }
function DashReviews(){ return <Dash title="لوحة المراجعات"/> }
function DashSystem(){ return <Dash title="لوحة النظام والإدارة"/> }
function Dash({ title }){
  const items = [
    { k:'المشاريع', v: 12 },
    { k:'المدن', v: 7 },
    { k:'النجاح', v: 78 },
  ];
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">{title}</div>
      <div className="grid md:grid-cols-3 gap-3">
        {items.map((x,i)=> (
          <Card key={i} className="p-5">
            <div className="text-xs text-slate-500">{x.k}</div>
            <div className="text-xl font-semibold">{x.v}{x.k==='النجاح'? '%': ''}</div>
            <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{width: `${Math.min(100,x.v)}%`}}/></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
