import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Printer,
  Copy,
  QrCode,
} from "lucide-react";
import QRCode from "qrcode";

/**
 * Sima AI — Screen 14: Smart Reports (Standalone)
 * - PASS/FAIL certificate view with project meta, pillar scores, DASC items table.
 * - Generate **QR** (via `qrcode` NPM) for verification link; copy link.
 * - Export: JSON snapshot + Print (use system Print→PDF). Also download QR PNG.
 * - i18n (AR/EN) + RTL; RBAC: reports.view required (soft guard message only for demo).
 * - Self‑tests badge validates i18n keys, score range, and QR generation.
 */

// ——————————————————
// RBAC (minimal)
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: ["projects.view", "reports.view"],
  [ROLES.CONSULTANT]: ["projects.view", "reports.view"],
  [ROLES.CLIENT]: ["projects.view"],
};
const AuthCtx = React.createContext(null);
function AuthProvider({ children }){
  const [user, setUser] = useState({ email: "reports@sima.sa", role: ROLES.AUTHORITY });
  const setRole = (role) => setUser((u)=> (u? { ...u, role } : { email: "reports@sima.sa", role }));
  const can = (perm) => !!(user && PERMISSIONS[user.role]?.includes(perm));
  return <AuthCtx.Provider value={{ user, setRole, can }}>{children}</AuthCtx.Provider>;
}
function useAuth(){ return useContext(AuthCtx); }

// ——————————————————
// UI primitives
// ——————————————————
const Button = ({ children, className = "", variant = "solid", ...props }) => (
  <button
    className={
      "inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition " +
      (variant === "solid"
        ? "bg-slate-900 text-white hover:bg-slate-700 "
        : variant === "outline"
        ? "bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100 "
        : variant === "soft"
        ? "bg-slate-100 text-slate-900 hover:bg-slate-200 "
        : variant === "ghost"
        ? "bg-transparent text-slate-900 hover:bg-slate-100 "
        : "") + className
    }
    {...props}
  >{children}</button>
);
const Card = ({ className = "", children }) => (
  <div className={"rounded-3xl border border-slate-200 bg-white shadow-sm " + className}>{children}</div>
);
const Input = (props)=> <input className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" {...props}/>;
function Pill({ children, className = "" }){
  return <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] " + className}>{children}</span>;
}
function Progress({ value, color="#0f172a" }){
  const v = Math.max(0, Math.min(100, value|0));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "التقارير الذكية — شهادة PASS/FAIL",
    subtitle: "تقرير مطابق لموجهات العمارة السعودية (DASC)",
    role: "الدور",

    projectMeta: "بيانات المشروع",
    project: "المشروع",
    id: "رقم الشهادة",
    owner: "المالك / المكتب",
    city: "المدينة",
    date: "التاريخ",

    result: "النتيجة",
    pass: "PASS",
    fail: "FAIL",
    overall: "التقييم العام",
    pillars: "محاور التقييم",

    identity: "الهوية",
    climate: "المناخ",
    function: "الوظيفة",
    human: "الإنسان",
    context: "السياق",

    items: "بنود DASC التفصيلية",
    code: "المرجع",
    item: "البند",
    score: "الدرجة",
    note: "ملاحظة",

    verify: "رابط التحقق",
    copy: "نسخ",
    qr: "رمز QR للتحقق",

    export: "تصدير JSON",
    print: "طباعة / PDF",
    downloadQR: "تحميل QR",

    noPerm: "لا تملك صلاحية عرض التقارير",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Smart Reports — PASS/FAIL Certificate",
    subtitle: "Conformance to Saudi Architecture Guidelines (DASC)",
    role: "Role",

    projectMeta: "Project info",
    project: "Project",
    id: "Certificate ID",
    owner: "Owner / Firm",
    city: "City",
    date: "Date",

    result: "Result",
    pass: "PASS",
    fail: "FAIL",
    overall: "Overall score",
    pillars: "Evaluation pillars",

    identity: "Identity",
    climate: "Climate",
    function: "Function",
    human: "Human",
    context: "Context",

    items: "DASC Detailed Items",
    code: "Ref",
    item: "Item",
    score: "Score",
    note: "Note",

    verify: "Verification link",
    copy: "Copy",
    qr: "QR Code",

    export: "Export JSON",
    print: "Print / PDF",
    downloadQR: "Download QR",

    noPerm: "You don't have permission to view reports",
  },
};

