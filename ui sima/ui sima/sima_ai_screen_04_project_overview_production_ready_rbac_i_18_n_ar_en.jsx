import React, { useMemo, useState, useContext } from "react";
import {
  Shield,
  MapPin,
  Building2,
  Ruler,
  Layers3,
  BadgeCheck,
  CalendarClock,
  UserPlus,
  FileText,
  FileUp,
  Download,
  Link as LinkIcon,
  Sparkles,
  FileCheck2,
  BarChart3,
  Trash2,
  Percent,
  ClipboardList,
  Box,
} from "lucide-react";

/**
 * Sima AI — Screen 04: Project Overview (Standalone)
 * - Clean JSX, AR/EN i18n, RTL-first, RBAC gates.
 * - Sections: Summary header, Map & Meta, Files, Quick Actions (AI / 3D / Report / Approve), Team, Audit Log.
 * - In‑memory demo data + actions (analyze → updates match/status; approve → set PASS; re-evaluate → back to REVIEW).
 * - Self-tests badge validates i18n keys, RBAC rules, dataset shape, and translations presence.
 * - FIX: Replaced problematic lucide icons (RulerSquare, Cube) with stable ones (Ruler, Box) to avoid CDN fetch failures.
 */

// ——————————————————
// RBAC — roles & permissions
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
      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition " +
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

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "تفاصيل المشروع",
    subtitle: "تعريف شامل بالموقع والهوية والملفات والإجراءات",
    role: "الدور",

    // summary
    scope: "النطاق",
    city: "المدينة",
    style: "الطراز",
    match: "التطابق",
    status: "الحالة",
    updated: "آخر تحديث",

    // sections
    mapTitle: "موقع المشروع",
    metaTitle: "بيانات المشروع",
    filesTitle: "الملفات المرفوعة",
    actionsTitle: "إجراءات سريعة",
    teamTitle: "فريق العمل",
    logTitle: "سجل النشاط",

    // actions
    analyze: "تحليل بالذكاء",
    studio3d: "استوديو 3D",
    report: "تقرير التحليل",
    approve: "اعتماد",
    reeval: "إعادة تقييم",
    sign: "توقيع اعتماد",

    addMember: "إضافة عضو",
    name: "الاسم",
    roleLabel: "الدور في المشروع",
    add: "إضافة",

    // files
    fileName: "الملف",
    fileType: "النوع",
    fileSize: "الحجم",
    upload: "+ رفع ملف",
    download: "تنزيل",
    open: "فتح",
    remove: "حذف",

    // statuses map
    NEW: "جديد",
    REVIEW: "قيد التحليل",
    PASS: "نجاح",
    FAIL: "إخفاق",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Project Overview",
    subtitle: "Full context: site, identity, files, and actions",
    role: "Role",

    scope: "Scope",
    city: "City",
    style: "Style",
    match: "Match",
    status: "Status",
    updated: "Updated",

    mapTitle: "Project Location",
    metaTitle: "Project Data",
    filesTitle: "Uploaded Files",
    actionsTitle: "Quick Actions",
    teamTitle: "Team",
    logTitle: "Audit Log",

    analyze: "AI Evaluation",
    studio3d: "3D Studio",
    report: "Analysis Report",
    approve: "Approve",
    reeval: "Re-evaluate",
    sign: "Sign Accreditation",

    addMember: "Add member",
    name: "Name",
    roleLabel: "Project role",
    add: "Add",

    fileName: "File",
    fileType: "Type",
    fileSize: "Size",
    upload: "+ Upload file",
    download: "Download",
    open: "Open",
    remove: "Remove",

    NEW: "NEW",
    REVIEW: "UNDER REVIEW",
    PASS: "PASS",
    FAIL: "FAIL",
  },
};

// ——————————————————
// Demo dataset — one project
// ——————————————————
const INIT_PROJECT = {
  id: "P-007",
  name: "Wadi Spine",
  city: { ar: "الرياض", en: "Riyadh" },
  scope: { ar: "حضري", en: "Urban" },
  style: { ar: "رياض حديث", en: "Riyadh Contemporary" },
  lat: 24.7136,
  lng: 46.6753,
  match: 78,
  status: "REVIEW",
  updated: "2025-10-01",
  files: [
    { id: "F-01", name: "Masterplan.pdf", type: "PDF", size: "2.4 MB" },
    { id: "F-02", name: "Elevations.dwg", type: "DWG", size: "8.1 MB" },
    { id: "F-03", name: "Model.ifc", type: "IFC", size: "34.6 MB" },
  ],
  team: [
    { id: "U-01", name: "Sara Al‑Otaibi", role: { ar: "مهندس معماري", en: "Architect" } },
    { id: "U-02", name: "Khalid Al‑Harbi", role: { ar: "استشاري هوية", en: "Identity Consultant" } },
  ],
  log: [
    { t: "2025-10-01T10:05:00Z", txt: { ar: "تم إنشاء المشروع", en: "Project created" } },
    { t: "2025-10-01T11:20:00Z", txt: { ar: "رفع ملف IFC", en: "IFC uploaded" } },
    { t: "2025-10-02T09:10:00Z", txt: { ar: "بدء تحليل الهوية", en: "Identity analysis started" } },
  ],
};

