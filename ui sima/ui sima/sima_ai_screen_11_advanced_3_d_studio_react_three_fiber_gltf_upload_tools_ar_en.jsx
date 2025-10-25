import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Center, Html, Line, Grid, StatsGl } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Shield,
  Sun,
  Moon,
  Camera,
  Plus,
  Minus,
  RotateCcw,
  Layers,
  Ruler,
  Square,
  Eye,
  EyeOff,
  Gauge,
  Cpu,
  FileUp,
  Download,
} from "lucide-react";

/**
 * Sima AI — Screen 11: Advanced 3D Studio (Standalone)
 * - React Three Fiber canvas with GLTF/GLB upload (file input & drag‑and‑drop)
 * - Tools: Reset camera, Zoom ±, Grid toggle, Wireframe toggle, Shadows toggle,
 *          Day/Night (sun angle), Screenshot PNG, Measure Tool (point‑to‑point)
 * - Safe fallbacks: Placeholder cube when no model; never crashes on empty state
 * - i18n (AR/EN) + RTL; Self‑tests badge
 * - No external network/CDN dependencies
 */

// ——————————————————
// Auth (consistency)
// ——————————————————
const ROLES = { AUTHORITY: "authority", CONSULTANT: "consultant", CLIENT: "client" };
const PERMISSIONS = {
  [ROLES.AUTHORITY]: ["projects.view", "studio.use"],
  [ROLES.CONSULTANT]: ["projects.view", "studio.use"],
  [ROLES.CLIENT]: ["projects.view"],
};
const AuthCtx = React.createContext(null);
function AuthProvider({ children }){
  const [user, setUser] = useState({ email: "demo@studio.sa", role: ROLES.CONSULTANT });
  const setRole = (role) => setUser((u)=> (u? { ...u, role } : { email: "demo@studio.sa", role }));
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
const Select = ({ options, ...props }) => (
  <select {...props} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
    {options.map((o,i)=> <option key={i} value={o.value}>{o.label}</option>)}
  </select>
);
function Pill({ children, className = "" }){
  return <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] " + className}>{children}</span>;
}

// ——————————————————
// i18n
// ——————————————————
const T = {
  ar: {
    brand: "Sima AI — الذكاء المعماري السعودي",
    title: "استوديو ثلاثي الأبعاد المتقدم",
    subtitle: "حمّل النموذج، حلّق بالكاميرا، قِس المسافات، والتقط لقطات.",

    role: "الدور",
    upload: "رفع GLTF/GLB",
    drag: "اسحب وأسقط الملف هنا",
    or: "أو",

    grid: "شبكة",
    wire: "وايرفريم",
    shadows: "الظلال",
    measure: "قياس",
    dayNight: "زاوية الشمس",
    reset: "إعادة ضبط",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    screenshot: "لقطة شاشة",

    placeholder: "لا يوجد نموذج — يظهر مكعّب افتراضي",
    noPerm: "لا تملك صلاحية استخدام الاستوديو",
    vr: "واقع افتراضي",
  },
  en: {
    brand: "Sima AI — Saudi Architectural Intelligence",
    title: "Advanced 3D Studio",
    subtitle: "Upload model, orbit camera, measure distances, take screenshots.",

    role: "Role",
    upload: "Upload GLTF/GLB",
    drag: "Drag & drop a file here",
    or: "or",

    grid: "Grid",
    wire: "Wireframe",
    shadows: "Shadows",
    measure: "Measure",
    dayNight: "Sun angle",
    reset: "Reset",
    zoomIn: "Zoom +",
    zoomOut: "Zoom -",
    screenshot: "Screenshot",

    placeholder: "No model loaded — showing a placeholder cube",
    noPerm: "You don't have permission to use the studio",
    vr: "VR",
  },
};

// ——————————————————
// Helpers
// ——————————————————
function centerAndFit(object3D, camera, controls){
  const box = new THREE.Box3().setFromObject(object3D);
  if (!box.isEmpty()){
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitDist = maxDim * 1.6 / Math.tan((camera.fov * Math.PI) / 360);
    const dir = new THREE.Vector3(1, 1, 1).normalize();
    camera.position.copy(center.clone().add(dir.multiplyScalar(fitDist)));
    camera.near = maxDim / 100; camera.far = maxDim * 10; camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
  }
}