// ——————————————————
// Demo report data
// ——————————————————
const REPORT = {
  certId: "CERT-2025-00123",
  projectId: "P-2203",
  nameAr: "مركز ثقافي — العلا",
  nameEn: "AlUla Cultural Center",
  cityAr: "العلا",
  cityEn: "AlUla",
  owner: "Hijaz Partners",
  date: "2025-10-18",
  pillars: { identity: 86, climate: 78, function: 80, human: 83, context: 85 },
  items: [
    { code: "DASC-1.2", titleAr: "تناغم نسب الفتحات مع الطراز الحجازي", titleEn: "Openings ratios align with Hijazi style", score: 92, noteAr: "مطابق مع توصية 1.2‑ب", noteEn: "Complies with note 1.2‑b" },
    { code: "DASC-2.4", titleAr: "معالجات التظليل وفق المسار الشمسي", titleEn: "Solar path shading treatments", score: 78, noteAr: "تحسين التظليل الغربي مقترح", noteEn: "Improve west facade shading" },
    { code: "DASC-3.1", titleAr: "مواد محلية منخفضة الانبعاثات", titleEn: "Low‑emission local materials", score: 85, noteAr: "مطابق", noteEn: "Compliant" },
    { code: "DASC-5.3", titleAr: "راحة المشاة وممرات مظللة", titleEn: "Shaded pedestrian comfort", score: 81, noteAr: "مطابق", noteEn: "Compliant" },
  ],
};

function colorFor(v){
  const hue = (Math.max(0, Math.min(100, v)) * 1.2); // 0..120
  return `hsl(${hue}, 70%, 45%)`;
}

// ——————————————————
// Self‑tests badge
// ——————————————————
function DevTestsBadge({ t, score, qrOk }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.items && !!t.verify });
  tests.push({ name: "score range", pass: score>=0 && score<=100 });
  tests.push({ name: "qr", pass: !!qrOk });
  const tip = tests.map(x => (x.pass? '✓ ':'× ') + x.name).join('\n');
  const all = tests.every(x=>x.pass);
  return (
    <div aria-live="polite" className="fixed bottom-3 left-3 z-50">
      <div className={("px-2.5 py-1.5 rounded-full text-[10px] ") + (all? "bg-emerald-600 text-white" : "bg-amber-500 text-black")} title={tip}>
        {all? "Tests: PASS" : "Tests: CHECK"}
      </div>
    </div>
  );
}

