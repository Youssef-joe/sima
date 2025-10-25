'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import axios from 'axios';
const Viewer = dynamic(()=>import('../viewer'), { ssr:false });

export default function Studio(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [score, setScore] = useState<any>(null);
  const [dims, setDims] = useState({w:6,d:4,h:3});
  useEffect(()=>{ axios.post(`${API}/v1/identity/score`, {region_hint:'Central_Najdi', wwr:22, height_ratio:1.6}).then(r=>setScore(r.data)); },[]);
  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section><Viewer dims={dims}/></section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h3>Identity Score</h3>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12}}>{JSON.stringify(score,null,2)}</pre>
        <h3>Instant 3D</h3>
        <form onSubmit={async (e)=>{
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const res = await fetch(`${API}/v1/3d/reconstruct`, {method:'POST', body: fd});
          const js = await res.json();
          setDims({w:Number(fd.get('width')), d:Number(fd.get('depth')), h:Number(fd.get('height'))});
          alert('3D updated: '+JSON.stringify(js.summary));
        }}>
          <label>Width <input name="width" defaultValue="6" /></label>
          <label>Depth <input name="depth" defaultValue="4" /></label>
          <label>Height <input name="height" defaultValue="3" /></label>
          <button type="submit" style={{display:'block', marginTop:8}}>Reconstruct</button>
        </form>
      </aside>
    </main>
  );
}