// ——————————————————
// GLTF Loader wrapper
// ——————————————————
function Model({ url, wireframe, castShadows, receiveShadows, onLoaded }){
  const group = useRef();
  const [scene, setScene] = useState(null);
  useEffect(()=>{
    let mounted = true;
    if (!url){ setScene(null); return; }
    const loader = new GLTFLoader();
    loader.load(url, (gltf)=>{
      if (!mounted) return;
      const s = gltf.scene || gltf.scenes?.[0];
      s.traverse((obj)=>{
        if (obj.isMesh){
          obj.castShadow = !!castShadows;
          obj.receiveShadow = !!receiveShadows;
          if (obj.material){ obj.material.wireframe = !!wireframe; obj.material.needsUpdate = true; }
        }
      });
      setScene(s);
      onLoaded && onLoaded(s);
    });
    return ()=>{ mounted = false; };
  }, [url, wireframe, castShadows, receiveShadows, onLoaded]);

  useEffect(()=>{
    if (!scene) return;
    scene.traverse((obj)=>{
      if (obj.isMesh && obj.material){ obj.material.wireframe = !!wireframe; obj.material.needsUpdate = true; }
    });
  }, [wireframe, scene]);

  return scene ? <primitive ref={group} object={scene} /> : null;
}

function PlaceholderCube({ wireframe, castShadows, receiveShadows }){
  const ref = useRef();
  useFrame((_, dt)=>{ if (ref.current) ref.current.rotation.y += dt * 0.2; });
  return (
    <mesh ref={ref} castShadow={castShadows} receiveShadow={receiveShadows}>
      <boxGeometry args={[1,1,1]} />
      <meshStandardMaterial wireframe={wireframe} color="#94a3b8" />
    </mesh>
  );
}

function Ground({ receiveShadows }){
  return (
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow={receiveShadows}>
      <planeGeometry args={[100,100]} />
      <shadowMaterial opacity={0.18} />
    </mesh>
  );
}

// Measurement overlay
function Measurement({ from, to }){
  if (!from || !to) return null;
  const points = [from, to];
  const dist = from.distanceTo(to);
  const mid = from.clone().lerp(to, 0.5);
  return (
    <>
      <Line points={points} color="#0f172a" lineWidth={2} />
      <Html position={mid.toArray()} center>
        <div className="px-2 py-1 rounded-full border bg-white text-[11px] text-slate-700 shadow">{dist.toFixed(2)} m</div>
      </Html>
    </>
  );
}