const STATUS_MAP = {
  NEW: { cls: "border-slate-300 text-slate-700" },
  REVIEW: { cls: "border-amber-300 text-amber-700 bg-amber-50" },
  PASS: { cls: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  FAIL: { cls: "border-rose-300 text-rose-700 bg-rose-50" },
};

function formatDate(d, lang){
  try { return new Date(d).toLocaleString(lang === 'ar' ? 'ar' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d; }
}

// ——————————————————
// Self-tests badge (runtime)
// ——————————————————
function DevTestsBadge({ t }){
  const tests = [];
  tests.push({ name: "i18n keys", pass: !!t.title && !!t.mapTitle && !!t.actionsTitle && !!t.studio3d });
  const rbacOk = PERMISSIONS[ROLES.AUTHORITY].includes("projects.approve") && !PERMISSIONS[ROLES.CLIENT].includes("projects.approve");
  tests.push({ name: "rbac rules", pass: rbacOk });
  const datasetOk = INIT_PROJECT && Array.isArray(INIT_PROJECT.files) && Array.isArray(INIT_PROJECT.team);
  tests.push({ name: "dataset shape", pass: datasetOk });
  const statusKeys = ["NEW","REVIEW","PASS","FAIL"].every(k=> typeof t[k] === 'string');
  tests.push({ name: "status translations", pass: statusKeys });
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
// Screen 04 — Project Overview
// ——————————————————
function ProjectOverviewScreen(){
  const [lang, setLang] = useState("ar");
  const rtl = lang === "ar";
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  const [project, setProject] = useState(INIT_PROJECT);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  function analyze(){
    if (!can('ai.evaluate')) return;
    setProject(p => {
      const score = Math.max(55, Math.min(97, Math.round((p.match || 70) + (Math.random()*14 - 7))));
      const st = score >= 80 ? 'PASS' : (score < 60 ? 'FAIL' : 'REVIEW');
      return { ...p, match: score, status: st, updated: new Date().toISOString().slice(0,10), log: [{ t: new Date().toISOString(), txt: { ar: 'تم تحليل الهوية', en: 'AI evaluation completed' } }, ...p.log] };
    });
  }
  function approve(){ if (can('projects.approve')) setProject(p => ({ ...p, status: 'PASS', updated: new Date().toISOString().slice(0,10), log: [{ t: new Date().toISOString(), txt: { ar: 'تم الاعتماد', en: 'Approved' } }, ...p.log] })); }
  function reeval(){ setProject(p => ({ ...p, status: 'REVIEW', updated: new Date().toISOString().slice(0,10), log: [{ t: new Date().toISOString(), txt: { ar: 'إعادة تقييم', en: 'Re-evaluation' } }, ...p.log] })); }
  function addMember(){
    if (!memberName || !memberRole) return;
    setProject(p => ({ ...p, team: [...p.team, { id: 'U-'+(p.team.length+1).toString().padStart(2,'0'), name: memberName, role: { ar: memberRole, en: memberRole } }], log: [{ t: new Date().toISOString(), txt: { ar: `أضيف ${memberName} للفريق`, en: `${memberName} added to team` } }, ...p.log] }));
    setMemberName(""); setMemberRole("");
  }
  function removeFile(id){ setProject(p => ({ ...p, files: p.files.filter(f=>f.id!==id), log: [{ t: new Date().toISOString(), txt: { ar: 'حذف ملف', en: 'File removed' } }, ...p.log] })); }

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
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
            {/* demo role switcher */}
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
          {/* Summary header */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-[260px]">
                <div className="text-[12px] text-slate-600">{project.id}</div>
                <h1 className="text-2xl md:text-3xl font-semibold">{project.name}</h1>
                <div className="mt-1 text-[12px] text-slate-600 flex flex-wrap gap-2">
                  <Pill className="border-slate-300"><MapPin className="w-3.5 h-3.5"/> {rtl? project.city.ar : project.city.en}</Pill>
                  <Pill className="border-slate-300"><Building2 className="w-3.5 h-3.5"/> {rtl? project.scope.ar : project.scope.en}</Pill>
                  <Pill className="border-slate-300"><Layers3 className="w-3.5 h-3.5"/> {rtl? project.style.ar : project.style.en}</Pill>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Pill className="border-slate-300"><Percent className="w-3.5 h-3.5"/> {t.match}: {project.match}%</Pill>
                <Pill className={"" + (STATUS_MAP[project.status]?.cls || '')}><BadgeCheck className="w-3.5 h-3.5"/> {t[project.status]}</Pill>
                <Pill className="border-slate-300"><CalendarClock className="w-3.5 h-3.5"/> {t.updated}: {formatDate(project.updated, lang)}</Pill>
              </div>
            </div>
          </Card>

          {/* Map + Meta */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-sm font-medium mb-3">{t.mapTitle}</div>
              {/* Static map placeholder */}
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden h-[280px] bg-gradient-to-br from-blue-50 to-slate-100">
                <div className="absolute inset-0 grid place-items-center text-slate-500">
                  <div className="text-sm">Map placeholder — ({project.lat.toFixed(3)}, {project.lng.toFixed(3)})</div>
                </div>
              </div>
              <div className="mt-3 text-[12px] text-slate-600 flex flex-wrap gap-2">
                <Pill className="border-slate-300"><Ruler className="w-3.5 h-3.5"/> {t.scope}: {rtl? project.scope.ar : project.scope.en}</Pill>
                <Pill className="border-slate-300"><MapPin className="w-3.5 h-3.5"/> {t.city}: {rtl? project.city.ar : project.city.en}</Pill>
                <Pill className="border-slate-300"><Layers3 className="w-3.5 h-3.5"/> {t.style}: {rtl? project.style.ar : project.style.en}</Pill>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-medium mb-3">{t.metaTitle}</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t.scope}><Input value={rtl? project.scope.ar : project.scope.en} readOnly/></Field>
                <Field label={t.city}><Input value={rtl? project.city.ar : project.city.en} readOnly/></Field>
                <Field label={t.style}><Input value={rtl? project.style.ar : project.style.en} readOnly/></Field>
                <Field label={t.match}><Input value={`${project.match}%`} readOnly/></Field>
                <Field label={t.status}><Input value={t[project.status]} readOnly/></Field>
                <Field label={t.updated}><Input value={formatDate(project.updated, lang)} readOnly/></Field>
              </div>
            </Card>
          </div>

          {/* Files */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t.filesTitle}</div>
              <Button variant="outline"><FileUp className="w-4 h-4"/> {t.upload}</Button>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left">{t.fileName}</th>
                    <th className="px-4 py-2 text-left">{t.fileType}</th>
                    <th className="px-4 py-2 text-left">{t.fileSize}</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.files.map(f => (
                    <tr key={f.id} className="border-t">
                      <td className="px-4 py-2 font-medium text-slate-900"><FileText className="inline w-4 h-4 me-1 text-slate-400"/> {f.name}</td>
                      <td className="px-4 py-2 text-slate-700">{f.type}</td>
                      <td className="px-4 py-2 text-slate-700">{f.size}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button variant="soft"><LinkIcon className="w-4 h-4"/> {t.open}</Button>
                          <Button variant="soft"><Download className="w-4 h-4"/> {t.download}</Button>
                          <Button variant="soft" onClick={()=>removeFile(f.id)}><Trash2 className="w-4 h-4"/> {t.remove}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <div className="text-sm font-medium mb-3">{t.actionsTitle}</div>
            <div className="flex flex-wrap items-center gap-2">
              {can('ai.evaluate') ? (
                <Button onClick={analyze}><Sparkles className="w-4 h-4"/> {t.analyze}</Button>
              ) : <Button variant="soft" disabled><Sparkles className="w-4 h-4"/> {t.analyze}</Button>}

              <Button variant="outline"><Box className="w-4 h-4"/> {t.studio3d}</Button>

              {can('reports.view') ? (
                <Button variant="outline"><BarChart3 className="w-4 h-4"/> {t.report}</Button>
              ) : <Button variant="soft" disabled><BarChart3 className="w-4 h-4"/> {t.report}</Button>}

              {can('projects.approve') ? (
                <Button onClick={approve}><FileCheck2 className="w-4 h-4"/> {t.approve}</Button>
              ) : <Button variant="soft" disabled><FileCheck2 className="w-4 h-4"/> {t.approve}</Button>}

              <Button variant="ghost" onClick={reeval}><ClipboardList className="w-4 h-4"/> {t.reeval}</Button>
            </div>
          </Card>

          {/* Team */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t.teamTitle}</div>
              <div className="flex items-center gap-2">
                <Input placeholder={t.name} value={memberName} onChange={(e)=>setMemberName(e.target.value)} />
                <Input placeholder={t.roleLabel} value={memberRole} onChange={(e)=>setMemberRole(e.target.value)} />
                <Button onClick={addMember}><UserPlus className="w-4 h-4"/> {t.addMember}</Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {project.team.map(m => (
                <div key={m.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">{m.name}</div>
                  <div className="text-[12px] text-slate-600 mt-0.5">{rtl? m.role.ar : m.role.en}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Audit Log */}
          <Card className="p-6">
            <div className="text-sm font-medium mb-3">{t.logTitle}</div>
            <div className="space-y-2">
              {project.log.map((e, idx) => (
                <div key={idx} className="flex items-center gap-3 text-[12px] text-slate-700">
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

      {/* Self-tests badge */}
      <DevTestsBadge t={t} />
    </div>
  );
}

// ——————————————————
// Exported App (mount with provider)
// ——————————————————
export default function Sima_Screen04_ProjectOverview(){
  return (
    <AuthProvider>
      <ProjectOverviewScreen />
    </AuthProvider>
  );
}
