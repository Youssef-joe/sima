import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sima AI — Screen 16: Certificate View (/certificate/[id])
 * - AR/EN + RTL
 * - Reads query params (?id=&status=&score=&city=&style=&owner=)
 * - Cinematic hero + A4 printable certificate
 * - Print to PDF via window.print() with @page size: A4
 * - Verifiable link + pseudo-QR (offline, deterministic)
 * - Accessible structure + runtime tests (non-invasive)
 *
 * Notes:
 *  - Pseudo-QR هنا لأغراض الديمو (بدون مكتبات خارجية) — يولّد نمطًا ثنائيًا ثابتًا من النص المُشفّر.
 *  - عند الربط مع API لاحقًا، استبدل بيانات URLSearchParams بنتائج الاستعلام.
 */

export default function SimaCertificate(){
  // ——— i18n ———
  const [lang,setLang] = useState(/** @type {"ar"|"en"} */("ar"));
  const t = useMemo(()=> T[lang], [lang]);
  const rtl = lang === "ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  // ——— Read params / defaults ———
  const params = typeof window!=="undefined"? new URLSearchParams(window.location.search) : new URLSearchParams();
  const id    = params.get("id")     || params.get("pid") || "P-001";
  const score = clampNum(parseInt(params.get("score")||"86",10), 0, 100);
  const status= normStatus(params.get("status")||"approved");
  const city  = params.get("city")   || "الرياض";
  const style = params.get("style")  || "نجدي";
  const owner = params.get("owner")  || "Studio Najd";

  const issuedAt = useMemo(()=> new Date(), []);
  const verifyUrl = `https://verify.sima.sa/cert/${encodeURIComponent(id)}`;

  // ——— Status color ———
  const color = statusColor(status, score);

  // ——— Refs for focus/print ———
  const topRef = useRef(null);

  // ——— Dev tests ———
  useEffect(()=>{
    try{
      console.assert(pseudoQR("abc", 9).matrix.length===9, "QR size");
      console.assert(statusColor("approved", 90).tone==="emerald", "approved color");
      console.assert(statusColor("conditional", 70).tone==="amber", "conditional color");
      console.assert(statusColor("rejected", 40).tone==="rose", "rejected color");
      console.assert(formatDate(new Date("2025-10-25T12:30:00Z"), "ar").length>0, "date format ar");
      console.assert(formatDate(new Date("2025-10-25T12:30:00Z"), "en").length>0, "date format en");
    }catch(e){ console.warn("Dev tests warning:", e); }
  },[]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark/>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <span className="hidden sm:inline text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.subtitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>AR</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>EN</button>
            <a className="text-sm underline text-slate-700" href="/authority/panel">{t.back}</a>
          </div>
        </div>
      </header>

      {/* Cinematic Intro */}
      <section ref={topRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-white" aria-hidden/>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20 text-white">
          <div className="opacity-90 text-xs mb-3 tracking-widest">{t.cinematic.kicker}</div>
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
            {t.cinematic.title}
            <span className="block text-sky-300 mt-2">{t.cinematic.subtitle}</span>
          </h1>
          <p className="mt-4 max-w-2xl opacity-90 text-sm md:text-base">{t.cinematic.desc}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="#cert" className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm">{t.cta.scroll}</a>
            <button onClick={()=>window.print()} className="px-4 py-2 rounded-xl border border-white/40 text-sm">{t.cta.print}</button>
          </div>
        </div>
        {/* soft shine */}
        <div className="pointer-events-none select-none" aria-hidden>
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[140vw] h-[140vw] rounded-full bg-white/5 blur-3xl"/>
        </div>
      </section>

      {/* Certificate A4 */}
      <main id="cert" className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="border rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
          {/* Ribbon */}
          <div className={`h-2 ${ribbon(color.tone)}`} aria-hidden/>

          <div className="p-5 md:p-8 bg-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-xs text-slate-500 mb-1">{t.certificateNo}</div>
                <div className="text-sm font-semibold">{id}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">{t.issuedAt}</div>
                <div className="text-sm font-semibold">{formatDate(issuedAt, lang)}</div>
              </div>
            </div>

            {/* Title */}
            <div className="mt-6">
              <h2 className="text-2xl md:text-3xl font-semibold leading-snug">
                {t.title}
              </h2>
              <p className="text-slate-600 mt-2 max-w-3xl text-sm md:text-base">{t.lead}</p>
            </div>

            {/* Project Summary */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <SummaryItem label={t.fields.project} value={id} />
              <SummaryItem label={t.fields.owner} value={owner} />
              <SummaryItem label={t.fields.city} value={city} />
              <SummaryItem label={t.fields.style} value={style} />
              <SummaryItem label={t.fields.score} value={`${score}%`} />
              <SummaryItem label={t.fields.status} value={t.statuses[status]} tone={color.tone} />
            </div>

            {/* Badge */}
            <div className="mt-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <Badge tone={color.tone} big>{t.badge[status]}</Badge>
                <p className="text-slate-600 mt-3 text-sm md:text-base">
                  {t.badgeDesc(status, score)}
                </p>
              </div>
              {/* Pseudo QR */}
              <div className="flex flex-col items-center">
                <div className="text-[11px] text-slate-500 mb-1">{t.verify}</div>
                <PseudoQR text={verifyUrl} size={25} scale={6}/>
                <a className="mt-2 text-xs underline text-slate-700" href={verifyUrl} target="_blank" rel="noreferrer">{verifyUrl}</a>
              </div>
            </div>

            {/* Footer sign-off */}
            <div className="mt-10 grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border">
                <div className="text-xs text-slate-500 mb-1">{t.signatory.role}</div>
                <div className="font-medium">{t.signatory.name}</div>
                <div className="text-xs text-slate-500">{t.signatory.unit}</div>
              </div>
              <div className="p-4 rounded-xl border">
                <div className="text-xs text-slate-500 mb-1">{t.signatory.signature}</div>
                <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-100 rounded" aria-label={t.signatory.signature} />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-2 no-print">
              <button onClick={()=>window.print()} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">{t.actions.print}</button>
              <button onClick={()=>copy(verifyUrl)} className="px-4 py-2 rounded-xl border text-sm">{t.actions.copy}</button>
              <a href={`/authority/panel`} className="px-4 py-2 rounded-xl border text-sm">{t.actions.back}</a>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        html{scroll-behavior:smooth}
        /* Print settings: A4 portrait */
        @media print{
          .no-print{display:none !important}
          header{display:none !important}
          body{background:white}
        }
        @page{ size:A4; margin:12mm; }
        /* Reduce motion support */
        @media (prefers-reduced-motion: reduce){
          *{animation: none !important; transition: none !important}
        }
      `}</style>
    </div>
  );
}

// ——————————— UI helpers ———————————
function clsBtn(active){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }
function ribbon(tone){ return ({emerald:"bg-emerald-500", amber:"bg-amber-500", rose:"bg-rose-500", sky:"bg-sky-500", slate:"bg-slate-400"})[tone] || "bg-slate-400"; }

function SummaryItem({label, value, tone}){
  return (
    <div className="p-4 rounded-xl border bg-white">
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div className={`text-sm md:text-base font-medium ${tone?badgeToneText(tone):""}`}>{value}</div>
    </div>
  );
}

function Badge({children, tone, big}){
  const map = {
    emerald:"bg-emerald-50 text-emerald-700 border-emerald-300",
    amber:  "bg-amber-50 text-amber-700 border-amber-300",
    rose:   "bg-rose-50 text-rose-700 border-rose-300",
    sky:    "bg-sky-50 text-sky-700 border-sky-300",
    slate:  "bg-slate-50 text-slate-700 border-slate-300",
  };
  return <span className={`inline-flex items-center ${big?"px-3 py-2 text-sm":"px-2.5 py-1 text-[12px]"} rounded-full border ${map[tone]||map.slate}`}>{children}</span>;
}

function badgeToneText(tone){
  return ({ emerald:"text-emerald-700", amber:"text-amber-700", rose:"text-rose-700", sky:"text-sky-700", slate:"text-slate-700" })[tone] || "";
}

function statusColor(status, score){
  if(status==="approved" && score>=85) return { tone:"emerald", label:"Approved" };
  if(status==="conditional" || (status==="approved" && score<85)) return { tone:"amber", label:"Conditional" };
  if(status==="rejected") return { tone:"rose", label:"Rejected" };
  return { tone:"sky", label:"Under Review" };
}

function normStatus(s){
  const m = { pass:"approved", success:"approved", ok:"approved", conditional:"conditional", fail:"rejected", rejected:"rejected", pending:"pending", approved:"approved" };
  return m[String(s).toLowerCase()] || "approved";
}

function clampNum(n, min, max){ return Math.max(min, Math.min(max, Number.isFinite(n)?n:min)); }

function copy(text){ try{ navigator.clipboard.writeText(text); alert("✓ Copied"); }catch{ /* noop */ } }

function formatDate(d, lang){
  try{
    const loc = lang==="ar"?"ar-SA":"en-US";
    return new Intl.DateTimeFormat(loc, { dateStyle:"medium", timeStyle:"short" }).format(d);
  }catch{
    return d.toLocaleString();
  }
}

// ——————————— Pseudo-QR (deterministic, offline) ———————————
function PseudoQR({ text, size=21, scale=5 }){
  const { matrix } = pseudoQR(text, size);
  const px = size * scale;
  const cell = scale;
  return (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} role="img" aria-label="verification code">
      <rect width={px} height={px} fill="#ffffff"/>
      {matrix.map((row, y)=> row.map((on, x)=> on? <rect key={`${x}-${y}`} x={x*cell} y={y*cell} width={cell} height={cell} fill="#111827"/> : null))}
      {/* Quiet zone */}
      <rect x="0" y="0" width={px} height={px} fill="none" stroke="#111827" strokeWidth="1"/>
    </svg>
  );
}

function pseudoQR(input, size){
  // Seed from string (FNV-1a like) → xorshift PRNG → boolean matrix
  let h = 2166136261 >>> 0;
  for(let i=0;i<input.length;i++){ h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  let x = h || 0x9E3779B9;
  function rnd(){ x ^= x<<13; x ^= x>>>17; x ^= x<<5; return (x>>>0) / 0xFFFFFFFF; }
  const n = Math.max(9, Math.min(45, size|0));
  const m = Array.from({length:n}, ()=> Array.from({length:n}, ()=> rnd() > 0.5));
  // Add three finder-like squares (visual affordance only)
  const mark = (ox,oy,s)=>{ for(let y=0;y<s;y++){ for(let x=0;x<s;x++){ const b = (y===0||y===s-1||x===0||x===s-1)|| (x>1&&x<s-2&&y>1&&y<s-2); if(m[oy+y]&&typeof m[oy+y][ox+x]!=="undefined") m[oy+y][ox+x]=b; }} };
  mark(1,1,7); mark(n-8,1,7); mark(1,n-8,7);
  return { matrix:m, seed:h };
}

function BrandMark(){
  return (
    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 18h18l-2-8-5 4-3-8-3 8-5-4-2 8z" stroke="currentColor" strokeWidth="1.5"/></svg>
    </div>
  );
}

// ——————————— i18n ———————————
const T = {
  ar: {
    brand: "Sima AI — شهادة الاعتماد",
    subtitle: "وثيقة رقمية للتحقق من المطابقة حسب موجهات العمارة السعودية",
    back: "عودة",
    cinematic: {
      kicker: "الاعتماد الرقمي",
      title: "شهادة مطابقة للعمارة السعودية",
      subtitle: "PASS / CONDITIONAL / FAIL",
      desc: "وثيقة رسمية قابلة للطباعة والتحقق عبر رمز تحقق ورابط مباشر.",
    },
    cta: { scroll: "عرض الشهادة", print: "طباعة / PDF" },
    certificateNo: "رقم الشهادة",
    issuedAt: "تاريخ الإصدار",
    title: "تشهد منصة Sima AI بأن المشروع التالي قد خضع للفحص الذكي وفق موجهات DASC:",
    lead: "تُصدر هذه الشهادة بعد مرور المشروع على دورة المراجعة (مراجعة \u2192 لجنة \u2192 اعتماد نهائي).",
    fields: { project:"المشروع", owner:"الاستشاري", city:"المدينة", style:"الطراز", score:"النسبة", status:"الحالة" },
    statuses: { approved:"معتمد", conditional:"مشروط", rejected:"مرفوض", pending:"قيد المراجعة" },
    badge: { approved:"PASS — معتمد", conditional:"CONDITIONAL — مشروط", rejected:"FAIL — مرفوض", pending:"UNDER REVIEW — قيد المراجعة" },
    badgeDesc: (status,score)=> status==="approved"? `حقق المشروع نسبة ${score}% من متطلبات الهوية والمعايير.`:
                   status==="conditional"? `يتطلب المشروع تحسينات محددة قبل الاعتماد النهائي. الدرجة الحالية ${score}%.`:
                   status==="rejected"? `لا يحقق المشروع الحد الأدنى من المطابقة. الدرجة ${score}%.`:
                   `التحليل قيد المعالجة. الدرجة المبدئية ${score}%.`,
    verify: "رابط التحقق",
    signatory: { role:"جهة الاعتماد", name:"قسم المراجعة المعمارية", unit:"مركز دعم الهيئات — DASC", signature:"التوقيع الإلكتروني" },
    actions: { print:"طباعة / حفظ PDF", copy:"نسخ رابط التحقق", back:"عودة إلى لوحة الاعتماد" },
  },
  en: {
    brand: "Sima AI — Accreditation Certificate",
    subtitle: "Digital document verifying compliance with Saudi Architectural Guidelines",
    back: "Back",
    cinematic: {
      kicker: "Digital Accreditation",
      title: "Saudi Architecture Compliance Certificate",
      subtitle: "PASS / CONDITIONAL / FAIL",
      desc: "Official printable document with verification link and on-page code.",
    },
    cta: { scroll: "View Certificate", print: "Print / PDF" },
    certificateNo: "Certificate No.",
    issuedAt: "Issued at",
    title: "Sima AI certifies that the following project has been evaluated against DASC:",
    lead: "This certificate is issued after the project passes the review workflow (Review \u2192 Committee \u2192 Sign-off).",
    fields: { project:"Project", owner:"Consultant", city:"City", style:"Style", score:"Score", status:"Status" },
    statuses: { approved:"Approved", conditional:"Conditional", rejected:"Rejected", pending:"Under Review" },
    badge: { approved:"PASS — Approved", conditional:"CONDITIONAL — Pending fixes", rejected:"FAIL — Rejected", pending:"UNDER REVIEW" },
    badgeDesc: (status,score)=> status==="approved"? `Project achieved ${score}% of required identity & compliance metrics.`:
                   status==="conditional"? `Project requires targeted improvements before final sign-off. Current score ${score}%.`:
                   status==="rejected"? `Project does not meet the minimum requirements. Score ${score}%.`:
                   `Analysis in progress. Provisional score ${score}%.`,
    verify: "Verification link",
    signatory: { role:"Accreditation Authority", name:"Architectural Review Division", unit:"DASC — Support Center", signature:"Digital Signature" },
    actions: { print:"Print / Save PDF", copy:"Copy Verify Link", back:"Back to Authority Panel" },
  }
};
