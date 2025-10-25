import React, { useEffect, useMemo, useRef, useState } from "react";
// 3D + loaders
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Sima AI — Screen 11: 3D Studio (/studio/3d)
 * - Load GLB/GLTF and (optionally) IFC using web-ifc-three (if present)
 * - Sun & Shadow controls (Azimuth/Elevation)
 * - WebXR (Enter VR) with feature detection & graceful fallback
 * - AR/EN + RTL, RBAC banner, Accessibility (labels, aria-live)
 * - Runtime tests badge for minimal smoke checks
 *
 * Notes:
 * 1) IFC loading uses dynamic import to avoid hard dependency.
 * 2) No external CDNs. All loaders from NPM examples are used.
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — استوديو ثلاثي الأبعاد",
    back: "عودة",
    uploadTitle: "رفع نموذج",
    uploadHint: "ارفع ملف .glb/.gltf (مدعوم) أو .ifc (اختياري)",
    sun: "الشمس والظل",
    azimuth: "السمت (°)",
    elevation: "الارتفاع (°)",
    vr: "دخول الواقع الافتراضي",
    exitVr: "خروج من الواقع الافتراضي",
    role: { authority: "جهة الاعتماد", consultant: "استشاري", client: "عميل" },
    statusReady: "تم تهيئة المشهد.",
    statusModel: "تم تحميل النموذج.",
    statusIfcWarn: "حِمّل web-ifc-three لتفعيل قراءة IFC (اختياري).",
    reset: "إعادة تعيين الكاميرا",
  },
  en: {
    brand: "Sima AI — 3D Studio",
    back: "Back",
    uploadTitle: "Upload Model",
    uploadHint: "Upload .glb/.gltf (supported) or .ifc (optional)",
    sun: "Sun & Shadow",
    azimuth: "Azimuth (°)",
    elevation: "Elevation (°)",
    vr: "Enter VR",
    exitVr: "Exit VR",
    role: { authority: "Authority", consultant: "Consultant", client: "Client" },
    statusReady: "Scene initialized.",
    statusModel: "Model loaded.",
    statusIfcWarn: "Install web-ifc-three to enable IFC loading (optional).",
    reset: "Reset Camera",
  },
};

type Lang = keyof typeof T;

type Role = "authority"|"consultant"|"client";

// ————————— helpers —————————
const cls=(...a:string[])=>a.filter(Boolean).join(" ");

function fitToView(object:THREE.Object3D, camera:THREE.PerspectiveCamera, controls:OrbitControls){
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI/180);
  let cameraZ = Math.abs(maxDim / (2*Math.tan(fov/2)));
  cameraZ *= 1.5; // padding
  camera.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
  camera.near = maxDim/100;
  camera.far = maxDim*100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

