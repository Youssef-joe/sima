"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield, ArrowRight, PlayCircle, CheckCircle2, Compass, Cog, Brain, Box, Feather,
  FileCheck2, Mic, Radio, Map, SunMedium
} from "lucide-react";

const Button = ({ children, className = "", variant = "solid", href, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition ";
  const variantClasses = variant === "solid"
    ? "bg-slate-900 text-white hover:bg-slate-700 "
    : variant === "outline"
    ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
    : variant === "glass"
    ? "backdrop-blur bg-white/60 text-slate-900 border border-white/60 hover:bg-white/80 "
    : "";
  
  if (href) {
    return (
      <Link href={href} className={baseClasses + variantClasses + className} {...props}>
        {children}
      </Link>
    );
  }
  
  return (
    <button className={baseClasses + variantClasses + className} {...props}>
      {children}
    </button>
  );
};

function Section({ title, children, className = "" }) {
  return (
    <section className={"rounded-[28px] border border-slate-200 bg-white/70 backdrop-blur p-6 md:p-10 " + className}>
      {title && <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-4">{title}</h2>}
      {children}
    </section>
  );
}

const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    heroTitle: "أول نظام ذكي لتقييم وتصميم واعتماد العمارة السعودية وفق الموجهات الوطنية للهوية.",
    heroBullets: [
      "من الفكرة إلى الاعتماد… بذكاء سعودي.",
      "العمارة التي تفهم مدينتك.",
      "هوية رقمية… توازن بين الأصالة والابتكار.",
    ],
    ctaStart: "ابدأ التجربة",
    ctaWatch: "عرض موجز",
    whatTitle: "ما هو Sima AI؟",
    whatBody: "منصة وطنية ذكية تُقيّم المشاريع المعمارية تلقائياً، تراجع المخططات، تحاكي التصميم، وتصدر شهادة الاعتماد وفق موجهات العمارة السعودية.",
    featuresTitle: "الميزات الرئيسة",
    visionTitle: "رؤية المشروع",
    visionBody: "تحويل العمارة السعودية من ممارسة فنية إلى علم رقمي ذكي يعزز الهوية ويرفع جودة البيئة العمرانية في كل مدينة.",
    tryNow: "جرّب المنصة",
    footer: "© ",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    heroTitle: "The first intelligent system to evaluate, design, and accredit Saudi architecture against national identity guidelines.",
    heroBullets: [
      "From concept to accreditation — Saudi-made intelligence.",
      "Architecture that understands your city.",
      "A digital identity balancing authenticity and innovation.",
    ],
    ctaStart: "Start now",
    ctaWatch: "Quick demo",
    whatTitle: "What is Sima AI?",
    whatBody: "A national intelligent platform that automatically reviews plans, simulates design, and issues accreditation certificates aligned with Saudi architectural directives.",
    featuresTitle: "Key Features",
    visionTitle: "Project Vision",
    visionBody: "Transforming Saudi architecture from craft to digital science, strengthening identity and urban quality in every city.",
    tryNow: "Try the platform",
    footer: "© ",
  },
};

