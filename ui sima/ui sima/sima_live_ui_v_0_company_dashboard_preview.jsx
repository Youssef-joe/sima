import React, { useMemo, useRef, useState } from "react";
import {
  Shield,
  PlayCircle,
  ArrowRight,
  Compass,
  Cog,
  Brain,
  Box,
  Feather,
  FileCheck2,
  Mic,
  Radio,
  Map,
  CheckCircle2,
  Languages,
} from "lucide-react";

/**
 * Sima AI — Full Marketing SPA (Arabic-first, RTL)
 * ------------------------------------------------
 * Radical rebuild that ignores any previous UI. Single-file SPA with simple in-memory routing
 * to preview all marketing pages before wiring real Next.js routes.
 *
 * Pages included (from the client's specification):
 * - Home
 * - About
 * - Features
 * - AI & Research
 * - City Atlas
 * - Accreditation
 * - Innovation
 * - Field App
 * - Contact
 *
 * TailwindCSS expected. lucide-react for icons. Arabic default (RTL). English hook kept minimal.
 */

// ===== Minimal UI Primitives =====
const Button = ({ children, className = "", variant = "solid", ...props }: any) => (
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
const Card = ({ className = "", children }: any) => (
  <div className={"rounded-3xl border border-slate-200 bg-white/70 backdrop-blur shadow-sm " + className}>{children}</div>
);
const Input = ({ className = "", ...props }: any) => (
  <input className={"w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 " + className} {...props} />
);

// ===== i18n (Arabic as default) =====
const dict = {
  ar: {
    nav: [
      { id: "home", label: "الرئيسية" },
      { id: "about", label: "عن المشروع" },
      { id: "features", label: "المميزات" },
      { id: "ai", label: "الذكاء والبحث" },
      { id: "atlas", label: "المدن والهوية" },
      { id: "accred", label: "الشهادة" },
      { id: "innovation", label: "الابتكار" },
      { id: "field", label: "التطبيق الميداني" },
      { id: "contact", label: "اتصال" },
    ],
    brand: "Sima AI — الذكاء المعماري السعودي",
    // Home
    home: {
      title: "أول نظام ذكي لتقييم وتصميم واعتماد العمارة السعودية وفق الموجهات الوطنية للهوية.",
      taglines: [
        "من الفكرة إلى الاعتماد… بذكاء سعودي.",
        "العمارة التي تفهم مدينتك.",
        "هوية رقمية… توازن بين الأصالة والابتكار.",
      ],
      cta: "ابدأ التجربة",
      whatIs: {
        title: "ما هو Sima AI؟",
        body:
          "منصة وطنية ذكية تُقيّم المشاريع المعمارية تلقائيًا، تراجع المخططات، تحاكي التصميم، وتصدر شهادة الاعتماد وفق موجهات العمارة السعودية.",
      },
      grid: [
        { t: "مراجعة ذكية للمخططات", Icon: Cog },
        { t: "مطابقة الهوية السعودية", Icon: Compass },
        { t: "ذكاء اصطناعي متعلّم", Icon: Brain },
        { t: "استوديو ثلاثي الأبعاد تفاعلي", Icon: Box },
        { t: "توصيات تصميم حيّة", Icon: Feather },
        { t: "شهادة PASS / FAIL معتمدة", Icon: FileCheck2 },
        { t: "مساعد صوتي معماري", Icon: Mic },
        { t: "حساسات IoT وتحليل بيئي", Icon: Radio },
      ],
      vision:
        "تحويل العمارة السعودية من ممارسة فنية إلى علم رقمي ذكي يعزز الهوية ويرفع جودة البيئة العمرانية في كل مدينة.",
      demoCta: { label: "جرّب المنصة", href: "https://demo.sima.sa" },
    },
    // About
    about: {
      title: "نظام وطني يترجم موجهات العمارة السعودية إلى ذكاء حي",
      idea: [
        "بدأت المبادرة من رؤية المملكة 2030، ضمن محور جودة الحياة.",
        "بالتعاون مع هيئة العمارة والتصميم، تم تطوير Sima AI ليكون المرجع الوطني الذكي للمراجعة المعمارية.",
      ],
      goals: [
        "تعزيز الهوية المعمارية السعودية.",
        "رفع كفاءة الاعتماد والمراجعة.",
        "تمكين المكاتب المحلية بالذكاء الوطني.",
        "بناء قاعدة بيانات للعمارة السعودية الحديثة.",
      ],
      mapCaption: "خريطة المملكة بإضاءة ديناميكية توضّح اختلاف الطرز: نجدي، حجازي، جنوبي، شرقي.",
    },
    // Features
    features: {
      items: [
        {
          title: "التحليل الذكي للمشاريع",
          body:
            "يرفع المشروع، فيقرأ النظام المخططات والنصوص والبيانات، ثم يقيّم التوافق مع الموجهات بندًا بندًا.",
        },
        {
          title: "الاستوديو ثلاثي الأبعاد والمحاكاة",
          body:
            "محاكاة فورية للبيئة السعودية (الشمس، الظل، المواد، التهوية)، مع WebXR لتجربة الواقع الافتراضي.",
        },
        {
          title: "المساعد المعماري الصوتي",
          body:
            "يتفاعل مع المصمم بالعربية: \"هل هذا التصميم مناسب لمناخ نجران؟\" فيرد بالتحليل والتوصية.",
        },
        {
          title: "تحليل البيانات في الزمن الحقيقي (IoT)",
          body: "يربط المشاريع بالحساسات الميدانية ويقيس الأداء فعليًا. من الورق إلى الواقع.",
        },
        {
          title: "نظام الاعتماد الإلكتروني",
          body: "مسار رقمي متكامل من المراجعة إلى لجنة الاعتماد والتوقيع الإلكتروني.",
        },
        {
          title: "مكتبة المدن الذكية",
          body:
            "خرائط تفاعلية تُظهر مؤشرات العمارة في كل مدينة سعودية. (نسب النجاح – الطرز – المواد – التوجهات البيئية)",
        },
      ],
    },
    // AI & Research
    ai: {
      title: "ذكاء معماري يتعلّم من السعودية",
      paras: [
        "يعتمد النظام على قاعدة بيانات تضم آلاف البنود من أدلة العمارة السعودية.",
        "يستخدم تقنيات تحليل اللغة العربية والهندسة المعمارية معًا.",
        "يطوّر نموذج \"الهوية الرقمية المعمارية\" Digital Architectural Identity.",
      ],
      diagram: "إدخال مشروع → تحليل → مطابقة → توصيات → إعادة تعلم → تحسين الذكاء",
    },
    // City Atlas
    atlas: {
      title: "أطلس المدن والهوية",
      bullets: [
        "عرض المدن مع معدل التوافق المعماري (%).",
        "مقارنة بين الطرز (نجدي، حجازي، شرقي، جنوبي).",
        "مؤشرات المناخ والاستدامة.",
        "روابط لعرض مشاريع المدينة في الاستوديو.",
      ],
    },
    // Accreditation
    accred: {
      title: "منصة اعتماد رقمية للعمارة السعودية",
      steps: [
        "رفع المشروع.",
        "تحليل وتقييم تلقائي.",
        "لجنة المراجعة الذكية.",
        "التوقيع الإلكتروني.",
        "إصدار شهادة PASS / FAIL.",
      ],
      download: "تنزيل نموذج شهادة النجاح",
    },
    // Innovation
    innovation: {
      title: "اختراع سعودي… من الفكرة إلى براءة عالمية",
      lines: [
        "أول نظام ذكاء معماري ثقافي في العالم.",
        "يدمج بين الهوية، المناخ، والمحاكاة.",
        "قابل للتسجيل كبراءة اختراع في WIPO وUSPTO.",
        "يؤسس لمجال علمي جديد: \"الذكاء المعماري الثقافي\".",
      ],
      circles: ["ذكاء اصطناعي", "هوية", "استدامة", "مدن ذكية"],
    },
    // Field App
    field: {
      title: "التطبيق الميداني",
      bullets: [
        "للمفتشين والمراجعين في الميدان.",
        "تصوير المبنى وتحليل تطابقه مع المخطط عبر الواقع المعزز.",
        "إرسال الملاحظات مباشرة إلى لوحة الاعتماد.",
      ],
    },
    // Contact
    contact: {
      title: "الاتصال والشراكات",
      emailLabel: "البريد الرسمي",
      form: { name: "الاسم الكامل", email: "البريد الإلكتروني", msg: "رسالتك", send: "إرسال" },
      social: [
        { label: "X", href: "#" },
        { label: "LinkedIn", href: "#" },
        { label: "YouTube", href: "#" },
      ],
    },
  },
};

function useI18n(){
  const [lang, setLang] = useState<"ar">("ar");
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = useMemo(()=>dict[lang as 'ar'], [lang]);
  return { lang, setLang, dir, t } as const;
}

// ===== Page Sections (pure presentational) =====
function Section({ title, children, className = "" }: any){
  return (
    <section className={"rounded-[28px] border border-slate-200 bg-white/70 backdrop-blur p-6 md:p-10 " + className}>
      {title && <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-4">{title}</h2>}
      {children}
    </section>
  );
}

function HomePage({ t }: any){
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#eef5ff] via-[#f5f8ff] to-white text-slate-900 p-8 md:p-12 border border-slate-200 shadow-lg">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-blue-200/40 blur-3xl rounded-full" />
        <div className="absolute -left-28 -bottom-28 w-72 h-72 bg-indigo-200/30 blur-3xl rounded-full" />
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-[40px] font-semibold leading-tight">{t.title}</h1>
            <ul className="mt-4 space-y-1 text-slate-700">
              {t.taglines.map((x:string,i:number)=>(<li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/><span>{x}</span></li>))}
            </ul>
            <div className="flex gap-3 mt-6">
              <Button className="bg-slate-900 text-white hover:bg-slate-700">{t.cta} <ArrowRight className="w-4 h-4 ms-2"/></Button>
              <Button variant="glass"><PlayCircle className="w-4 h-4 ms-2"/> عرض موجز</Button>
            </div>
          </div>
          <div className="relative rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[280px] grid place-items-center">
            <span className="text-slate-500 text-sm">مشهد ثلاثي الأبعاد لمدينة سعودية (placeholder) — يُستبدل لاحقًا بـ Canvas/Model</span>
          </div>
        </div>
      </section>

      {/* What is */}
      <Section title={t.whatIs.title}>
        <p className="text-slate-700 leading-relaxed">{t.whatIs.body}</p>
      </Section>

      {/* Features Grid */}
      <Section title="الميزات الرئيسة">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {t.grid.map((g:any, i:number)=> (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 font-medium text-slate-900"><g.Icon className="w-4 h-4"/> {g.t}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Vision */}
      <Section title="رؤية المشروع">
        <p className="text-slate-700 leading-relaxed">{t.vision}</p>
      </Section>

      {/* Demo CTA */}
      <div className="text-center">
        <a href={t.demoCta.href} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-3 text-sm hover:bg-slate-700">
          {t.demoCta.label} <ArrowRight className="w-4 h-4"/>
        </a>
      </div>
    </div>
  );
}

function AboutPage({ t }: any){
  return (
    <div className="space-y-8">
      <Section title={t.title}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-slate-900 font-medium mb-2">الفكرة</div>
            <ul className="space-y-2 text-slate-700 text-sm">
              {t.idea.map((x:string,i:number)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> <span>{x}</span></li>))}
            </ul>
            <div className="text-slate-900 font-medium mt-4 mb-2">الأهداف</div>
            <ol className="list-decimal list-inside text-slate-700 text-sm space-y-1">
              {t.goals.map((x:string,i:number)=>(<li key={i}>{x}</li>))}
            </ol>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[220px] grid place-items-center text-slate-500 text-sm">
            {t.mapCaption}
          </div>
        </div>
      </Section>
    </div>
  );
}

function FeaturesPage({ t }: any){
  const items = t.items as { title: string; body: string }[];
  return (
    <div className="space-y-4">
      {items.map((f, i)=> (
        <Section key={i} title={f.title}>
          <p className="text-slate-700 leading-relaxed">{f.body}</p>
        </Section>
      ))}
    </div>
  );
}

function AIPage({ t }: any){
  return (
    <div className="space-y-8">
      <Section title={t.title}>
        <ul className="space-y-2 text-slate-700">
          {t.paras.map((x:string,i:number)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600"/> <span>{x}</span></li>))}
        </ul>
      </Section>
      <Section title="الدورة البحثية">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 grid place-items-center text-slate-600 text-sm">
          {t.diagram}
        </div>
      </Section>
    </div>
  );
}

function AtlasPage({ t }: any){
  return (
    <div className="space-y-8">
      <Section title={t.title}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[260px] grid place-items-center text-slate-500 text-sm">
            خريطة المملكة (placeholder) — تفاعل، نسب التوافق، والطُرز
          </div>
          <ul className="space-y-2 text-slate-700 text-sm">
            {t.bullets.map((b:string,i:number)=>(<li key={i} className="flex gap-2"><Map className="w-4 h-4 text-blue-600"/> <span>{b}</span></li>))}
          </ul>
        </div>
      </Section>
    </div>
  );
}

function AccredPage({ t }: any){
  return (
    <div className="space-y-8">
      <Section title={t.title}>
        <ol className="list-decimal list-inside text-slate-700 space-y-1">
          {t.steps.map((s:string,i:number)=>(<li key={i}>{s}</li>))}
        </ol>
        <div className="mt-4">
          <Button className="bg-slate-900 text-white hover:bg-slate-700"><FileCheck2 className="w-4 h-4 ms-2"/> {t.download}</Button>
        </div>
      </Section>
    </div>
  );
}

function InnovationPage({ t }: any){
  return (
    <div className="space-y-8">
      <Section title={t.title}>
        <ul className="space-y-2 text-slate-700">
          {t.lines.map((x:string,i:number)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-violet-600"/> <span>{x}</span></li>))}
        </ul>
      </Section>
      <Section title="رسم توضيحي">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {t.circles.map((c:string,i:number)=>(
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 text-center font-medium text-slate-900">{c}</div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function FieldPage({ t }: any){
  return (
    <div className="space-y-8">
      <Section title={t.title}>
        <div className="grid md:grid-cols-2 gap-6">
          <ul className="space-y-2 text-slate-700 text-sm">
            {t.bullets.map((b:string,i:number)=>(<li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> <span>{b}</span></li>))}
          </ul>
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[220px] grid place-items-center text-slate-500 text-sm">
            صورة واجهة تطبيق الهاتف (placeholder)
          </div>
        </div>
      </Section>
    </div>
  );
}

function ContactPage({ t }: any){
  const social = t.social as { label: string; href: string }[];
  return (
    <div className="space-y-8">
      <Section title={t.title}>
        <div className="grid md:grid-cols-2 gap-6">
          <form className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">{t.form.name}</div>
              <Input placeholder={t.form.name} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">{t.form.email}</div>
              <Input placeholder={t.form.email} type="email" />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">{t.form.msg}</div>
              <textarea className="w-full rounded-2xl border border-slate-300 p-3 text-sm" rows={4} placeholder={t.form.msg}></textarea>
            </div>
            <Button className="bg-slate-900 text-white hover:bg-slate-700">{t.form.send}</Button>
          </form>
          <div className="space-y-3">
            <div className="text-sm text-slate-700"><span className="font-medium">{t.emailLabel}:</span> contact@sima.sa</div>
            <div className="flex items-center gap-3 text-sm">
              {social.map((s,i)=> (<a key={i} href={s.href} className="underline text-slate-600 hover:text-slate-900">{s.label}</a>))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ===== Shell =====
function Topbar({ brand, nav, active, onNav, lang, setLang }: any){
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center"><Shield className="w-5 h-5 text-white"/></div>
        <div className="font-semibold text-slate-900">{brand}</div>
      </div>
      <div className="hidden md:flex items-center gap-1">
        {nav.map((n:any)=> (
          <button key={n.id} onClick={()=>onNav(n.id)} className={`px-3 py-2 rounded-xl text-sm ${active===n.id? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{n.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-slate-500"/>
        <select value={lang} onChange={(e)=>setLang(e.target.value)} className="text-sm rounded-2xl border border-slate-300 px-2 py-1">
          <option value="ar">العربية</option>
        </select>
      </div>
    </div>
  );
}

export default function SimaMarketingSPA(){
  const { lang, setLang, dir, t } = useI18n();
  const [route, setRoute] = useState<string>("home");
  const page = t as any;

  return (
    <div className="min-h-screen w-full bg-[#f6f9ff] text-slate-900 p-6 md:p-8" dir={dir}>
      <div className="max-w-7xl mx-auto space-y-10">
        <Topbar brand={t.brand} nav={t.nav} active={route} onNav={setRoute} lang={lang} setLang={setLang} />
        {route === 'home' && <HomePage t={t.home} />}
        {route === 'about' && <AboutPage t={t.about} />}
        {route === 'features' && <FeaturesPage t={t.features} />}
        {route === 'ai' && <AIPage t={t.ai} />}
        {route === 'atlas' && <AtlasPage t={t.atlas} />}
        {route === 'accred' && <AccredPage t={t.accred} />}
        {route === 'innovation' && <InnovationPage t={t.innovation} />}
        {route === 'field' && <FieldPage t={t.field} />}
        {route === 'contact' && <ContactPage t={t.contact} />}
        <div className="text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI • نموذج واجهة تسويقية — محتوى وهيكلة حسب مواصفات العميل</div>
      </div>
    </div>
  );
}
