import React, { useMemo, useRef, useState } from "react";
import {
  Shield, ArrowRight, PlayCircle, CheckCircle2, Compass, Cog, Brain, Box, Feather,
  FileCheck2, Mic, Radio, Map, Languages, User, Building2, Network, Cpu, SunMedium,
  LineChart, Layers3, Users, FileText, KeyRound, Scan, Activity
} from "lucide-react";

/**
 * Sima AI — Live Preview (Arabic, RTL)
 * ------------------------------------------------
 * Single-file preview with in-memory routing for: Marketing pages, Auth (Register/Login/Profile),
 * and an App shell (Dashboard + Modules). TailwindCSS expected. lucide-react available.
 *
 * Tip: Use the top nav to switch pages. Click "دخول" then "تسجيل الدخول" لمحاكاة الدخول
 * ثم انتقل إلى /app عبر زر "اذهب إلى لوحة العمل".
 */

// —— UI Primitives ——
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

// —— Router (in-memory) ——
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

export default function SimaLivePreview(){
  const [route, setRoute] = useState("home");
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState("consultant"); // authority | consultant | client
  const go = (r) => setRoute(r);

  return (
    <div dir="rtl" className="min-h-screen w-full bg-[#f6f9ff] text-slate-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <Topbar active={route} onNav={go} authed={authed} onLogout={()=>setAuthed(false)} />

        {/* Marketing pages */}
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
        {route === 'login' && <Login onLogin={(pickedRole)=>{setRole(pickedRole); setAuthed(true); setRoute('app-dashboard');}} />}
        {route === 'profile' && <Profile role={role} />}

        {/* App shell */}
        {route.startsWith('app-') && authed && (
          <AppShell active={route} setActive={setRoute} role={role} />
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI • Live Preview • RTL • Tabs simulate routes</div>
      </div>
    </div>
  );
}

// —— Topbar ——
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

// —— Marketing: Home ——
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
          <div className="relative rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[280px] grid place-items-center">
            <span className="text-slate-500 text-sm">مشهد ثلاثي الأبعاد لمدينة سعودية (placeholder) — يُستبدل لاحقًا بـ Canvas/Model</span>
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
        <a href="https://demo.sima.sa" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-3 text-sm hover:bg-slate-700">
          جرّب المنصة <ArrowRight className="w-4 h-4"/>
        </a>
      </div>
    </div>
  );
}

// —— Marketing: About ——
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

// —— Marketing: Features ——
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

// —— Marketing: AI & Research ——
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

// —— Marketing: City Atlas ——
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

// —— Marketing: Accreditation ——
function AccreditationMarketing(){
  const steps = ["رفع المشروع.","تحليل وتقييم تلقائي.","لجنة المراجعة الذكية.","التوقيع الإلكتروني.","إصدار شهادة PASS / FAIL."];
  return (
    <Section title="منصة اعتماد رقمية للعمارة السعودية">
      <ol className="list-decimal list-inside text-slate-700 space-y-1">{steps.map((s,i)=>(<li key={i}>{s}</li>))}</ol>
      <div className="mt-4"><Button><FileCheck2 className="w-4 h-4 ms-2"/> تنزيل نموذج شهادة النجاح</Button></div>
    </Section>
  );
}

// —— Marketing: Innovation ——
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

// —— Marketing: Field App ——
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

// —— Marketing: Contact ——
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

// —— Auth: Register/Login/Profile ——
function Register({ onDone }){
  const [role, setRole] = useState("consultant");
  return (
    <Section title="إنشاء حساب — الهوية الرقمية">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <Label>الفئة</Label>
            <select className="w-full rounded-2xl border border-slate-300 p-2 text-sm" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="authority">جهة اعتماد</option>
              <option value="consultant">استشاري</option>
              <option value="client">عميل</option>
            </select>
          </div>
          <div><Label>الاسم</Label><Input placeholder="الاسم"/></div>
          <div><Label>البريد</Label><Input placeholder="email@example.com" type="email"/></div>
          <div><Label>المدينة</Label><Input placeholder="الرياض"/></div>
          <div><Label>الجهة</Label><Input placeholder="اسم الجهة"/></div>
          <div><Label>نوع الترخيص</Label><Input placeholder="رقم/نوع الترخيص"/></div>
          <div><Label>كلمة المرور</Label><Input placeholder="••••••••" type="password"/></div>
          <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="rounded"/> أوافق على الشروط وسياسة الخصوصية</label>
          <div className="flex gap-2">
            <Button onClick={onDone}>إنشاء الحساب</Button>
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
          <div><Label>البريد</Label><Input placeholder="email@example.com" type="email"/></div>
          <div><Label>كلمة المرور</Label><Input placeholder="••••••••" type="password"/></div>
          <div className="flex gap-2"><Button onClick={()=>onLogin(pickedRole)}>تسجيل الدخول</Button><Button variant="outline">نسيت كلمة المرور</Button></div>
          <div className="text-xs text-slate-500">كشف النشاطات غير المصرّح بها (placeholder).</div>
          <div className="pt-2"><a className="underline text-sm" href="#" onClick={(e)=>e.preventDefault()}>تسجيل حساب جديد</a></div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[220px] grid place-items-center text-slate-500 text-sm">سياسة الخصوصية وإرشادات الأمان</div>
      </div>
    </Section>
  );
}

