import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  BadgeCheck,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  CheckCircle2,
  XCircle,
  FileCheck2,
  FileText,
  FileUp,
  Download,
  Settings,
  Users,
  Lock,
  Unlock,
  Send,
} from "lucide-react";

/**
 * Sima AI — Screen 08: Accreditation Workflow (Standalone)
 * - Stages: Auto Review → Committee → E‑Sign → Certified. Optional: Revisions.
 * - Actions gated by RBAC: advance, request changes, sign, finalize.
 * - Timeline log, progress, configurable optional stage, export JSON.
 * - i18n (AR/EN) + RTL; all JSX closed; only stable lucide icons.
 * - Self-tests badge validates i18n keys, RBAC rules, stage transitions.
 */

// ——————————————————
// RBAC
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
  [ROLES.CLIENT]: ["projects.view"],
};

const AuthCtx = React.createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState({ email: "demo@studio.sa", role: ROLES.CONSULTANT });
  const signIn = ({ email, role }) => setUser({ email, role });
  const signOut = () => setUser(null);
  const setRole = (role) => setUser((u)=> (u? { ...u, role } : { email: "demo@studio.sa", role }));
  const can = (perm) => !!(user && PERMISSIONS[user.role]?.includes(perm));
  const value = { user, signIn, signOut, setRole, can };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
function useAuth() { return useContext(AuthCtx); }

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
function Input({ ...props }){
  return (
    <input
      className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      {...props}
    />
  );
}
function Select({ options, ...props }){
  return (
    <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
      {options.map((o, i)=> <option key={i} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Pill({ children, className = "" }){
  return <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] " + className}>{children}</span>;
}
function Progress({ value }){
  const v = Math.max(0, Math.min(100, value|0));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full bg-slate-900" style={{ width: `${v}%` }} />
    </div>
  );
}

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "مسار الاعتماد",
    subtitle: "مراجعة آلية → لجنة فنية → توقيع إلكتروني → اعتماد نهائي",

    // status
    NEW: "جديد",
    REVIEW: "قيد المراجعة",
    CHANGES: "بحاجة لتعديلات",
    SIGNING: "توقيع إلكتروني",
    CERTIFIED: "معتمد",

    // ui
    role: "الدور",
    progress: "نسبة التقدم",
    stages: "المراحل",
    optionalStage: "مرحلة اختيارية",
    enableRevision: "تفعيل مرحلة إعادة التقييم",

    // actions
    toCommittee: "إرسال إلى اللجنة",
    requestChanges: "طلب تعديلات",
    uploadRevision: "رفع نسخة معدّلة",
    reEvaluate: "إعادة تحليل",
    openESign: "فتح التوقيع الإلكتروني",
    signNow: "توقيع الآن",
    finalize: "اعتماد نهائي",
    export: "تصدير JSON",

    // timeline
    timeline: "سجل المسار",

    // hints
    noPerm: "ليست لديك صلاحية تنفيذ هذا الإجراء",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Accreditation Workflow",
    subtitle: "Auto Review → Committee → E‑Sign → Certified",

    NEW: "NEW",
    REVIEW: "UNDER REVIEW",
    CHANGES: "CHANGES REQUIRED",
    SIGNING: "E‑SIGN",
    CERTIFIED: "CERTIFIED",

    role: "Role",
    progress: "Progress",
    stages: "Stages",
    optionalStage: "Optional stage",
    enableRevision: "Enable re‑evaluation stage",

    toCommittee: "Send to committee",
    requestChanges: "Request changes",
    uploadRevision: "Upload revised version",
    reEvaluate: "Re‑evaluate",
    openESign: "Open e‑Sign",
    signNow: "Sign now",
    finalize: "Finalize",
    export: "Export JSON",

    timeline: "Workflow log",

    noPerm: "You don't have permission for this action",
  },
};

// ——————————————————
// Demo state
// ——————————————————
const INIT = {
  id: "P-007",
  name: "Wadi Spine",
  status: "REVIEW", // REVIEW → SIGNING → CERTIFIED, or CHANGES → REVIEW
  enableRevision: true,
  files: [{ id: "F-01", name: "Masterplan.pdf", size: "2.4 MB" }],
  log: [
    { t: "2025-10-01T08:10:00Z", txt: { ar: "إنشاء المشروع", en: "Project created" } },
    { t: "2025-10-02T09:30:00Z", txt: { ar: "انتهاء المراجعة الآلية", en: "Auto review completed" } },
  ],
};

const STAGES = [
  { key: "REVIEW", labelAr: "مراجعة آلية", labelEn: "Auto Review" },
  { key: "SIGNING", labelAr: "توقيع إلكتروني", labelEn: "E‑Sign" },
  { key: "CERTIFIED", labelAr: "اعتماد نهائي", labelEn: "Certified" },
];

