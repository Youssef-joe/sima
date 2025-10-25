'use client';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { IFCLoader } from 'web-ifc-three/IFCLoader.js';

function VRHint(){
  const { gl } = useThree();
  useEffect(()=>{
    if ('xr' in navigator) {
      // Enable XR on renderer if available
      // @ts-ignore
      if (gl && gl.xr) { /* gl.xr.enabled = true; */ }
    }
  },[gl]);
  const onClick = async ()=>{
    // Graceful hint (integration-ready; full XR requires renderer hook or @react-three/xr)
    if (!('xr' in navigator)) { alert('WebXR غير مدعوم في هذا المتصفح/الجهاز.'); return; }
    alert('تم تمكين WebXR تجريبيًا. لتمكين VR كامل داخل المشهد، فعّل HTTPS وأضف @react-three/xr أو VRButton ضمن تهيئة renderer.');
  };
  return <button className="btn" onClick={onClick}>Enter VR (Beta)</button>;
}

export default function Page(){
  const [name,setName]=useState('');
  const [projectId,setProjectId]=useState('demo-project');
  const [color,setColor]=useState('#cccccc'); const [scale,setScale]=useState(1);
  const group = useRef<THREE.Group>(null!);

  async function loadState(){
    const token=localStorage.getItem('token')||'';
    const r = await fetch(`http://localhost:8080/v1/model/${projectId}/latest`,{headers:{'Authorization':'Bearer '+token}});
    const d = await r.json();
    if(d.state && group.current){
      group.current.traverse((o:any)=>{ if(o.isMesh) o.material = new THREE.MeshStandardMaterial({color:new THREE.Color(d.state.color||'#ccc')}); });
      group.current.scale.setScalar(d.state.scale||1);
    }
  }
  async function saveState(){
    const token=localStorage.getItem('token')||'';
    const body = {name, state:{color, scale}};
    await fetch(`http://localhost:8080/v1/model/${projectId}/save`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify(body)});
    alert('Saved');
  }
  const onIFC=async(f:File)=>{
    const l=new IFCLoader(); l.ifcManager.setWasmPath('/wasm/');
    const b=await f.arrayBuffer();
    l.parse(b,'',(m:any)=>{
      while(group.current.children.length) group.current.remove(group.current.children[0]);
      const obj = m.mesh||m;
      obj.traverse((o:any)=>{ if(o.isMesh) o.material = new THREE.MeshStandardMaterial({color:new THREE.Color(color)}); });
      obj.scale.setScalar(scale);
      group.current.add(obj);
      setName(f.name);
    }, console.error);
  };
  useEffect(()=>{ loadState(); },[]);
  return (<section className="card">
    <h2>IFC Studio + WebXR (Beta)</h2>
    <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:12}}>
      <input className="input" value={projectId} onChange={e=>setProjectId(e.target.value)} placeholder="Project ID" />
      <input type="file" accept=".ifc" onChange={e=>e.target.files&&onIFC(e.target.files[0])} />
      <input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)} />
      <input className="input" type="number" step="0.1" value={scale} onChange={e=>setScale(+e.target.value)} />
      <button className="btn" onClick={saveState}>حفظ</button>
      <VRHint/>
    </div>
    <div style={{height:'65vh', borderRadius:12, overflow:'hidden'}}>
      <Canvas camera={{position:[6,4,8], fov:45}}>
        <ambientLight intensity={0.6}/>
        <directionalLight position={[5,10,8]} intensity={1.1}/>
        <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[60,60]} /><meshStandardMaterial color={'#eaeaea'} /></mesh>
        <primitive object={group.current||new THREE.Group()} />
      </Canvas>
    </div>
  </section>);
}
