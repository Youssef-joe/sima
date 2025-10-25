'use client';
import * as THREE from 'three';
import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { IFCLoader } from 'web-ifc-three/IFCLoader.js';

export default function Page(){
  const [projectId,setProjectId]=useState('demo-project');
  const [elementId,setElementId]=useState<number>(0);
  const [wwrDelta,setWwrDelta]=useState<number>(0.05);
  const token = typeof window!=='undefined' ? localStorage.getItem('token')||'' : '';
  const group = useRef<THREE.Group>(null!);

  async function onIFC(f: File){
    const l=new IFCLoader(); l.ifcManager.setWasmPath('/wasm/');
    const b=await f.arrayBuffer();
    l.parse(b,'',(m:any)=>{
      while(group.current.children.length) group.current.remove(group.current.children[0]);
      const obj = m.mesh||m;
      obj.traverse((o:any)=>{ if(o.isMesh) o.material = new THREE.MeshStandardMaterial({color:new THREE.Color('#b0bec5')}); });
      group.current.add(obj);
    }, console.error);
  }

  async function reevaluate(){
    const body = { project_id: projectId, changes: [
      {element_id: elementId, op:'adjust_wwr', value: String(wwrDelta)},
      {element_id: elementId, op:'set_material', value:'stone_najdi'}
    ]};
    const r = await fetch(`http://localhost:8080/v1/project/${projectId}/re-evaluate`,{method:'POST', headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const d = await r.json(); alert(`Score: ${d.new_total} — ${d.status}`);
  }

  return (<section className="card">
    <h2>IFC التعديل اللحظي + إعادة التقييم</h2>
    <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
      <input value={projectId} onChange={e=>setProjectId(e.target.value)} className="input" placeholder="Project ID"/>
      <input type="file" accept=".ifc" onChange={e=>e.target.files&&onIFC(e.target.files[0])} />
      <input type="number" className="input" placeholder="Element expressId" value={elementId} onChange={e=>setElementId(parseInt(e.target.value||'0'))}/>
      <input type="number" step="0.01" className="input" placeholder="WWR Δ" value={wwrDelta} onChange={e=>setWwrDelta(parseFloat(e.target.value||'0'))}/>
      <button className="btn" onClick={reevaluate}>تطبيق وتقييم</button>
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
