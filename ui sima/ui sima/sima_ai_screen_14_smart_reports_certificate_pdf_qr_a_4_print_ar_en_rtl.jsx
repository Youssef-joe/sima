import React, { useEffect, useMemo, useState } from "react";

/**
 * Sima AI — Screen 14: Smart Reports & Certificate (/certificate/[id])
 * - Fully client-side demo: reads ?pid, ?score, ?status from URL (fallbacks)
 * - Arabic (RTL) / English (LTR) toggle
 * - PASS / CONDITIONAL / FAIL logic, badges & progress bars
 * - A4 print-ready with @media print + @page size: A4; window.print()
 * - Live QR (external image) via api.qrserver.com (no extra deps)
 * - Verify URL embeds hash for integrity (demo)
 * - Simple console tests (non-invasive)
 *
 * References:
 * - Print CSS & @media print (MDN)
 * - @page paged media (MDN)
 * - QR API create-qr-code (goqr)
 */

// ————————— i18n —————————
const T = {
  ar: {
    title: "شهادة اعتماد العمارة السعودية",
    sub: "تقرير المطابقة والتقييم الذكي",
    projectInfo: "بيانات المشروع",
    projectId: "رقم المشروع",
    city: "المدينة",
    style: "الطراز",
    issuedAt: "تاريخ الإصدار",
    score: "النتيجة الكلية",
    status: "الحالة",
    axes: "محاور التقييم",
    identity: "الهوية",
    climate: "المناخ",
    function: "الوظيفة",
    human: "الإنسان",
    context: "السياق",
    notes: "ملاحظات",
    certificateNo: "رقم الشهادة",
    verify: "رابط التحقق",
    actions: { back: "عودة", print: "طباعة / PDF", en: "EN", ar: "عربي" },
    statuses: { PASS: "معتمد", CONDITIONAL: "مشروط", FAIL: "مرفوض" },
  },
  en: {
    title: "Saudi Architecture Accreditation Certificate",
    sub: "Compliance & Smart Evaluation Report",
    projectInfo: "Project Information",
    projectId: "Project ID",
    city: "City",
    style: "Style",
    issuedAt: "Issued on",
    score: "Overall Score",
    status: "Status",
    axes: "Evaluation Axes",
    identity: "Identity",
    climate: "Climate",
    function: "Function",
    human: "Human",
    context: "Context",
    notes: "Notes",
    certificateNo: "Certificate No.",
    verify: "Verification URL",
    actions: { back: "Back", print: "Print / PDF", en: "EN", ar: "AR" },
    statuses: { PASS: "Approved", CONDITIONAL: "Conditional", FAIL: "Rejected" },
  },
};

type Lang = keyof typeof T;

type Final = "PASS" | "CONDITIONAL" | "FAIL";

