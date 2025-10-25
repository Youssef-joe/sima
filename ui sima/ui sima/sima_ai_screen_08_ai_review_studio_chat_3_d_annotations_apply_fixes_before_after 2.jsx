import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

/**
 * Sima AI — Screen 08: AI Review Studio — PURE Three.js (no R3F)
 *
 * Added in this version:
 * 1) Local **DracoLoader** support (expects decoder files under `./draco/`).
 * 2) **Before/After Split-View** (dual canvas with slider handle, single render loop).
 * 3) **Color-coded markers by action** + searchable **Notes list** in the side panel.
 *
 * No network calls; if Draco decoder files are missing, loading falls back to plain GLTF.
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
function Field({ label, children }){ return (<div className="space-y-1.5">{label? <label className="block text-sm text-slate-700">{label}</label>:null}{children}</div>); }
function Input(props){ return <input className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" {...props}/>; }
function Textarea(props){ return <textarea className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 min-h-[90px]" {...props}/>; }
function Select({ options, ...props }){ return (
  <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
    {options.map((o,i)=> <option key={i} value={o.value}>{o.label}</option>)}
  </select>
); }
function Pill({ children, className = "" }){ return <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] " + className}>{children}</span>; }

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "استوديو المراجعة — شات + ملاحظات + قبل/بعد",
    subtitle: "ضع ملاحظات على المجسم، واحصل على توصيات وطبّقها لترى التأثير فورًا",
    load: "تحميل GLTF/GLB (يدعم Draco)",
    day: "نهار",
    night: "ليل",
    grid: "الشبكة",
    wire: "سلكي",
    chat: "المساعد الذكي",
    note: "الملاحظة",
    suggestion: "التوصية",
    action: "نوع الإجراء",
    addNote: "إضافة ملاحظة",
    apply: "تطبيق",
    applyAll: "تطبيق الكل",
    export: "تصدير JSON",
    snapshot: "حفظ لقطة",
    before: "قبل",
    after: "بعد",
    placeholder: "لا يوجد نموذج — اختر GLTF/GLB أو انقر لإضافة ملاحظات على الصندوق التجريبي",
    notes: "الملاحظات",
    searchNotes: "بحث في الملاحظات",
    split: "مقارنة قبل/بعد",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Review Studio — Chat + Notes + Before/After",
    subtitle: "Drop notes on the model, get recommendations and apply them to see the effect instantly",
    load: "Load GLTF/GLB (Draco supported)",
    day: "Day",
    night: "Night",
    grid: "Grid",
    wire: "Wireframe",
    chat: "AI Assistant",
    note: "Note",
    suggestion: "Suggestion",
    action: "Action type",
    addNote: "Add note",
    apply: "Apply",
    applyAll: "Apply all",
    export: "Export JSON",
    snapshot: "Save snapshot",
    before: "Before",
    after: "After",
    placeholder: "No model loaded — choose a GLTF/GLB or click to add notes on the demo box",
    notes: "Notes",
    searchNotes: "Search notes",
    split: "Before/After compare",
  }
};

// ——————————————————
// 3D helpers
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
  plate.position.y = 0.05; plate.castShadow = plate.receiveShadow = true;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
  arm.position.set(0, 0.02, 0.2); arm.castShadow = true;
  g.add(plate, arm); return g;
}
function buildWWRPanel(){
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.02), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  glass.castShadow = glass.receiveShadow = true;
  g.add(glass); return g;
}

function colorsFor(action, applied){
  const base = action === 'shade' ? 0xf59e0b : action === 'wwr' ? 0x3b82f6 : 0x8b5cf6; // amber / blue / violet
  const emi  = action === 'shade' ? 0x78350f : action === 'wwr' ? 0x1e3a8a : 0x4c1d95;
  const ok   = applied ? 0x10b981 : base; // green if applied
  const eok  = applied ? 0x065f46 : emi;
  return { color: ok, emissive: eok };
}

// ——————————————————
// Main Screen
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

  // canvases (before & after stacked)
  const beforeRef = useRef(null);
  const afterRef  = useRef(null);
  const rendererBeforeRef = useRef(null);
  const rendererAfterRef  = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const sceneRef = useRef(null);
  const modelGroupRef = useRef(new THREE.Group());
  const notesGroupRef = useRef(new THREE.Group());
  const appliedGroupRef = useRef(new THREE.Group());

  const [day, setDay] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [split, setSplit] = useState(50); // % of AFTER (top canvas) visible from the left
  const [dragging, setDragging] = useState(false);

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [noteQ, setNoteQ] = useState("");
  const sel = notes.find(n=> n.id === selectedId) || null;

  const [chat, setChat] = useState([ { role:'assistant', text: rtl? 'مرحبًا! انقر على المجسم لإضافة ملاحظة وسأقترح تحسينًا.' : 'Hi! Click the model to add a note and I will suggest a fix.' } ]);
  const [draft, setDraft] = useState("");

  // Init Two Renderers, One Scene
  useEffect(()=>{
    const cA = afterRef.current; const cB = beforeRef.current;
    const rA = new THREE.WebGLRenderer({ canvas:cA, antialias:true, alpha:false, preserveDrawingBuffer:true });
    const rB = new THREE.WebGLRenderer({ canvas:cB, antialias:true, alpha:false, preserveDrawingBuffer:true });
    rA.shadowMap.enabled = rB.shadowMap.enabled = true;
    const setSize = ()=>{
      const w = cA.clientWidth || 1, h = cA.clientHeight || 1;
      rA.setSize(w,h,false); rB.setSize(w,h,false);
      const cam = cameraRef.current; if(cam){ cam.aspect = w/h; cam.updateProjectionMatrix(); }
    };

    const cam = new THREE.PerspectiveCamera(50, 16/9, 0.1, 100);
    cam.position.set(6,4,6); cameraRef.current = cam;

    const { scene } = createScene({ day }); sceneRef.current = scene;
    scene.add(modelGroupRef.current, notesGroupRef.current, appliedGroupRef.current);
    modelGroupRef.current.add(makePlaceholder({ wireframe }));

    const controls = new OrbitControls(cam, cA); // attach to top canvas
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI/2 - 0.05;
    controlsRef.current = controls;

    const rc = new THREE.Raycaster();
    function onDown(ev){
      const rect = cA.getBoundingClientRect();
      const ndc = new THREE.Vector2(((ev.clientX-rect.left)/rect.width)*2-1, -((ev.clientY-rect.top)/rect.height)*2+1);
      rc.setFromCamera(ndc, cam);
      const hit = rc.intersectObjects(modelGroupRef.current.children, true)[0];
      if(hit){
        const p = hit.point.clone(); const nrm = worldNormalFrom(hit);
        const id = "N-" + (notesRef.current.length+1).toString().padStart(2,'0');
        const text = rtl? 'تعزيز التظليل في هذه الواجهة' : 'Improve shading on this facade';
        const suggestion = rtl? 'إضافة مظلة أفقية وتقليل نسبة الفتحات' : 'Add a horizontal canopy and reduce WWR';
        const entry = { id, pos:[p.x,p.y,p.z], normal:[nrm.x,nrm.y,nrm.z], text, suggestion, action:'shade', applied:false };
        setNotes(v=> [...v, entry]); setSelectedId(id);
        setChat(v=> [...v, { role:'user', text: (rtl? 'ملاحظة: ' : 'Note: ') + text }, { role:'assistant', text: (rtl? 'اقترح: ' : 'Suggest: ') + suggestion }]);
      }
    }
    cA.addEventListener('pointerdown', onDown);

    const onResize = ()=> setSize(); window.addEventListener('resize', onResize); setSize();

    let raf;
    const tick = ()=>{
      controls.update();
      // BEFORE render (hide applied)
      appliedGroupRef.current.visible = false;
      rB.render(scene, cam);
      // AFTER render (show applied)
      appliedGroupRef.current.visible = true;
      rA.render(scene, cam);
      raf = requestAnimationFrame(tick);
    };
    tick();

    rendererAfterRef.current = rA; rendererBeforeRef.current = rB;
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); cA.removeEventListener('pointerdown', onDown); controls.dispose(); rA.dispose(); rB.dispose(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync day/wireframe
  useEffect(()=>{ const scene = sceneRef.current; if(!scene) return; scene.background = new THREE.Color(day?0xeef2ff:0x0b1220); scene.traverse(o=>{ if(o.isMesh&&o.material){ Array.isArray(o.material) ? o.material.forEach(m=> m.wireframe=!!wireframe) : (o.material.wireframe=!!wireframe); }}); }, [day, wireframe]);

  // Draco-enabled loader
  function loadModel(url){
    const group = modelGroupRef.current; if(!group) return;
    group.clear();
    const loader = new GLTFLoader();
    try{
      const draco = new DRACOLoader();
      // expects files under ./draco/ : draco_decoder.js | draco_wasm_wrapper.js | draco_decoder.wasm
      draco.setDecoderPath('./draco/');
      draco.setDecoderConfig({ type:'js' }); // fall back to JS; if wasm available it will still work.
      loader.setDRACOLoader(draco);
    }catch(e){ console.warn('DRACO not configured, will load plain GLTF', e); }

    loader.load(url, (gltf)=>{
      const root = gltf.scene;
      root.traverse(o=>{ if(o.isMesh){ o.castShadow=o.receiveShadow=true; if(o.material){ Array.isArray(o.material)? o.material.forEach(m=> m.wireframe=!!wireframe) : (o.material.wireframe=!!wireframe); } }});
      group.add(root);
    }, undefined, (err)=>{ console.error('GLTF load error', err); group.add(makePlaceholder({ wireframe })); });
  }

  // When modelUrl changes
  useEffect(()=>{ const group = modelGroupRef.current; if(!group) return; if(!modelUrl){ group.clear(); group.add(makePlaceholder({ wireframe })); return; } loadModel(modelUrl); }, [modelUrl, wireframe]);

  // Reflect notes in scene
  const notesRef = useRef(notes); useEffect(()=>{ notesRef.current=notes; }, [notes]);
  useEffect(()=>{
    const notesGroup = notesGroupRef.current; const appliedGroup = appliedGroupRef.current; if(!notesGroup||!appliedGroup) return;
    notesGroup.clear(); appliedGroup.clear();
    for(const n of notes){
      const { color, emissive } = colorsFor(n.action, n.applied);
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity:0.22 }));
      marker.position.set(...n.pos); notesGroup.add(marker);
      if(n.applied){
        const up=new THREE.Vector3(0,1,0), nrm=new THREE.Vector3(...n.normal).normalize();
        const quat=new THREE.Quaternion().setFromUnitVectors(up, nrm);
        let g = n.action==='wwr' ? buildWWRPanel() : buildShadePanel();
        g.position.set(...n.pos); g.setRotationFromQuaternion(quat); appliedGroup.add(g);
      }
    }
  }, [notes]);

  function onFile(e){ const f=e.target.files?.[0]; if(!f)return; if(!/\.(gltf|glb)$/i.test(f.name)){ alert(rtl? 'اختر GLTF/GLB' : 'Select GLTF/GLB'); return;} setModelUrl(URL.createObjectURL(f)); }

  function applyOne(id){ const n=notes.find(x=>x.id===id); if(!n) return; if(!can('ai.evaluate')){ alert(rtl? 'لا تملك صلاحية التعديل':'No permission'); return;} setNotes(v=> v.map(x=> x.id===id? {...x, applied:true} : x)); }
  function applyAll(){ if(!can('ai.evaluate')){ alert(rtl? 'لا تملك صلاحية التعديل':'No permission'); return;} setNotes(v=> v.map(x=> ({...x, applied:true}))); }
  function removeNote(id){ setNotes(v=> v.filter(x=> x.id!==id)); if(selectedId===id) setSelectedId(null); }
  function exportJSON(){ const payload={ modelUrl, notes }; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='sima_ai_review_notes.json'; a.click(); URL.revokeObjectURL(url);}  
  function snapshot(){ try{ const el=afterRef.current; if(!el||typeof el.toDataURL!=='function'){ alert(rtl? 'لقطة غير مدعومة':'Snapshot not supported'); return;} const data=el.toDataURL('image/png'); const a=document.createElement('a'); a.href=data; a.download='sima_ai_review.png'; a.click(); }catch{ alert(rtl? 'تعذر حفظ اللقطة':'Unable to save snapshot'); } }

  // Split handle drag
  function onDragStart(e){ setDragging(true); }
  function onDragEnd(){ setDragging(false); }
  function onDragMove(e){ if(!dragging) return; const rect=afterRef.current.getBoundingClientRect(); const x=Math.max(0, Math.min(rect.width, e.clientX-rect.left)); setSplit(Math.round((x/rect.width)*100)); }

  const filteredNotes = notes.filter(n=> (noteQ? (n.text+n.suggestion+n.id).toLowerCase().includes(noteQ.toLowerCase()) : true));
  const actionLabel = (a)=> a==='shade' ? (rtl? 'تظليل' : 'Shading') : a==='wwr' ? 'WWR' : (rtl? 'مادة' : 'Material');

  return (
    <div dir={rtl? 'rtl':'ltr'} className="min-h-screen w-full text-slate-900 bg-[#f6f9ff] select-none">
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
              {/* controls */}
              <div className="absolute top-2 right-2 flex flex-wrap items-center gap-2 text-[12px] z-20">
                <Button variant={day? 'solid':'outline'} onClick={()=>setDay(true)}>☀️ {t.day}</Button>
                <Button variant={!day? 'solid':'outline'} onClick={()=>setDay(false)}>🌙 {t.night}</Button>
                <Button variant={wireframe? 'solid':'outline'} onClick={()=>setWireframe(w=>!w)}>🧵 {t.wire}</Button>
                <Button variant="outline" onClick={snapshot}>📸 {t.snapshot}</Button>
              </div>

              {/* dual canvases */}
              <div className="relative w-full aspect-[16/9]">
                <canvas ref={beforeRef} className="absolute inset-0 w-full h-full block"/>
                <canvas ref={afterRef}  className="absolute inset-0 w-full h-full block" style={{ clipPath:`inset(0 ${100-split}% 0 0)` }}/>
                {/* handle */}
                <div
                  className="absolute top-0 bottom-0 -translate-x-1/2 w-1.5 bg-slate-900/70 cursor-col-resize"
                  style={{ left: `${split}%` }}
                  onPointerDown={onDragStart}
                />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-[var(--x)] pointer-events-none" style={{"--x": `${split}%`}}>
                  <div className="rounded-full bg-slate-900 text-white text-[10px] px-2 py-1">{t.split}: {split}%</div>
                </div>
              </div>

              <div className="absolute inset-0" onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}/>

              {/* hint */}
              <div className="absolute bottom-2 left-2 text-[11px] bg-white/80 backdrop-blur rounded-xl px-2 py-1 border border-slate-200 z-10">
                {modelUrl ? (rtl? 'انقر لوضع ملاحظة — اسحب للمقارنة' : 'Click to add a note — drag to compare') : (rtl? 'اختر ملف GLTF/GLB من اللوحة اليمنى' : 'Choose a GLTF/GLB from the right panel')}
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
              <div className="text-sm font-medium mb-3 flex items-center gap-2">🗒️ {t.notes}</div>
              <div className="mb-2"><Input value={noteQ} onChange={(e)=>setNoteQ(e.target.value)} placeholder={t.searchNotes} /></div>
              <div className="max-h-[220px] overflow-auto space-y-2 pr-1">
                {filteredNotes.map(n=>{
                  const { color } = colorsFor(n.action, n.applied);
                  return (
                    <button key={n.id} onClick={()=>setSelectedId(n.id)} className={("w-full text-left rounded-xl border px-3 py-2 text-sm flex items-center gap-2 ")+ (selectedId===n.id? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50')}>
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background:`#${color.toString(16).padStart(6,'0')}` }}/>
                      <span className="text-[11px] text-slate-500">{n.id}</span>
                      <span className="truncate grow">{n.text}</span>
                      <Pill className="ml-2">{actionLabel(n.action)}</Pill>
                      {n.applied ? <Pill className="border-emerald-300 bg-emerald-50 text-emerald-700">✓</Pill> : null}
                    </button>
                  );
                })}
                {!filteredNotes.length && <div className="text-[12px] text-slate-500">{rtl? 'لا توجد ملاحظات':'No notes yet'}</div>}
              </div>
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
                  <Button variant="outline" onClick={exportJSON}>⬇️ {t.export}</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>
    </div>
  );
}

// Self‑checks
if (typeof window !== 'undefined'){
  try{
    const should = (cond, msg)=> console[cond? 'log':'error']("[TEST] "+msg+": ", cond? 'OK':'FAILED');
    should(PERMISSIONS[ROLES.AUTHORITY].includes('ai.evaluate'), 'Authority can ai.evaluate');
    should(!PERMISSIONS[ROLES.CLIENT].includes('ai.evaluate'), 'Client cannot ai.evaluate');
    ['brand','title','day','night','notes'].forEach(k=> should(!!T.ar[k] && !!T.en[k], 'i18n has '+k));
  }catch(err){ console.error('[TEST] runtime self-check threw', err); }
}
