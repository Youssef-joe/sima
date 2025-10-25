'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sphere, Box } from '@react-three/drei';
export default function Studio3D(){
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-bold">استوديو ثلاثي الأبعاد</h2>
      <div className="card" style={{height: '60vh'}}>
        <Canvas camera={{ position:[4,4,6], fov:45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5,10,5]} intensity={0.8} />
          <Box position={[-1,0.5,0]}><meshStandardMaterial /></Box>
          <Sphere position={[1,1,0]}><meshStandardMaterial /></Sphere>
          <Grid args={[20,20]} />
          <OrbitControls />
        </Canvas>
      </div>
      <div className="flex gap-2">
        <button className="btn">رفع IFC</button>
        <button className="btn">رفع GLTF</button>
        <button className="btn">XR</button>
      </div>
    </section>
  );
}