function Profile({ role }){
  return (
    <Section title="الملف الشخصي">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>الاسم</Label><Input placeholder="اسم المستخدم"/>
          <Label>الجهة</Label><Input placeholder="الجهة"/>
          <Label>رقم الترخيص</Label><Input placeholder="000-000"/>
          <Label>صورة شخصية (URL)</Label><Input placeholder="https://..."/>
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

// —— App Shell (Protected) ——
function AppShell({ active, setActive, role }){
  const goto = (slug) => setActive(slug);
  return (
    <div className="rounded-[28px] overflow-hidden border bg-white/60 backdrop-blur">
      <div className="grid grid-cols-[260px_1fr] min-h-[520px]">
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
          <NavLink label="إعادة التقييم" id="app-reeval" active={active} onClick={()=>goto('app-reeval')} icon={<RefreshIcon/>} />
          <div className="text-xs text-slate-500 mt-2">لوحات التحكم</div>
          <NavLink label="الجهات" id="app-dash-authority" active={active} onClick={()=>goto('app-dash-authority')} icon={<Shield className="w-4 h-4"/>} />
          <NavLink label="الاستشاريون" id="app-dash-consult" active={active} onClick={()=>goto('app-dash-consult')} icon={<User className="w-4 h-4"/>} />
          <NavLink label="الأداء الذكي" id="app-dash-ai" active={active} onClick={()=>goto('app-dash-ai')} icon={<Cpu className="w-4 h-4"/>} />
          <NavLink label="المدن" id="app-dash-cities" active={active} onClick={()=>goto('app-dash-cities')} icon={<Map className="w-4 h-4"/>} />
          <NavLink label="IoT" id="app-dash-iot" active={active} onClick={()=>goto('app-dash-iot')} icon={<Radio className="w-4 h-4"/>} />
          <NavLink label="الاستدامة" id="app-dash-sus" active={active} onClick={()=>goto('app-dash-sus')} icon={<LeafIcon/>} />
          <NavLink label="المراجعات" id="app-dash-reviews" active={active} onClick={()=>goto('app-dash-reviews')} icon={<FileText className="w-4 h-4"/>} />
          <NavLink label="النظام والإدارة" id="app-dash-system" active={active} onClick={()=>goto('app-dash-system')} icon={<Cog className="w-4 h-4"/>} />
        </aside>
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">الدور الحالي: <span className="font-medium text-slate-900">{role}</span></div>
            <Button variant="outline" onClick={()=>setActive('profile')}>الملف الشخصي</Button>
          </div>
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

// —— App: Pages (skeletons with exact fields) ——
function Dashboard({ role }){
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
    </div>
  );
}

function ProjectsList(){
  const rows = [
    { name:"محطة نقل حضري", city:"الرياض", scope:"عام", style:"نجدي", score:"82%", status:"قيد المراجعة", updated:"2025-10-15" },
    { name:"مركز ثقافي", city:"جدة", scope:"ثقافي", style:"حجازي", score:"90%", status:"PASS", updated:"2025-10-10" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">قائمة المشاريع</div>
        <Button>+ مشروع جديد</Button>
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
                <td className="px-3 py-2">{r.score}</td>
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
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">تفاصيل المشروع</div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5"><div className="text-sm font-medium">موقع المشروع</div><div className="mt-2 text-slate-500">خريطة (placeholder)</div></Card>
        <Card className="p-5"><div className="text-sm font-medium">وصف عام</div><div className="mt-2 text-slate-600 text-sm">المساحة، الاستخدام، البيئة المناخية…</div></Card>
      </div>
      <Card className="p-5"><div className="text-sm font-medium">الملفات المرفوعة</div><div className="mt-2 text-slate-600 text-sm">DWG، IFC، PDF</div></Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline">تحليل ذكي</Button>
        <Button variant="outline">محاكاة</Button>
        <Button variant="outline">تقرير</Button>
      </div>
    </div>
  );
}

function TeamManagement(){
  const members = [ {n:'م. سارة', r:'مهندس معماري'}, {n:'م. خالد', r:'استشاري'}, {n:'أ. نايف', r:'جهة اعتماد'} ];
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">إدارة الفرق</div>
      <div className="grid md:grid-cols-2 gap-4">
        {members.map((m,i)=>(<Card key={i} className="p-5"><div className="font-medium">{m.n}</div><div className="text-slate-600 text-sm">{m.r}</div></Card>))}
      </div>
      <Button>+ إضافة عضو</Button>
    </div>
  );
}

function AuditLog(){
  const items = ["رفع ملف IFC","تعديل وصف المشروع","اعتماد مبدئي"];
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">سجل النشاط</div>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">{items.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
    </div>
  );
}

// AI
function AIEval(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">التحليل الذكي (مقابل موجهات DASC)</div>
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-5"><div className="text-sm">نتيجة مبدئية</div><div className="text-2xl font-semibold text-emerald-600 mt-1">UNDER REVIEW</div></Card>
        <Card className="p-5"><div className="text-sm">نسبة الهوية</div><div className="text-xl">84%</div></Card>
        <Card className="p-5"><div className="text-sm">نسبة المناخ</div><div className="text-xl">77%</div></Card>
      </div>
    </div>
  );
}
function AIReport(){
  const rows = [
    { ref:"1.2.3", proj:"نص المشروع…", score:92, note:"مطابق" },
    { ref:"4.1.5", proj:"نص المشروع…", score:65, note:"تحسين فتحات" },
  ];
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
  const recos = ["تكبير فتحة الواجهة الجنوبية 10%","تغيير مادة التكسية إلى حجر محلي" ];
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">التوصيات الذكية</div>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">{recos.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
      <Button variant="outline">إعادة حساب النتيجة</Button>
    </div>
  );
}

// Studio
function Studio3D(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">استوديو ثلاثي الأبعاد (IFC / glTF)</div>
      <Card className="p-5"><div className="text-slate-500 text-sm">Viewer placeholder — ربط لاحقًا بـ three.js / web-ifc-three</div></Card>
    </div>
  );
}
function SolarSim(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">محاكاة الضوء والظل</div>
      <Card className="p-5"><div className="text-slate-500 text-sm">إعدادات: وقت اليوم، فصل السنة، زاوية الشمس…</div></Card>
    </div>
  );
}
function LifecycleSim(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">محاكاة الاستدامة الزمنية (10 سنوات)</div>
      <Card className="p-5"><div className="text-slate-500 text-sm">الطاقة، المياه، المواد — رسم بياني للتغير عبر الزمن</div></Card>
    </div>
  );
}

