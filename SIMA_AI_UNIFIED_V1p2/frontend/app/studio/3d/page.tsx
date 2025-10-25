'use client';
import * as THREE from 'three';
import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IFCLoader } from 'web-ifc-three/IFCLoader.js';

export default function Page(){
  const light = useRef<THREE.DirectionalLight>(null!);
  const [az, setAz]=useState(135); const [el,setEl]=useState(35);
  const [name,setName]=useState('');
  const group = useRef<THREE.Group>(null!);
  const update=()=>{
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el), r=10;
    const x=r*Math.sin(a)*Math.cos(e), y=r*Math.sin(e), z=r*Math.cos(a)*Math.cos(e);
    light.current.position.set(x,y,z);
  };
  const onIFC=async(f:File)=>{
    const l=new IFCLoader(); l.ifcManager.setWasmPath('/wasm/');
    const b=await f.arrayBuffer();
    l.parse(b,'',(m:any)=>{ while(group.current.children.length) group.current.remove(group.current.children[0]); group.current.add(m.mesh||m); setName(f.name); }, console.error);
  };
  update();
  return (<section>
    <h2>استوديو 3D (IFC + شمس/ظل)</h2>
    <input type="file" accept=".ifc" onChange={e=>e.target.files&&onIFC(e.target.files[0])} />
    <div>الملف: {name}</div>
    <div>Azimuth {az}° <input type="range" min="0" max="360" value={az} onChange={e=>{setAz(+e.target.value);update();}} /></div>
    <div>Elevation {el}° <input type="range" min="0" max="85" value={el} onChange={e=>{setEl(+e.target.value);update();}} /></div>
    <div style={{height:'60vh'}}>
      <Canvas camera={{position:[5,4,7], fov:45}}>
        <ambientLight intensity={0.4}/>
        <directionalLight ref={light} intensity={1.1} castShadow/>
        <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[40,40]} /><meshBasicMaterial color={'#eee'} /></mesh>
        <primitive object={group.current||new THREE.Group()} />
      </Canvas>
    </div>
  </section>);
}
