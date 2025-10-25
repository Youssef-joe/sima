import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Sima AI — Screen 08: AI Review Studio — PURE Three.js rebuild (no react‑three‑fiber)
 *
 * لماذا؟ لأن iOS/Safari كان يُظهر خطأ غامضًا (e83[t34]) من طبقة أحداث R3F.
 * هنا استبدلتها بتطبيقٍ خالص لـ Three.js داخل React:
 *  - لا توجد طبقة أحداث معقدة → ثبات أعلى على Safari/iOS.
 *  - التتبع (Raycasting) مباشر على الـ<canvas>.
 *  - اللقطة تعمل عبر preserveDrawingBuffer.
 *  - تحميل GLTF عبر GLTFLoader بدون شبكات أو HDRI.
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
const AuthCtx = React.createContext(null);
function AuthProvider({ children }){
  const [user, setUser] = useState({ email: "demo@studio.sa", role: ROLES.CONSULTANT });
  const setRole = (role)=> setUser((u)=> (u ? { ...u, role } : { email: "demo@studio.sa", role }));
  const can = (perm)=> !!(user && PERMISSIONS[user.role]?.includes(perm));
  return <AuthCtx.Provider value={{ user, setRole, can }}>{children}</AuthCtx.Provider>;
}
function useAuth(){ return useContext(AuthCtx); }

// ——————————————————
// UI primitives (بسيطة وبدون أي مكتبات خارجية للأيقونات)
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
function Field({ label, children }){ return (<div className="space-y-1.5">{label? <label className="block text-sm text-slate-700">{label}</label>:null}{children}</div>); }
function Input(props){ return <input className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" {...props}/>; }
function Textarea(props){ return <textarea className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 min-h-[90px]" {...props}/>; }
function Select({ options, ...props }){ return (
  <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
    {options.map((o,i)=> <option key={i} value={o.value}>{o.label}</option>)}
  </select>
); }

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "استوديو المراجعة — شات + ملاحظات + قبل/بعد",
    subtitle: "ضع ملاحظات على المجسم، واحصل على توصيات وطبّقها لترى التأثير فورًا",
    load: "تحميل GLTF/GLB",
    day: "نهار",
    night: "ليل",
    wire: "سلكي",
    chat: "المساعد الذكي",
    note: "الملاحظة",
    suggestion: "التوصية",
    action: "نوع الإجراء",
    apply: "تطبيق",
    applyAll: "تطبيق الكل",
    export: "تصدير JSON",
    snapshot: "حفظ لقطة",
    before: "قبل",
    after: "بعد",
    placeholder: "لا يوجد نموذج — يمكنك إسقاط GLTF/GLB أو النقر لوضع ملاحظات على الصندوق التجريبي",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Review Studio — Chat + Notes + Before/After",
    subtitle: "Drop notes on the model, get recommendations and apply them to see the effect instantly",
    load: "Load GLTF/GLB",
    day: "Day",
    night: "Night",
    wire: "Wireframe",
    chat: "AI Assistant",
    note: "Note",
    suggestion: "Suggestion",
    action: "Action type",
    apply: "Apply",
    applyAll: "Apply all",
    export: "Export JSON",
    snapshot: "Save snapshot",
    before: "Before",
    after: "After",
    placeholder: "No model loaded — drag a GLTF/GLB here or click the demo box to attach notes",
  }
};

// ——————————————————
// Three helpers
// ——————————————————
function createScene({ day }){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(day ? 0xeef2ff : 0x0b1220);
  const amb = new THREE.AmbientLight(0xffffff, day ? 0.35 : 0.12);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, day ? 1.2 : 0.5);
  dir.position.set(8, 10, 6);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);

  // ground + soft shadow
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: day ? 0.22 : 0.32 })
  );
  ground.receiveShadow = true;
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  return { scene, dir };
}

function makePlaceholder({ wireframe=false }){
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xa3b1c6, wireframe })
  );
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function worldNormalFrom(inter){
  const n = inter.face?.normal?.clone() || new THREE.Vector3(0,1,0);
  inter.object.updateMatrixWorld(true);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(inter.object.matrixWorld);
  return n.applyMatrix3(normalMatrix).normalize();
}

function buildShadePanel(){
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.4), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.1, roughness: 0.4 }));
  plate.position.y = 0.05;
  plate.castShadow = plate.receiveShadow = true;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
  arm.position.set(0, 0.02, 0.2);
  arm.castShadow = true;
  g.add(plate, arm);
  return g;
}