export default function SimaCertificate() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => T[lang], [lang]);
  const rtl = lang === "ar";
  useEffect(() => {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [rtl]);

  // ———————— Read URL params ————————
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const pid = params.get("pid") || inferPidFromPath() || "P-001";
  const score = clampNum(parseFloat(params.get("score") || "86"), 0, 100);
  const statusParam = (params.get("status") || "approved").toLowerCase();
  const city = params.get("city") || "الرياض";
  const style = params.get("style") || "نجدي";

  const calcFinal = computeFinal(score, statusParam);

  const issued = new Date();
  const certNo = `SIMA-${pid}-${fmtDateKey(issued)}`;

  const verifyUrl = `https://demo.sima.sa/verify?pid=${encodeURIComponent(pid)}&score=${score}&final=${calcFinal}&ts=${issued.getTime()}&sig=${simpleSig(pid, score)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(verifyUrl)}`;

  // fake axis scores for the visual (could arrive from API later)
  const axes = [
    { key: "identity", v: clampNum(score * 0.92, 0, 100) },
    { key: "climate", v: clampNum(score * 0.88, 0, 100) },
    { key: "function", v: clampNum(score * 0.85, 0, 100) },
    { key: "human", v: clampNum(score * 0.9, 0, 100) },
    { key: "context", v: clampNum(score * 0.83, 0, 100) },
  ] as const;

  // ———————— Dev tests (non-invasive) ————————
  useEffect(() => {
    try {
      console.assert(computeFinal(85, "approved") === "PASS", "PASS threshold");
      console.assert(computeFinal(74, "approved") === "CONDITIONAL", "COND threshold");
      console.assert(computeFinal(42, "approved") === "FAIL", "FAIL threshold");
      console.assert(verifyUrl.includes(pid), "verify url contains pid");
      console.assert(qrUrl.startsWith("https://api.qrserver.com"), "qr url ok");
    } catch (e) {
      console.warn("Tests warning:", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoSima />
            <div className="text-sm sm:text-base font-semibold">
              {t.title}
            </div>
            <span className="hidden sm:inline text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.sub}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang("ar")} className={clsBtn(lang === "ar")}>{t.actions.ar}</button>
            <button onClick={() => setLang("en")} className={clsBtn(lang === "en")}>{t.actions.en}</button>
            <a href="/authority/panel" className="text-sm underline text-slate-700">{t.actions.back}</a>
            <button onClick={() => window.print()} className="px-3 py-1.5 border rounded-xl text-sm print:hidden">{t.actions.print}</button>
          </div>
        </div>
      </header>

      {/* Certificate Card (A4 center) */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 print:py-0">
        <div className="certificate shadow-xl print:shadow-none bg-white border rounded-2xl p-6 md:p-8">
          {/* Top Row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t.title}</h1>
              <p className="text-slate-600 mt-1">{t.sub}</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <InfoRow label={t.projectId} value={pid} />
                <InfoRow label={t.issuedAt} value={fmtDateHuman(issued)} />
                <InfoRow label={t.city} value={city} />
                <InfoRow label={t.style} value={style} />
                <InfoRow label={t.certificateNo} value={certNo} />
                <InfoRow label={t.status} value={<StatusPill final={calcFinal} t={t} />} />
              </div>
            </div>

            {/* QR + Score */}
            <div className="w-full md:w-[220px] flex flex-col items-center gap-3">
              <img src={qrUrl} alt="QR" className="w-[180px] h-[180px] rounded-md border" />
              <a href={verifyUrl} target="_blank" rel="noreferrer" className="text-[12px] underline break-all text-slate-600 text-center">{t.verify}</a>
              <div className="w-full">
                <div className="text-[12px] text-slate-600 mb-1">{t.score}</div>
                <ScoreBar v={score} />
              </div>
            </div>
          </div>

          {/* Axes */}
          <section className="mt-6">
            <h2 className="text-base font-semibold mb-2">{t.axes}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {axes.map((a) => (
                <AxisRow key={a.key} label={(t as any)[a.key]} value={Math.round(a.v)} />
              ))}
            </div>
          </section>

          {/* Notes */}
          <section className="mt-6">
            <h2 className="text-base font-semibold mb-2">{t.notes}</h2>
            <ul className="list-disc ps-5 text-sm text-slate-700 space-y-1">
              <li>
                {lang === "ar"
                  ? "تُصدر هذه الشهادة اعتمادًا على موجهات العمارة السعودية (19 طرازًا) وبناءً على التحليل الذكي للمخططات والبيانات."
                  : "This certificate is issued according to Saudi Architecture guidelines (19 styles) and the smart analysis of submitted drawings and data."}
              </li>
              <li>
                {lang === "ar"
                  ? "رمز QR يتيح التحقق من صحة الشهادة عبر العنوان المرفق."
                  : "The QR code lets you verify certificate authenticity via the attached URL."}
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* styles */}
      <style>{`
        html{scroll-behavior:smooth}
        .certificate{max-width: 210mm; margin-inline: auto}
        @media print{
          header, .print\\:hidden{display:none!important}
          body,html{background:white}
        }
        @page{size:A4; margin:12mm}
      `}</style>
    </div>
  );
}

// ————————— helpers —————————
function clsBtn(active: boolean) {
  return `px-3 py-1.5 rounded-xl text-sm ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`;
}

function fmtDateHuman(d: Date) {
  return d.toLocaleString();
}
function fmtDateKey(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
function clampNum(n: number, a: number, b: number) {
  if (Number.isNaN(n)) return a;
  return Math.max(a, Math.min(b, n));
}
function inferPidFromPath() {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/certificate\/(.+)$/);
  return m ? m[1] : null;
}
function simpleSig(pid: string, score: number) {
  // demo-only signature (NOT cryptographic). Replace with server-signed JWT later.
  const raw = `${pid}|${score}|sima`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
function computeFinal(score: number, statusParam: string): Final {
  // business rule: allow override from statusParam, else by score thresholds
  const map: Record<string, Final> = {
    approved: "PASS",
    conditional: "CONDITIONAL",
    rejected: "FAIL",
  };
  if (map[statusParam]) return map[statusParam];
  if (score >= 80) return "PASS";
  if (score >= 60) return "CONDITIONAL";
  return "FAIL";
}

function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-center border rounded-xl px-3 py-2">
      <div className="text-[12px] text-slate-600">{label}</div>
      <div className="font-medium break-all">{value}</div>
    </div>
  );
}

function AxisRow({ label, value }: { label: React.ReactNode; value: number }) {
  return (
    <div className="border rounded-xl p-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <div className="text-slate-700">{label}</div>
        <div className="font-semibold">{value}%</div>
      </div>
      <ScoreBar v={value} small />
    </div>
  );
}

function ScoreBar({ v, small }: { v: number; small?: boolean }) {
  const color = v >= 80 ? "bg-emerald-500" : v >= 60 ? "bg-amber-500" : "bg-rose-500";
  const h = small ? "h-2.5" : "h-3.5";
  return (
    <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
      <div className={`${color} h-full`} style={{ width: `${Math.max(2, v)}%` }} />
    </div>
  );
}

function StatusPill({ final, t }: { final: Final; t: any }) {
  const map: Record<Final, { label: string; cls: string }> = {
    PASS: { label: t.statuses.PASS, cls: "bg-emerald-50 text-emerald-700 border-emerald-300" },
    CONDITIONAL: { label: t.statuses.CONDITIONAL, cls: "bg-amber-50 text-amber-700 border-amber-300" },
    FAIL: { label: t.statuses.FAIL, cls: "bg-rose-50 text-rose-700 border-rose-300" },
  };
  const it = map[final];
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] ${it.cls}`}>{it.label}</span>;
}

function LogoSima() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-900" aria-label="Sima logo">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 14c2-4 10-4 12 0" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" />
      <circle cx="15" cy="9" r="1.3" fill="currentColor" />
    </svg>
  );
}
