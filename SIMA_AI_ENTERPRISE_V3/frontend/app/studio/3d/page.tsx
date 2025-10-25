'use client';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { IFCLoader } from 'web-ifc-three/IFCLoader.js';

function Sun({az,el}:{az:number;el:number}){
  const ref = useRef<THREE.DirectionalLight>(null!);
  useEffect(()=>{
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el), r=20;
    const x=r*Math.sin(a)*Math.cos(e), y=r*Math.sin(e), z=r*Math.cos(a)*Math.cos(e);
    ref.current.position.set(x,y,z);
  },[az,el]);
  return <directionalLight ref={ref} intensity={1.1} castShadow/>;
}

export default function Page(){
  const [az,setAz]=useState(140), [el,setEl]=useState(30);
  const group = useRef<THREE.Group>(null!);
  const [name,setName]=useState(''); const [xr,setXR]=useState<string>('checking...');

  useEffect(()=>{
    const anywin:any = window;
    if(anywin.navigator && anywin.navigator.xr && anywin.navigator.xr.isSessionSupported){
      anywin.navigator.xr.isSessionSupported('immersive-vr').then((ok:boolean)=> setXR(ok?'immersive-vr supported':'no XR device'));
    }else setXR('no XR API');
  },[]);

  const onIFC=async(f:File)=>{
    const l=new IFCLoader(); l.ifcManager.setWasmPath('/wasm/');
    const b=await f.arrayBuffer();
    l.parse(b,'',(m:any)=>{ while(group.current.children.length) group.current.remove(group.current.children[0]); group.current.add(m.mesh||m); setName(f.name); }, console.error);
  };

  async function enterXR(){
    const anywin:any = window;
    if(!(anywin.navigator && anywin.navigator.xr)) { alert('XR غير مدعوم'); return; }
    try{
      const session = await anywin.navigator.xr.requestSession('immersive-vr');
      alert('XR session started'); session.end();
    }catch(e){ alert('تعذّر بدء XR: '+e); }
  }

  return (<section className="card">
    <h2>استوديو 3D (IFC + WebXR + شمس/ظل)</h2>
    <div className="hint">XR: {xr}</div>
    <input type="file" accept=".ifc" onChange={e=>e.target.files&&onIFC(e.target.files[0])} />
    <button className="btn" onClick={enterXR}>دخول وضع XR</button>
    <div className="hint">الملف: {name}</div>
    <div>Azimuth {az}° <input type="range" min="0" max="360" value={az} onChange={e=>setAz(+e.target.value)} /></div>
    <div>Elevation {el}° <input type="range" min="0" max="85" value={el} onChange={e=>setEl(+e.target.value)} /></div>
    <div style={{height:'60vh'}}>
      <Canvas camera={{position:[6,4,8], fov:45}} shadows>
        <ambientLight intensity={0.4}/>
        <Sun az={az} el={el}/>
        <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[60,60]} /><meshStandardMaterial color={'#eaeaea'} /></mesh>
        <primitive object={group.current||new THREE.Group()} />
      </Canvas>
    </div>
  </section>);
}