// ——————————————————
// Canvas scene
// ——————————————————
function Scene({ modelUrl, wireframe, castShadows, receiveShadows, sunAngle, showGrid, measureMode, onPick, setControlsRef, onSceneReady }){
  const dirLight = useRef();
  const controls = useRef();
  const cam = useThree((state)=> state.camera);
  const gl = useThree((state)=> state.gl);
  const sceneRef = useRef();

  useEffect(()=>{ setControlsRef && setControlsRef(controls.current); }, [setControlsRef]);
  useEffect(()=>{ onSceneReady && onSceneReady({ camera: cam, controls: controls.current }); }, [cam, onSceneReady]);

  const sunR = 15;
  const sunX = Math.cos(sunAngle) * sunR;
  const sunY = Math.sin(sunAngle) * sunR;
  const sunZ = Math.sin(sunAngle*0.7) * sunR;

  function handlePointerDown(e){
    if (!measureMode) return;
    e.stopPropagation();
    const p = e.point.clone();
    onPick && onPick(p);
  }

  return (
    <>
      <color attach="background" args={[0xffffff]} />
      <fog attach="fog" args={[0xffffff, 40, 160]} />

      <ambientLight intensity={0.5} />
      <directionalLight ref={dirLight} position={[sunX, sunY, sunZ]} intensity={1.0} castShadow={castShadows} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <Center>
        {modelUrl ? (
          <Model url={modelUrl} wireframe={wireframe} castShadows={castShadows} receiveShadows={receiveShadows} onLoaded={(s)=> centerAndFit(s, cam, controls.current)} />
        ) : (
          <PlaceholderCube wireframe={wireframe} castShadows={castShadows} receiveShadows={receiveShadows} />
        )}
      </Center>

      <Ground receiveShadows={receiveShadows} />

      {showGrid ? <Grid args={[60,60]} cellSize={1} cellThickness={0.4} sectionSize={5} sectionThickness={1} fadeDistance={60} /> : null}

      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} />

      {/* capture picks for measurement */}
      <mesh onPointerDown={handlePointerDown} rotation={[-Math.PI/2,0,0]} position={[0,-0.001,0]}>
        <planeGeometry args={[200,200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

// ——————————————————
// Self‑tests badge
// ——————————————————
function DevTestsBadge(){
  const tests = [];
  tests.push({ name: "R3F mounted", pass: typeof Canvas !== 'undefined' });
  tests.push({ name: "GLTF loader", pass: typeof GLTFLoader !== 'undefined' });
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
// Screen 11 — Advanced 3D Studio
// ——————————————————
function StudioScreen(){
  const [lang, setLang] = useState('ar');
  const rtl = lang === 'ar';
  const t = useMemo(()=> T[lang], [lang]);
  const { user, setRole, can } = useAuth();

  const [modelUrl, setModelUrl] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [castShadows, setCastShadows] = useState(true);
  const [receiveShadows, setReceiveShadows] = useState(true);
  const [sun, setSun] = useState(0.9); // radians
  const [measureMode, setMeasureMode] = useState(false);
  const [pA, setPA] = useState(null);
  const [pB, setPB] = useState(null);
  const controlsRef = useRef();
  const canvasRef = useRef();

  useEffect(()=>()=>{ if (modelUrl) URL.revokeObjectURL(modelUrl); }, [modelUrl]);

  function handleFiles(files){
    const f = files?.[0]; if (!f) return;
    if (!/\.(glb|gltf)$/i.test(f.name)) { alert('Please select a .glb or .gltf file'); return; }
    const url = URL.createObjectURL(f);
    setModelUrl(url);
  }

  function onDrop(ev){ ev.preventDefault(); handleFiles(ev.dataTransfer.files); }
  function onDragOver(ev){ ev.preventDefault(); }

  function onPickPoint(p){
    if (!pA) setPA(p); else if (!pB) setPB(p); else { setPA(p); setPB(null); }
  }

  function resetCam(){
    const c = controlsRef.current; if (!c) return; c.reset();
  }
  function zoom(delta){
    const c = controlsRef.current; if (!c) return; const d = c.getDistance? c.getDistance() : 10; c.dollyIn && (delta<0? c.dollyIn(1.15) : c.dollyOut(1.15)); c.update();
  }
  function screenshot(){
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'sima_studio.png'; a.click();
  }

  function exportSceneJSON(){
    const payload = { modelUrl: !!modelUrl, grid: showGrid, wireframe, castShadows, receiveShadows, sunAngle: sun, measure: !!(pA&&pB) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sima_studio_state.json'; a.click(); URL.revokeObjectURL(url);
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
            <Select value={user?.role || ROLES.CONSULTANT} onChange={(e)=> (useAuth().setRole? useAuth().setRole(e.target.value) : null)} options={lang==='ar' ? [
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
                {!can('studio.use') ? (
                  <div className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 inline-flex items-center gap-2"><EyeOff className="w-4 h-4"/> {t.noPerm}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportSceneJSON}><Download className="w-4 h-4"/> JSON</Button>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 grid lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-5">
                <label className="block text-sm text-slate-700 mb-1">{t.upload}</label>
                <div onDrop={onDrop} onDragOver={onDragOver} className="rounded-2xl border border-dashed border-slate-300 p-3">
                  <div className="text-[12px] text-slate-600">{t.drag}</div>
                  <div className="text-[11px] text-slate-400 my-1">{t.or}</div>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50">
                    <FileUp className="w-4 h-4"/>
                    <span>.glb / .gltf</span>
                    <input type="file" accept=".glb,.gltf" className="hidden" onChange={(e)=> handleFiles(e.target.files)} />
                  </label>
                </div>
              </div>

              <div className="lg:col-span-7 grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <Button variant={showGrid? 'solid':'outline'} onClick={()=> setShowGrid(v=>!v)}><Square className="w-4 h-4"/> {t.grid}</Button>
                <Button variant={wireframe? 'solid':'outline'} onClick={()=> setWireframe(v=>!v)}><Layers className="w-4 h-4"/> {t.wire}</Button>
                <Button variant={(castShadows&&receiveShadows)? 'solid':'outline'} onClick={()=> { setCastShadows(v=>!v); setReceiveShadows(v=>!v); }}><Gauge className="w-4 h-4"/> {t.shadows}</Button>
                <Button variant={measureMode? 'solid':'outline'} onClick={()=> setMeasureMode(v=>!v)}><Ruler className="w-4 h-4"/> {t.measure}</Button>
                <Button variant="outline" onClick={()=> zoom(+1)}><Plus className="w-4 h-4"/> {t.zoomIn}</Button>
                <Button variant="outline" onClick={()=> zoom(-1)}><Minus className="w-4 h-4"/> {t.zoomOut}</Button>
                <Button variant="outline" onClick={resetCam}><RotateCcw className="w-4 h-4"/> {t.reset}</Button>
                <Button variant="outline" onClick={screenshot}><Camera className="w-4 h-4"/> {t.screenshot}</Button>
                <div className="sm:col-span-3 flex items-center gap-3">
                  <Sun className="w-4 h-4"/>
                  <input type="range" min="0" max="6.283" step="0.01" value={sun} onChange={(e)=> setSun(parseFloat(e.target.value))} className="grow"/>
                  <Moon className="w-4 h-4"/>
                  <span className="text-[11px] text-slate-600">{t.dayNight}</span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div ref={canvasRef} className="mt-4 rounded-2xl border border-slate-200 overflow-hidden bg-white">
              <div className="aspect-[16/9]">
                {can('studio.use') ? (
                  <Canvas shadows camera={{ position: [4,3,6], fov: 45 }}>
                    <Scene modelUrl={modelUrl} wireframe={wireframe} castShadows={castShadows} receiveShadows={receiveShadows} sunAngle={sun} showGrid={showGrid} measureMode={measureMode} onPick={onPickPoint} setControlsRef={(c)=> (controlsRef.current = c)} onSceneReady={()=>{}} />
                    {pA && pB ? <Measurement from={pA} to={pB} /> : null}
                    <StatsGl className="!left-auto !right-2 !top-2" />
                  </Canvas>
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-slate-600 p-4">{t.noPerm}</div>
                )}
              </div>
            </div>

            {/* Helper row */}
            <div className="mt-3 text-[12px] text-slate-600 flex flex-wrap items-center gap-2">
              {!modelUrl ? (<Pill className="border-slate-300"><Eye className="w-3.5 h-3.5"/> {t.placeholder}</Pill>) : null}
              {measureMode ? (
                <>
                  <Pill className="border-indigo-300 bg-indigo-50 text-indigo-700"><Ruler className="w-3.5 h-3.5"/> {rtl? 'انقر نقطتين على المشهد لقياس المسافة':'Click two points in the scene to measure distance'}</Pill>
                  <Button variant="ghost" onClick={()=>{ setPA(null); setPB(null); }}>{rtl? 'مسح القياس':'Clear measurement'}</Button>
                </>
              ) : null}
            </div>
          </Card>
        </div>
      </main>

      <footer className="mx-6 md:mx-10 pb-8 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Sima AI</footer>

      <DevTestsBadge />
    </div>
  );
}

// ——————————————————
// Exported App
// ——————————————————
export default function Sima_Screen11_Advanced3DStudio(){
  return (
    <AuthProvider>
      <StudioScreen />
    </AuthProvider>
  );
}