// Cities
function CitiesAtlasApp(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">خريطة المدن السعودية (Choropleth)</div>
      <Card className="p-5"><div className="text-slate-500 text-sm">Map placeholder — ربط لاحقًا بـ MapLibre/Leaflet</div></Card>
    </div>
  );
}

// Accreditation & Reports
function WorkflowEngine(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">مسار الاعتماد</div>
      <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
        <li>المراجعة الآلية</li>
        <li>اللجنة الفنية</li>
        <li>التوقيع الإلكتروني</li>
        <li>الاعتماد النهائي</li>
      </ol>
      <div className="text-xs text-slate-500">تخصيص المسار حسب نوع المشروع + مراقبة الزمن</div>
    </div>
  );
}
function ESign(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">التوقيع الإلكتروني</div>
      <div className="text-sm text-slate-600">تكامل DocuSign / Adobe Sign (placeholder)</div>
      <Button>بدء جلسة توقيع</Button>
    </div>
  );
}
function Certification(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">الشهادة</div>
      <Card className="p-5"><div className="text-slate-500 text-sm">PDF + QR للتحقق — شعار المملكة + شعار العمارة السعودية</div></Card>
      <Button variant="outline"><FileCheck2 className="w-4 h-4 ms-2"/> تنزيل الشهادة</Button>
    </div>
  );
}
function ReEvaluation(){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">إعادة التقييم</div>
      <div className="text-sm text-slate-600">ارفع النسخة المعدّلة ثم أعد التحليل وقارن النتائج</div>
      <Button variant="outline">رفع نسخة جديدة</Button>
    </div>
  );
}

// Dashboards (skeletons)
function DashAuthority(){ return <Dash title="لوحة الجهات المعتمدة"/> }
function DashConsultants(){ return <Dash title="لوحة الاستشاريين"/> }
function DashAI(){ return <Dash title="لوحة الأداء الذكي"/> }
function DashCities(){ return <Dash title="لوحة المدن"/> }
function DashIoT(){ return <Dash title="لوحة إنترنت الأشياء"/> }
function DashSustainability(){ return <Dash title="لوحة الاستدامة"/> }
function DashReviews(){ return <Dash title="لوحة المراجعات"/> }
function DashSystem(){ return <Dash title="لوحة النظام والإدارة"/> }
function Dash({ title }){
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">{title}</div>
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-5"><div className="text-xs text-slate-500">مؤشر 1</div><div className="text-xl">—</div></Card>
        <Card className="p-5"><div className="text-xs text-slate-500">مؤشر 2</div><div className="text-xl">—</div></Card>
        <Card className="p-5"><div className="text-xs text-slate-500">مؤشر 3</div><div className="text-xl">—</div></Card>
      </div>
    </div>
  );
}

// —— Small helpers ——
function Section({ title, children, className = "" }){
  return (
    <section className={"rounded-[28px] border border-slate-200 bg-white/70 backdrop-blur p-6 md:p-10 " + className}>
      {title && <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-4">{title}</h2>}
      {children}
    </section>
  );
}

function RefreshIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M1 14l4.64 4.64A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}
function LeafIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 3C7 3 3 7 3 11c0 6 8 10 8 10s8-4 8-10c0-4-4-8-8-8z"/><path d="M11 3v18"/>
    </svg>
  );
}