function buildWWRPanel(){
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.02), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  glass.castShadow = glass.receiveShadow = true;
  g.add(glass);
  return g;
}

// ——————————————————
// Main Screen (React + pure Three.js)
// ——————————————————
export default function Sima_Screen08_AIReviewStudio(){
  return (
    <AuthProvider>
      <AIReviewStudio />
    </AuthProvider>
  );
}

function AIReviewStudio(){
  const [lang, setLang] = useState("ar");
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const sceneRef = useRef(null);
  const modelGroupRef = useRef(new THREE.Group());
  const notesGroupRef = useRef(new THREE.Group());
  const appliedGroupRef = useRef(new THREE.Group());

  const [day, setDay] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [afterMode, setAfterMode] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const sel = notes.find(n=> n.id === selectedId) || null;
  const [chat, setChat] = useState([{ role:'assistant', text: rtl? 'مرحبًا! انقر على المجسم لإضافة ملاحظة وسأقترح تحسينًا.' : 'Hi! Click the model to add a note and I will suggest a fix.' }]);
  const [draft, setDraft] = useState("");

  // Init Three
  useEffect(()=>{
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, preserveDrawingBuffer:true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);

    const camera = new THREE.PerspectiveCamera(50, (canvas.clientWidth||1)/(canvas.clientHeight||1), 0.1, 100);
    camera.position.set(6,4,6);

    const { scene, dir } = createScene({ day });
    sceneRef.current = scene;

    // groups
    scene.add(modelGroupRef.current);
    scene.add(notesGroupRef.current);
    scene.add(appliedGroupRef.current);

    // placeholder
    const placeholder = makePlaceholder({ wireframe });
    modelGroupRef.current.add(placeholder);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI/2 - 0.05;

    function onResize(){
      const { clientWidth, clientHeight } = canvas;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    let rafId;
    const tick = ()=>{
      controls.update();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    tick();

    // pointer pick
    const rc = new THREE.Raycaster();
    function toNDC(ev){
      const rect = canvas.getBoundingClientRect();
      return new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
    }
    function onPointerDown(ev){
      const ndc = toNDC(ev);
      rc.setFromCamera(ndc, camera);
      const hit = rc.intersectObjects(modelGroupRef.current.children, true)[0];
      if(hit){
        const p = hit.point.clone();
        const n = worldNormalFrom(hit);
        const id = "N-" + (notesRef.current.length+1).toString().padStart(2,'0');
        const text = rtl? 'تعزيز التظليل في هذه الواجهة' : 'Improve shading on this facade';
        const suggestion = rtl? 'إضافة مظلة أفقية وتقليل نسبة الفتحات' : 'Add a horizontal canopy and reduce WWR';
        const entry = { id, pos:[p.x,p.y,p.z], normal:[n.x,n.y,n.z], text, suggestion, action:'shade', applied:false };
        setNotes(v=> [...v, entry]);
        setSelectedId(id);
        setChat(v=> [...v, { role:'user', text: (rtl? 'ملاحظة: ' : 'Note: ') + text }, { role:'assistant', text: (rtl? 'اقترح: ' : 'Suggest: ') + suggestion }]);
      }
    }
    canvas.addEventListener('pointerdown', onPointerDown, { passive:false });

    // store refs
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;

    return ()=>{
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep day/night & wireframe in sync
  useEffect(()=>{
    const scene = sceneRef.current; if(!scene) return;
    scene.background = new THREE.Color(day ? 0xeef2ff : 0x0b1220);
    scene.traverse((o)=>{
      if(o.isMesh && o.material){
        if (Array.isArray(o.material)) o.material.forEach(m=> m.wireframe = !!wireframe);
        else o.material.wireframe = !!wireframe;
      }
    });
  }, [day, wireframe]);

  // load GLTF if provided
  useEffect(()=>{
    const group = modelGroupRef.current; if(!group) return;
    // clear current model (keep notes/applied)
    group.clear();
    if(!modelUrl){
      group.add(makePlaceholder({ wireframe }));
      return;
    }
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf)=>{
      const root = gltf.scene;
      root.traverse((o)=>{
        if(o.isMesh){
          o.castShadow = o.receiveShadow = true;
          if (o.material){
            if (Array.isArray(o.material)) o.material.forEach(m=> m.wireframe = !!wireframe);
            else o.material.wireframe = !!wireframe;
          }
        }
      });
      group.add(root);
    }, undefined, (err)=>{ console.error('GLTF load error', err); group.add(makePlaceholder({ wireframe })); });
  }, [modelUrl, wireframe]);

  // reflect notes in scene (markers + applied)
  const notesRef = useRef(notes);
  useEffect(()=>{ notesRef.current = notes; }, [notes]);
  useEffect(()=>{
    const notesGroup = notesGroupRef.current; const appliedGroup = appliedGroupRef.current;
    if(!notesGroup || !appliedGroup) return;
    notesGroup.clear(); appliedGroup.clear();

    for(const n of notes){
      // marker
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshStandardMaterial({ color: n.applied? 0x10b981 : 0xeab308, emissive: n.applied? 0x065f46 : 0x78350f, emissiveIntensity: 0.2 }));
      marker.position.set(...n.pos);
      notesGroup.add(marker);

      // applied geometry
      if(n.applied && afterMode){
        const up = new THREE.Vector3(0,1,0);
        const nrm = new THREE.Vector3(...n.normal).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(up, nrm);
        let g = n.action==='wwr' ? buildWWRPanel() : buildShadePanel();
        g.position.set(...n.pos);
        g.setRotationFromQuaternion(quat);
        appliedGroup.add(g);
      }
    }
  }, [notes, afterMode]);

  function onFile(e){ const f=e.target.files?.[0]; if(!f)return; if(!/\.(gltf|glb)$/i.test(f.name)){ alert(rtl? 'اختر GLTF/GLB' : 'Select GLTF/GLB'); return;} setModelUrl(URL.createObjectURL(f)); }

  function applyOne(id){
    const n = notes.find(x=>x.id===id); if(!n) return;
    if (!can('ai.evaluate')) { alert(rtl? 'لا تملك صلاحية التعديل' : 'No permission to modify'); return; }
    setNotes(v=> v.map(x=> x.id===id? { ...x, applied:true } : x));
    setAfterMode(true);
  }
  function applyAll(){ if(!can('ai.evaluate')){ alert(rtl? 'لا تملك صلاحية التعديل' : 'No permission'); return;} setNotes(v=> v.map(x=> ({...x, applied:true}))); setAfterMode(true); }
  function removeNote(id){ setNotes(v=> v.filter(x=> x.id!==id)); if(selectedId===id) setSelectedId(null); }

  function exportJSON(){
    const payload = { modelUrl, notes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='sima_ai_review_notes.json'; a.click(); URL.revokeObjectURL(url);
  }
  function snapshot(){
    try{
      const el = rendererRef.current?.domElement || canvasRef.current;
      if(!el || typeof el.toDataURL !== 'function'){ alert(rtl? 'لقطة غير مدعومة' : 'Snapshot not supported'); return; }
      const data = el.toDataURL('image/png'); const a=document.createElement('a'); a.href=data; a.download='sima_ai_review.png'; a.click();
    }catch{ alert(rtl? 'تعذر حفظ اللقطة' : 'Unable to save snapshot'); }
  }

  return (
    <div dir={rtl? 'rtl':'ltr'} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff]">
      <header className="px-6 md:px-10 py-5 sticky top-0 z-40 bg-[#f6f9ff]/80 backdrop-blur border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center shadow-sm text-white text-xs font-bold">SA</div>
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

      <main className="px-6 md:px-10 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-4">
          <Card className="lg:col-span-8 p-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200">
              <div className="absolute top-2 right-2 flex flex-wrap items-center gap-2 text-[12px] z-10">
                <Button variant={day? 'solid':'outline'} onClick={()=>setDay(true)}>☀️ {t.day}</Button>
                <Button variant={!day? 'solid':'outline'} onClick={()=>setDay(false)}>🌙 {t.night}</Button>
                <Button variant={wireframe? 'solid':'outline'} onClick={()=>setWireframe(w=>!w)}>🧵 {t.wire}</Button>
                <Button variant="outline" onClick={snapshot}>📸 {t.snapshot}</Button>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-2 z-10">
                <Button variant={afterMode? 'outline':'solid'} onClick={()=>setAfterMode(false)}>👁️ {t.before}</Button>
                <Button variant={!afterMode? 'outline':'solid'} onClick={()=>setAfterMode(true)}>🙈 {t.after}</Button>
              </div>

              <canvas ref={canvasRef} className="w-full aspect-[16/9] block" />

              <div className="absolute bottom-2 left-2 text-[11px] bg-white/80 backdrop-blur rounded-xl px-2 py-1 border border-slate-200 z-10">
                {modelUrl ? (rtl? 'انقر لوضع ملاحظة' : 'Click to add a note') : (rtl? 'اختر ملف GLTF/GLB من اللوحة اليمنى' : 'Choose a GLTF/GLB from the right panel')}
              </div>
            </div>
          </Card>

          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5">
              <div className="text-sm font-medium mb-3">{t.load}</div>
              <label className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                <span>⬇️</span>
                <span>{modelUrl ? (rtl? 'تغيير الملف' : 'Change file') : (rtl? 'اختيار ملف' : 'Choose file')}</span>
                <input type="file" className="hidden" accept=".gltf,.glb" onChange={onFile} />
              </label>
              {!modelUrl && <div className="mt-2 text-[11px] text-slate-500">{t.placeholder}</div>}
            </Card>

            <Card className="p-5">
              <div className="text-sm font-medium mb-3">{t.chat}</div>

              <div className="space-y-2">
                <Field label={t.note}><Textarea value={sel?.text || ''} onChange={(e)=> sel && setNotes(v=> v.map(x=> x.id===sel.id? { ...x, text:e.target.value } : x))} placeholder={rtl? 'اكتب ملاحظة…' : 'Write a note…'} /></Field>
                <Field label={t.suggestion}><Textarea value={sel?.suggestion || ''} onChange={(e)=> sel && setNotes(v=> v.map(x=> x.id===sel.id? { ...x, suggestion:e.target.value } : x))} placeholder={rtl? 'اقتراح تحسين…' : 'Suggestion…'} /></Field>
                <Field label={t.action}>
                  <Select value={sel?.action || 'shade'} onChange={(e)=> sel && setNotes(v=> v.map(x=> x.id===sel.id? { ...x, action:e.target.value } : x))} options={[
                    { value:'shade', label: rtl? 'مظلة تظليل' : 'Shading canopy' },
                    { value:'wwr', label: rtl? 'تقليل WWR' : 'Reduce WWR' },
                    { value:'material', label: rtl? 'تحسين مادة' : 'Material tweak' },
                  ]} />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={()=> sel && applyOne(sel.id)}>✨ {t.apply}</Button>
                  <Button variant="outline" onClick={applyAll}>✅ {t.applyAll}</Button>
                  {sel ? <Button variant="soft" onClick={()=>removeNote(sel.id)}>🗑️ {rtl? 'حذف':'Remove'}</Button> : null}
                </div>
              </div>

              <div className="mt-4 max-h-[260px] overflow-auto space-y-2">
                {[{role:'assistant', text: rtl? 'انقر على الواجهة لإضافة ملاحظة—سأقترح تحسينًا تلقائيًا.' : 'Click a facade to add a note—I will suggest a fix.'}, ...chat].map((m,i)=> (
                  <div key={i} className={("rounded-2xl px-3 py-2 text-sm ") + (m.role==='assistant'? 'bg-slate-50 text-slate-800' : 'bg-blue-50 text-slate-900')}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder={rtl? 'اسأل المساعد…' : 'Ask the assistant…'} />
                <Button onClick={()=>{ if(!draft) return; setChat(v=> [...v, { role:'user', text:draft }, { role:'assistant', text: (rtl? 'توصية: ':'Suggestion: ') + (sel? sel.suggestion : (rtl? 'راجع التظليل وWWR':'Review shading & WWR')) } ]); setDraft(''); }}>＋</Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-medium mb-3">{rtl? 'إجراءات عامة':'Global actions'}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportJSON}>⬇️ {t.export}</Button>
                <Button variant="outline" onClick={snapshot}>📸 {t.snapshot}</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>
    </div>
  );
}

// Self‑checks (console):
if (typeof window !== 'undefined'){
  try{
    const should = (cond, msg)=> console[cond? 'log':'error']("[TEST] "+msg+": ", cond? 'OK':'FAILED');
    should(PERMISSIONS[ROLES.AUTHORITY].includes('ai.evaluate'), 'Authority can ai.evaluate');
    should(!PERMISSIONS[ROLES.CLIENT].includes('ai.evaluate'), 'Client cannot ai.evaluate');
    ['brand','title','day','night'].forEach(k=> should(!!T.ar[k] && !!T.en[k], 'i18n has '+k));
  }catch(err){ console.error('[TEST] runtime self-check threw', err); }
}
