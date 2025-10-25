'use client';
import * as THREE from 'three';
import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { IFCLoader } from 'web-ifc-three/IFCLoader.js';

export default function Page(){
  const [name,setName]=useState('');
  const group = useRef<THREE.Group>(null!);
  const onIFC=async(f:File)=>{
    const l=new IFCLoader(); l.ifcManager.setWasmPath('/wasm/');
    const b=await f.arrayBuffer();
    l.parse(b,'',(m:any)=>{ while(group.current.children.length) group.current.remove(group.current.children[0]); group.current.add(m.mesh||m); setName(f.name); }, console.error);
  };
  return (<section>
    <h2>IFC Import</h2>
    <input type="file" accept=".ifc" onChange={e=>e.target.files&&onIFC(e.target.files[0])} />
    <div>الملف: {name}</div>
    <div style={{height:'60vh'}}>
      <Canvas camera={{position:[6,4,8], fov:45}}>
        <ambientLight intensity={0.6}/>
        <directionalLight position={[5,10,8]} intensity={1.1}/>
        <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[60,60]} /><meshStandardMaterial color={'#eaeaea'} /></mesh>
        <primitive object={group.current||new THREE.Group()} />
      </Canvas>
    </div>
  </section>);
}
