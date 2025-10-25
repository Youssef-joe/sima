'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function Viewer(){
  const verts = [[0,0,0],[6,0,0],[6,4,0],[0,4,0],[0,0,3],[6,0,3],[6,4,3],[0,4,3]];
  const faces = [[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  const pos:number[] = [];
  faces.forEach(f=>f.forEach(i=>{ const v=verts[i]; pos.push(v[0], v[2], v[1]); }));
  return (
    <Canvas camera={{position:[8,6,8], fov:50}}>
      <ambientLight />
      <directionalLight position={[10,10,5]} />
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={new Float32Array(pos)} itemSize={3} count={pos.length/3} />
        </bufferGeometry>
        <meshStandardMaterial wireframe />
      </mesh>
      <gridHelper args={[20,20]} />
      <OrbitControls />
    </Canvas>
  );
}