export default function Page() {
  const [lang, setLang] = useState("ar");
  const t = useMemo(() => T[lang], [lang]);
  const rtl = lang === "ar";

  useEffect(() => {
    const storedLang = localStorage.getItem('language') || 'ar';
    setLang(storedLang);
    
    const handleStorageChange = () => {
      const newLang = localStorage.getItem('language') || 'ar';
      setLang(newLang);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const features = [
    { t: rtl ? "مراجعة ذكية للمخططات" : "AI Plan Review", Icon: Cog },
    { t: rtl ? "مطابقة الهوية السعودية" : "Saudi Identity Compliance", Icon: Compass },
    { t: rtl ? "ذكاء اصطناعي متعلّم" : "Continual AI Learning", Icon: Brain },
    { t: rtl ? "استوديو ثلاثي الأبعاد تفاعلي" : "Interactive 3D Studio", Icon: Box },
    { t: rtl ? "توصيات تصميم حيّة" : "Live Design Recommendations", Icon: Feather },
    { t: rtl ? "شهادة PASS / FAIL معتمدة" : "Accredited PASS/FAIL", Icon: FileCheck2 },
    { t: rtl ? "مساعد صوتي معماري" : "Voice Architectural Assistant", Icon: Mic },
    { t: rtl ? "حساسات IoT وتحليل بيئي" : "IoT & Environmental Analytics", Icon: Radio },
  ];

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen w-full bg-[#f6f9ff] text-slate-900">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] mx-6 md:mx-10 bg-gradient-to-b from-[#eef5ff] via-[#f5f8ff] to-white text-slate-900 p-8 md:p-12 border border-slate-200 shadow-lg">
        <motion.div 
          initial={{ opacity: 0, y: -8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="relative z-10 grid md:grid-cols-2 gap-8 items-center"
        >
          <div>
            <h1 className="text-3xl md:text-[40px] font-semibold leading-tight">{t.heroTitle}</h1>
            <ul className="mt-4 space-y-1 text-slate-700">
              {t.heroBullets.map((x, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
                  {x}
                </li>
              ))}
            </ul>
            <div className="flex gap-3 mt-6">
              <Button href="/chat">
                {t.ctaStart} <ArrowRight className="w-4 h-4 ms-2"/>
              </Button>
              <Button variant="glass">
                <PlayCircle className="w-4 h-4 ms-2"/> {t.ctaWatch}
              </Button>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: .98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.6 }} 
            className="relative rounded-3xl border border-slate-200 bg-white/70 backdrop-blur min-h-[300px] grid place-items-center overflow-hidden"
          >
            <div className="absolute inset-0">
              <div className="absolute -right-24 -top-24 w-80 h-80 bg-blue-200/40 blur-3xl rounded-full" />
              <div className="absolute -left-28 -bottom-28 w-72 h-72 bg-indigo-200/30 blur-3xl rounded-full" />
            </div>
            <div className="relative z-10 text-slate-500 text-sm">
              {rtl ? "مشهد ثلاثي الأبعاد لمدينة سعودية — Placeholder" : "3D Saudi city scene — Placeholder"}
              <div className="mt-6 w-48 h-48 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 grid place-items-center">
                <motion.div
                  animate={{ x: [-60, 60, -60], y: [-40, 0, -40] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="w-6 h-6 rounded-full bg-amber-300 shadow-[0_0_30px_#fde68a] flex items-center justify-center"
                >
                  <SunMedium className="w-4 h-4 text-amber-700"/>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* What is Sima AI */}
      <div className="mx-6 md:mx-10 my-8">
        <Section title={t.whatTitle}>
          <p className="text-slate-700 leading-relaxed">{t.whatBody}</p>
        </Section>
      </div>

      {/* Features */}
      <div className="mx-6 md:mx-10">
        <Section title={t.featuresTitle}>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((g, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 12 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ duration: .35, delay: i * 0.05 }} 
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <g.Icon className="w-4 h-4"/> {g.t}
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* Vision */}
      <div className="mx-6 md:mx-10 my-8">
        <Section title={t.visionTitle}>
          <p className="text-slate-700 leading-relaxed">{t.visionBody}</p>
        </Section>
      </div>

      {/* CTA */}
      <div className="mx-6 md:mx-10 mb-10">
        <Section>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <Button href="/chat" className="px-6 py-3 w-full">
              💬 {rtl ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}
            </Button>
            <Button href="/dashboard" variant="outline" className="px-6 py-3 w-full">
              📊 {rtl ? 'لوحة التحكم' : 'Dashboard'}
            </Button>
            <Button href="/studio/3d" variant="outline" className="px-6 py-3 w-full">
              🏗️ {rtl ? 'استوديو ثلاثي الأبعاد' : '3D Studio'}
            </Button>
          </div>
        </Section>
      </div>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">
        {t.footer}{new Date().getFullYear()} Sima AI
      </footer>
    </div>
  );
}