// ——————————————————
// Screen 14 — Smart Reports
// ——————————————————
function SmartReportsScreen(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  // overall score as mean of pillars
  const overall = useMemo(()=>{
    const p = REPORT.pillars; const arr = [p.identity, p.climate, p.function, p.human, p.context];
    return Math.round(arr.reduce((a,c)=> a+c, 0) / arr.length);
  }, []);
  const isPass = overall >= 75;

  // verification link (dummy domain) + QR
  const verifyLink = useMemo(()=> {
    const id = REPORT.certId + ':' + REPORT.projectId + ':' + overall;
    // simple checksum
    const sum = id.split('').reduce((a,c)=> a + c.charCodeAt(0), 0).toString(16);
    return `https://verify.sima.sa/cert/${REPORT.certId}?sig=${sum}`;
  }, [overall]);

  const [qrDataUrl, setQrDataUrl] = useState("");
  useEffect(()=>{
    let alive = true;
    QRCode.toDataURL(verifyLink, { errorCorrectionLevel: 'M', margin: 1, width: 180 })
      .then(url => { if (alive) setQrDataUrl(url); })
      .catch(()=> setQrDataUrl(""));
    return ()=> { alive = false; };
  }, [verifyLink]);

  function exportJSON(){
    const payload = { report: REPORT, overall, pass: isPass, verifyLink };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${REPORT.certId}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function onPrint(){ window.print(); }
  function downloadQR(){ if (!qrDataUrl) return; const a = document.createElement('a'); a.href = qrDataUrl; a.download = `${REPORT.certId}_QR.png`; a.click(); }
  function copyLink(){ navigator.clipboard?.writeText(verifyLink); }

  return (
    <div dir={rtl? 'rtl':'ltr'} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
      {/* Topbar */}
      <header className="px-6 md:px-10 py-5 sticky top-0 z-40 bg-[#f6f9ff]/80 backdrop-blur border-b border-slate-200/60 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center shadow-sm"><Shield className="w-5 h-5 text-white"/></div>
            <div className="font-semibold text-slate-900">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang('ar')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='ar'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>عربي</button>
            <button onClick={()=>setLang('en')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='en'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>EN</button>
            <div className="w-px h-6 bg-slate-300 mx-2"/>
            <SelectRole />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-6 md:px-10 pb-16">
        <div className="max-w-5xl mx-auto space-y-4">
          {!can('reports.view') && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm no-print">
              {t.noPerm}
            </div>
          )}

          {/* Certificate Card */}
          <Card className="p-6 print:p-8 print:shadow-none print:border-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
                <p className="text-[12px] text-slate-600 mt-1">{t.subtitle}</p>
              </div>
              <div className="no-print flex items-center gap-2">
                <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4"/> {t.export}</Button>
                <Button variant="outline" onClick={onPrint}><Printer className="w-4 h-4"/> {t.print}</Button>
              </div>
            </div>

            {/* Header strip */}
            <div className="mt-4 grid md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-medium mb-2">{t.projectMeta}</div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-600">{t.project}:</span> <span className="text-slate-900 font-medium">{lang==='ar'? REPORT.nameAr : REPORT.nameEn}</span></div>
                    <div><span className="text-slate-600">{t.id}:</span> <span className="text-slate-900 font-medium">{REPORT.certId}</span></div>
                    <div><span className="text-slate-600">{t.owner}:</span> <span className="text-slate-900 font-medium">{REPORT.owner}</span></div>
                    <div><span className="text-slate-600">{t.city}:</span> <span className="text-slate-900 font-medium">{lang==='ar'? REPORT.cityAr : REPORT.cityEn}</span></div>
                    <div><span className="text-slate-600">{t.date}:</span> <span className="text-slate-900 font-medium">{new Date(REPORT.date).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4">
                <div className={"rounded-2xl border p-4 text-center " + (isPass? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50')}>
                  <div className="text-sm text-slate-600">{t.result}</div>
                  <div className={"mt-1 text-2xl font-bold flex items-center justify-center gap-2 " + (isPass? 'text-emerald-700':'text-rose-700')}>
                    {isPass ? <CheckCircle2 className="w-6 h-6"/> : <XCircle className="w-6 h-6"/>}
                    {isPass ? t.pass : t.fail}
                  </div>
                  <div className="mt-3 text-sm text-slate-600">{t.overall}</div>
                  <div className="mt-1 text-2xl font-semibold" style={{ color: colorFor(overall) }}>{overall}%</div>
                  <div className="mt-2"><Progress value={overall} color={colorFor(overall)} /></div>
                </div>
              </div>
            </div>

            {/* Pillars */}
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-medium mb-2">{t.pillars}</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[{k:'identity',label:t.identity},{k:'climate',label:t.climate},{k:'function',label:t.function},{k:'human',label:t.human},{k:'context',label:t.context}].map(({k,label})=> (
                  <div key={k} className="rounded-2xl border border-slate-200 p-3">
                    <div className="text-[12px] text-slate-600">{label}</div>
                    <div className="mt-1 text-xl font-semibold" style={{ color: colorFor(REPORT.pillars[k]) }}>{REPORT.pillars[k]}%</div>
                    <div className="mt-2"><Progress value={REPORT.pillars[k]} color={colorFor(REPORT.pillars[k])} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items table */}
            <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 text-sm font-medium bg-slate-50">{t.items}</div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-start px-4 py-2 w-[120px]">{t.code}</th>
                    <th className="text-start px-4 py-2">{t.item}</th>
                    <th className="text-start px-4 py-2 w-[120px]">{t.score}</th>
                    <th className="text-start px-4 py-2 w-[220px]">{t.note}</th>
                  </tr>
                </thead>
                <tbody>
                  {REPORT.items.map((it, idx)=> (
                    <tr key={idx} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-mono text-slate-700">{it.code}</td>
                      <td className="px-4 py-3">{lang==='ar'? it.titleAr : it.titleEn}</td>
                      <td className="px-4 py-3"><span className="font-semibold" style={{ color: colorFor(it.score) }}>{it.score}%</span></td>
                      <td className="px-4 py-3 text-slate-600">{lang==='ar'? it.noteAr : it.noteEn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Verify */}
            <div className="mt-4 grid md:grid-cols-12 gap-4">
              <div className="md:col-span-8 rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-medium mb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> {t.verify}</div>
                <div className="flex items-center gap-2">
                  <Input readOnly value={verifyLink} />
                  <Button variant="outline" onClick={copyLink}><Copy className="w-4 h-4"/> {t.copy}</Button>
                </div>
              </div>
              <div className="md:col-span-4 rounded-2xl border border-slate-200 p-4 text-center">
                <div className="text-sm font-medium mb-2 flex items-center gap-2 justify-center"><QrCode className="w-4 h-4"/> {t.qr}</div>
                <div className="grid place-items-center">
                  {qrDataUrl ? <img alt="qr" src={qrDataUrl} className="w-40 h-40"/> : <div className="text-[12px] text-slate-500">…</div>}
                </div>
                <div className="mt-2 no-print"><Button variant="outline" onClick={downloadQR}><Download className="w-4 h-4"/> {t.downloadQR}</Button></div>
              </div>
            </div>

            {/* print watermark */}
            <div className="print:block hidden text-center text-[10px] text-slate-500 mt-6">© {new Date().getFullYear()} Sima AI — Saudi Architectural Intelligence</div>
          </Card>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500 no-print">© {new Date().getFullYear()} Sima AI</footer>

      <DevTestsBadge t={t} score={overall} qrOk={!!qrDataUrl} />

      {/* print styles */}
      <style>{`@media print{ .no-print{ display:none !important } body{ -webkit-print-color-adjust:exact } }`}</style>
    </div>
  );
}

function SelectRole(){
  const { user, setRole } = useAuth();
  return (
    <select value={user?.role || ROLES.CONSULTANT} onChange={(e)=> setRole(e.target.value)} className="rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white">
      <option value={ROLES.AUTHORITY}>Authority</option>
      <option value={ROLES.CONSULTANT}>Consultant</option>
      <option value={ROLES.CLIENT}>Client</option>
    </select>
  );
}

// ——————————————————
// Exported App
// ——————————————————
export default function Sima_Screen14_SmartReports(){
  return (
    <AuthProvider>
      <SmartReportsScreen />
    </AuthProvider>
  );
}