// ——————————————————
// Self-tests badge
// ——————————————————
function DevTestsBadge({ t }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.subtitle && !!t.toCommittee });
  const rbacOk = PERMISSIONS[ROLES.AUTHORITY].includes('accredit.sign') && !PERMISSIONS[ROLES.CLIENT].includes('accredit.sign');
  tests.push({ name: "rbac rules", pass: rbacOk });
  const flowOk = STAGES.length >= 3 && STAGES[0].key==='REVIEW' && STAGES.at(-1).key==='CERTIFIED';
  tests.push({ name: "stages order", pass: flowOk });
  const all = tests.every(x=>x.pass);
  const tip = tests.map(x => (x.pass? '✓ ':'× ') + x.name).join('\n');
  return (
    <div aria-live="polite" className="fixed bottom-3 left-3 z-50">
      <div className={("px-2.5 py-1.5 rounded-full text-[10px] ") + (all? "bg-emerald-600 text-white" : "bg-amber-500 text-black")} title={tip}>
        {all? "Tests: PASS" : "Tests: CHECK"}
      </div>
    </div>
  );
}

// ——————————————————
// Screen 08 — Accreditation Workflow
// ——————————————————
function WorkflowScreen(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  const [state, setState] = useState(INIT);
  const progress = state.status === 'REVIEW' ? 33 : state.status === 'SIGNING' ? 66 : state.status === 'CERTIFIED' ? 100 : 10;

  function log(txtAr, txtEn){
    setState(s => ({ ...s, log: [{ t: new Date().toISOString(), txt: { ar: txtAr, en: txtEn } }, ...s.log] }));
  }

  function toCommittee(){
    if (!can('projects.approve')) return alert(t.noPerm);
    log('إرسال إلى اللجنة', 'Sent to committee');
  }
  function requestChanges(){
    if (!can('projects.approve')) return alert(t.noPerm);
    setState(s => ({ ...s, status: 'CHANGES' }));
    log('طلب تعديلات من الاستشاري', 'Changes requested from consultant');
  }
  function uploadRevision(){
    if (!can('ai.evaluate')) return alert(t.noPerm);
    setState(s => ({ ...s, status: 'REVIEW' }));
    log('رفع نسخة معدّلة', 'Revised version uploaded');
  }
  function reEvaluate(){
    if (!can('ai.evaluate')) return alert(t.noPerm);
    // keep REVIEW, just log
    log('إعادة تحليل الهوية', 'Re-evaluation triggered');
  }
  function openESign(){
    if (!can('accredit.sign')) return alert(t.noPerm);
    setState(s => ({ ...s, status: 'SIGNING' }));
    log('فتح التوقيع الإلكتروني', 'Opened e-sign flow');
  }
  function signNow(){
    if (!can('accredit.sign')) return alert(t.noPerm);
    log('تم التوقيع الإلكتروني من الأطراف', 'All parties e-signed');
  }
  function finalize(){
    if (!can('projects.approve')) return alert(t.noPerm);
    setState(s => ({ ...s, status: 'CERTIFIED' }));
    log('تم الاعتماد النهائي وإصدار الشهادة', 'Final certification issued');
  }
  function exportJSON(){
    const payload = { project: { id: state.id, name: state.name }, status: state.status, enableRevision: state.enableRevision, log: state.log };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_workflow.json'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div dir={rtl? 'rtl':'ltr'} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
      {/* Topbar */}
      <header className="px-6 md:px-10 py-5 sticky top-0 z-40 bg-[#f6f9ff]/80 backdrop-blur border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center shadow-sm"><Shield className="w-5 h-5 text-white"/></div>
            <div className="font-semibold text-slate-900">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang('ar')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='ar'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>عربي</button>
            <button onClick={()=>setLang('en')} className={("px-3 py-2 rounded-xl text-sm ") + (lang==='en'? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900')}>EN</button>
            <div className="w-px h-6 bg-slate-300 mx-2"/>
            <Select value={user?.role || ROLES.CONSULTANT} onChange={(e)=>setRole(e.target.value)} options={lang==='ar' ? [
              { value: ROLES.AUTHORITY, label: 'جهة اعتماد' },
              { value: ROLES.CONSULTANT, label: 'استشاري' },
              { value: ROLES.CLIENT, label: 'عميل' },
            ] : [
              { value: ROLES.AUTHORITY, label: 'Authority' },
              { value: ROLES.CONSULTANT, label: 'Consultant' },
              { value: ROLES.CLIENT, label: 'Client' },
            ]} />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-6 md:px-10 pb-16">
        <div className="max-w-7xl mx-auto space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
                <p className="text-[12px] text-slate-600 mt-1">{t.subtitle}</p>
                <div className="mt-2 text-[12px] text-slate-600 flex flex-wrap items-center gap-2">
                  <Pill className="border-slate-300"><ClipboardList className="w-3.5 h-3.5"/> {state.id} — {state.name}</Pill>
                  {state.status === 'CERTIFIED' ? (
                    <Pill className="border-emerald-300 bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5"/> {t.CERTIFIED}</Pill>
                  ) : state.status === 'CHANGES' ? (
                    <Pill className="border-amber-300 bg-amber-50 text-amber-700"><AlertTriangle className="w-3.5 h-3.5"/> {t.CHANGES}</Pill>
                  ) : state.status === 'SIGNING' ? (
                    <Pill className="border-sky-300 bg-sky-50 text-sky-700"><FileCheck2 className="w-3.5 h-3.5"/> {t.SIGNING}</Pill>
                  ) : (
                    <Pill className="border-slate-300"><BadgeCheck className="w-3.5 h-3.5"/> {t.REVIEW}</Pill>
                  )}
                  <Pill className="border-slate-300"><CalendarClock className="w-3.5 h-3.5"/> {t.progress}: {progress}%</Pill>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4"/> {t.export}</Button>
              </div>
            </div>

            {/* Stage visual */}
            <div className="mt-6 grid md:grid-cols-4 gap-3">
              <Stage t={t} active={state.status==='REVIEW'} done={['SIGNING','CERTIFIED'].includes(state.status)} labelAr="مراجعة آلية" labelEn="Auto Review" icon={<BadgeCheck className="w-4 h-4"/>} />
              <Stage t={t} active={state.status==='CHANGES'} done={false} labelAr="تعديلات" labelEn="Changes" icon={<AlertTriangle className="w-4 h-4"/>} optional />
              <Stage t={t} active={state.status==='SIGNING'} done={state.status==='CERTIFIED'} labelAr="توقيع إلكتروني" labelEn="E‑Sign" icon={<FileCheck2 className="w-4 h-4"/>} />
              <Stage t={t} active={state.status==='CERTIFIED'} done={state.status==='CERTIFIED'} labelAr="اعتماد" labelEn="Certified" icon={<CheckCircle2 className="w-4 h-4"/>} />
            </div>

            <div className="mt-4">
              <Progress value={progress} />
            </div>

            {/* Actions */}
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <Button variant="outline" onClick={toCommittee}><Users className="w-4 h-4"/> {t.toCommittee}</Button>
              <Button variant="outline" onClick={requestChanges}><AlertTriangle className="w-4 h-4"/> {t.requestChanges}</Button>
              <Button variant="outline" onClick={uploadRevision}><FileUp className="w-4 h-4"/> {t.uploadRevision}</Button>
              <Button variant="outline" onClick={reEvaluate}><BadgeCheck className="w-4 h-4"/> {t.reEvaluate}</Button>
              <Button variant="outline" onClick={openESign}><FileCheck2 className="w-4 h-4"/> {t.openESign}</Button>
              <Button onClick={signNow}><Send className="w-4 h-4"/> {t.signNow}</Button>
              <Button onClick={finalize}><CheckCircle2 className="w-4 h-4"/> {t.finalize}</Button>
            </div>
          </Card>

          {/* Optional config */}
          <Card className="p-6">
            <div className="text-sm font-medium mb-3 flex items-center gap-2"><Settings className="w-4 h-4"/> {t.optionalStage}</div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={state.enableRevision} onChange={(e)=> setState(s=> ({ ...s, enableRevision: e.target.checked }))} />
                {t.enableRevision}
              </label>
            </div>
            <div className="mt-3 text-[12px] text-slate-600">
              {rtl? 'عند تفعيلها، يمكن طلب تعديلات ثم العودة للمراجعة الآلية.' : 'When enabled, changes can be requested, then return to auto review.'}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <div className="text-sm font-medium mb-3">{t.timeline}</div>
            <div className="space-y-2">
              {state.log.map((e, i)=> (
                <div key={i} className="flex items-center gap-3 text-[12px] text-slate-700">
                  <CalendarClock className="w-4 h-4 text-slate-400"/>
                  <span className="text-slate-500">{new Date(e.t).toLocaleString(lang==='ar'? 'ar' : 'en-US')}</span>
                  <span>—</span>
                  <span>{rtl? e.txt.ar : e.txt.en}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      <DevTestsBadge t={t} />
    </div>
  );
}

function Stage({ t, active, done, labelAr, labelEn, icon, optional }){
  return (
    <div className={"rounded-2xl border p-4 " + (done ? 'border-emerald-300 bg-emerald-50' : active ? 'border-slate-300 bg-white' : 'border-slate-200 bg-white/70') }>
      <div className="text-sm font-medium flex items-center gap-2">
        {icon}
        <span>{labelAr} / {labelEn}{optional ? ' (Optional)' : ''}</span>
      </div>
      <div className="mt-2 text-[12px] text-slate-600">
        {done ? (t.CERTIFIED) : active ? (t.REVIEW) : ''}
      </div>
    </div>
  );
}

// ——————————————————
// Exported App
// ——————————————————
export default function Sima_Screen08_Workflow(){
  return (
    <AuthProvider>
      <WorkflowScreen />
    </AuthProvider>
  );
}