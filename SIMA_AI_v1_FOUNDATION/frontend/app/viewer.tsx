'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
export default function Viewer({dims}:{dims:{w:number,d:number,h:number}}){
  const {w,d,h} = dims;
  const v = [[0,0,0],[w,0,0],[w,d,0],[0,d,0],[0,0,h],[w,0,h],[w,d,h],[0,d,h]];
  const f = [[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  const pos:number[] = []; f.forEach(ff=>ff.forEach(i=>{const p=v[i]; pos.push(p[0],p[2],p[1]);}));
  return (
    <Canvas camera={{position:[Math.max(8,w*1.2),Math.max(6,h*1.4),Math.max(8,d*1.2)], fov:50}}>
      <ambientLight /><directionalLight position={[10,10,5]} />
      <mesh>
        <bufferGeometry><bufferAttribute attach="attributes-position" array={new Float32Array(pos)} itemSize={3} count={pos.length/3}/></bufferGeometry>
        <meshStandardMaterial wireframe />
      </mesh>
      <gridHelper args={[20,20]} /><OrbitControls />
    </Canvas>
  );
}
