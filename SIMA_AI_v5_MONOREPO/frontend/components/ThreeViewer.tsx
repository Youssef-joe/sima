'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ThreeViewer({ apiBase }:{ apiBase:string }){
  const [meshes, setMeshes] = useState<any[]>([]);

  useEffect(()=>{
    // load default simple box
    setMeshes([{
      name:'room',
      vertices:[[0,0,0],[6,0,0],[6,4,0],[0,4,0],[0,0,3],[6,0,3],[6,4,3],[0,4,3]],
      faces:[[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],
      material:{color:'#dddddd'}
    }]);
  },[]);

  return (
    <Canvas camera={{position:[8,6,8], fov:50}}>
      <ambientLight />
      <directionalLight position={[10,10,5]} />
      <mesh>
        {meshes.map((m,i)=>{
          const vertices = m.vertices;
          const faces = m.faces;
          const positions:number[] = [];
          faces.forEach((f:number[])=>{
            f.forEach((idx:number)=>{
              const v = vertices[idx];
              positions.push(v[0], v[2], v[1]); // swap Y/Z for nicer view
            });
          });
          return (
            <bufferGeometry key={i} attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array(positions)}
                itemSize={3}
                count={positions.length/3}
              />
            </bufferGeometry>
          );
        })}
        <meshStandardMaterial wireframe />
      </mesh>
      <gridHelper args={[20,20]} />
      <OrbitControls />
    </Canvas>
  );
}