export default function Sima3DStudio(){
  // i18n & RBAC
  const [lang,setLang]=useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar";
  const [role] = useState<Role>("consultant");

  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  // scene refs
  const mountRef = useRef<HTMLDivElement|null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer|null>(null);
  const sceneRef = useRef<THREE.Scene|null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera|null>(null);
  const controlsRef = useRef<OrbitControls|null>(null);
  const sunRef = useRef<THREE.DirectionalLight|null>(null);
  const modelGroupRef = useRef<THREE.Group|null>(null);
  const [status,setStatus]=useState<string>("");

  // Sun controls
  const [azimuth,setAzimuth]=useState<number>(135); // degrees
  const [elevation,setElevation]=useState<number>(45); // degrees

  // XR state
  const [xrSupported,setXrSupported]=useState<boolean>(false);
  const [xrActive,setXrActive]=useState<boolean>(false);

  // init three.js
  useEffect(()=>{
    if(!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f8fb);

    const camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
    camera.position.set(3,2,5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.xr.enabled = true; // allow XR

    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.9);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5,5,5);
    sun.castShadow = true;
    scene.add(sun);

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100,100),
      new THREE.MeshStandardMaterial({ color: 0xe7ecf2 })
    );
    ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    scene.add(ground);

    // model group
    const group = new THREE.Group();
    scene.add(group);

    // animate
    let stop=false;
    const clock = new THREE.Clock();
    const onFrame=()=>{
      if(stop) return;
      const dt = clock.getDelta();
      controls.update();
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(onFrame);

    // resize
    const onResize=()=>{
      if(!mountRef.current) return;
      const w = mountRef.current.clientWidth; const h = mountRef.current.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
    };
    const ro = new ResizeObserver(onResize); ro.observe(mountRef.current);

    // assign refs
    rendererRef.current = renderer; sceneRef.current = scene; cameraRef.current = camera; controlsRef.current = controls; sunRef.current = sun; modelGroupRef.current = group;
    setStatus(t.statusReady);

    // XR support detection
    (async()=>{
      try{ const ok = await (navigator as any).xr?.isSessionSupported?.("immersive-vr"); setXrSupported(!!ok); }catch{ setXrSupported(false); }
    })();

    // cleanup
    return ()=>{ stop=true; ro.disconnect(); renderer.setAnimationLoop(null as any); controls.dispose(); renderer.dispose(); mountRef.current?.removeChild(renderer.domElement); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[t.statusReady]);

  // update sun position
  useEffect(()=>{
    const sun = sunRef.current; if(!sun) return;
    const az = THREE.MathUtils.degToRad(azimuth);
    const el = THREE.MathUtils.degToRad(elevation);
    const r = 20;
    const x = r*Math.cos(el)*Math.cos(az);
    const y = r*Math.sin(el);
    const z = r*Math.cos(el)*Math.sin(az);
    sun.position.set(x,y,z);
  },[azimuth,elevation]);

  // loaders
  const gltfLoader = useMemo(()=> new GLTFLoader(),[]);

  async function loadGLTF(file:File){
    const url = URL.createObjectURL(file);
    gltfLoader.load(url,(gltf)=>{
      const group = modelGroupRef.current!;
      // clear old
      group.children.slice().forEach(ch=>{ group.remove(ch); if((ch as any).geometry) (ch as any).geometry.dispose(); });
      const obj = gltf.scene;
      group.add(obj);
      // center & fit
      const camera = cameraRef.current!;
      const controls = controlsRef.current!;
      fitToView(obj, camera, controls);
      setStatus(t.statusModel);
      URL.revokeObjectURL(url);
    }, undefined, (e)=>{
      console.error(e);
    });
  }

  async function loadIFC(file:File){
    try{
      const modA:any = await import("web-ifc-three/IFCLoader").catch(()=>null);
      const modB:any = modA? null : await import("web-ifc-three/IFCLoader.js").catch(()=>null);
      const IFCLoader = (modA?.IFCLoader) || (modB?.IFCLoader);
      if(!IFCLoader) throw new Error("NO_IFC");
      const ifcLoader = new IFCLoader();
      const url = URL.createObjectURL(file);
      const group = modelGroupRef.current!;
      group.children.slice().forEach(ch=>{ group.remove(ch); if((ch as any).geometry) (ch as any).geometry.dispose(); });
      ifcLoader.load(url,(model:any)=>{
        model.traverse((n:any)=>{ if(n.isMesh){ n.castShadow = true; n.receiveShadow = true; } });
        group.add(model);
        const camera = cameraRef.current!;
        const controls = controlsRef.current!;
        fitToView(model, camera, controls);
        setStatus(t.statusModel);
        URL.revokeObjectURL(url);
      }, undefined, (err:any)=>{ console.error(err); });
    }catch(err){
      console.warn("IFC disabled:", err);
      setStatus(t.statusIfcWarn);
    }
  }

  function onFiles(e:React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    const ext = f.name.toLowerCase().split(".").pop();
    if(ext==="glb"||ext==="gltf"){ loadGLTF(f); }
    else if(ext==="ifc"){ loadIFC(f); }
    else { alert("Unsupported file. Use .glb/.gltf or .ifc"); }
  }

  // XR controls
  async function enterVR(){
    const renderer = rendererRef.current; if(!renderer) return;
    try{
      const xr:any = (navigator as any).xr; if(!xr) return;
      const session = await xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor","bounded-floor"] });
      await renderer.xr.setSession(session);
      setXrActive(true);
      session.addEventListener("end", ()=> setXrActive(false));
    }catch(err){ console.warn("XR failed", err); }
  }
  function exitVR(){
    const renderer = rendererRef.current; if(!renderer) return;
    const session:any = renderer.xr.getSession?.();
    session?.end?.();
  }

  function resetCamera(){
    const camera = cameraRef.current; const controls = controlsRef.current; if(!camera||!controls) return;
    camera.position.set(3,2,5); controls.target.set(0,0,0); controls.update();
  }

  // runtime tests
  const tests = useMemo(()=>{
    const gl = rendererRef.current?.getContext?.();
    const ok = !!(sceneRef.current && cameraRef.current && gl);
    return { ok, tip: `gl:${!!gl} xr:${xrSupported}` };
  },[xrSupported]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='ar'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>AR</button>
            <button onClick={()=>setLang("en")} className={cls("px-3 py-1.5 rounded-xl text-sm", lang==='en'?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900")}>EN</button>
            <a href="/dashboard" className="text-sm underline text-slate-700">{t.back}</a>
          </div>
        </div>
      </header>

      {/* layout */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6 grid lg:grid-cols-12 gap-4 md:gap-6">
        {/* controls */}
        <aside className="lg:col-span-4 order-2 lg:order-1">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="text-[12px] text-slate-500 mb-2">{T[lang].role[role]}</div>

            <h2 className="font-semibold text-sm mb-2">{t.uploadTitle}</h2>
            <label className="block">
              <input onChange={onFiles} type="file" accept=".glb,.gltf,.ifc" className="block w-full text-sm file:mr-3 file:px-3 file:py-2 file:border file:rounded-lg file:border-slate-300 file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"/>
              <div className="text-[12px] text-slate-500 mt-1">{t.uploadHint}</div>
            </label>

            <div className="h-px bg-slate-200 my-4"/>

            <h3 className="font-semibold text-sm mb-2">{t.sun}</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[12px] text-slate-600">{t.azimuth}</span>
                <input aria-label={t.azimuth} value={azimuth} onChange={e=>setAzimuth(parseInt(e.target.value))} type="range" min={0} max={360} className="w-full"/>
                <div className="text-[12px] text-slate-500">{azimuth}°</div>
              </label>
              <label className="block">
                <span className="text-[12px] text-slate-600">{t.elevation}</span>
                <input aria-label={t.elevation} value={elevation} onChange={e=>setElevation(parseInt(e.target.value))} type="range" min={0} max={90} className="w-full"/>
                <div className="text-[12px] text-slate-500">{elevation}°</div>
              </label>
            </div>

            <div className="h-px bg-slate-200 my-4"/>

            <div className="flex items-center gap-2">
              {xrSupported && !xrActive && (
                <button onClick={enterVR} className="px-3 py-2 rounded-xl border border-slate-300 text-sm">{t.vr}</button>
              )}
              {xrActive && (
                <button onClick={exitVR} className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-sm">{t.exitVr}</button>
              )}
              <button onClick={resetCamera} className="px-3 py-2 rounded-xl border border-slate-300 text-sm">{t.reset}</button>
            </div>

            <div aria-live="polite" className="mt-3 text-[12px] text-slate-600">{status}</div>
          </div>
        </aside>

        {/* viewport */}
        <section className="lg:col-span-8 order-1 lg:order-2">
          <div ref={mountRef} className="aspect-[16/10] w-full rounded-2xl border border-slate-200 overflow-hidden bg-white"/>
        </section>
      </main>

      {/* tests */}
      <div className="fixed bottom-3 left-3 z-50">
        <div title={tests.tip} className={cls("px-2.5 py-1.5 rounded-full text-[10px]", tests.ok?"bg-emerald-600 text-white":"bg-amber-500 text-black")}>{tests.ok? (lang==='ar'?"اختبارات: ناجحة":"Tests: PASS") : (lang==='ar'?"اختبارات: تحقق":"Tests: CHECK")}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}

function Logo(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
  );
}
