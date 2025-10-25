'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import axios from 'axios';
const Viewer = dynamic(()=>import('../components/Viewer'), { ssr:false });

export default function Studio(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [materials, setMaterials] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [dims, setDims] = useState({w:6,d:4,h:3});

  useEffect(()=>{
    axios.get(`${API}/v1/materials`).then(r=>setMaterials(r.data));
    axios.post(`${API}/v1/identity/score`, {region_hint:'Central_Najdi', wwr:22, height_ratio:1.6, colors:['RAL 1015'], features:['triangular_bands','crenellation']})
        .then(r=>setScore(r.data));
  },[]);

  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{position:'relative'}}>
        <Viewer dims={dims}/>
      </section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222', overflow:'auto'}}>
        <h2>مواد البناء</h2>
        {materials ? (
          <div>
            <h3>Roofing</h3>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {materials.roofing.map((m:any)=>(
                <div key={m.id} style={{background:'#1b1b1b', padding:10, borderRadius:8, border:'1px solid #333'}}>
                  <div style={{fontWeight:600}}>{m.title}</div>
                  <div>RAL: {m.ral}</div>
                  <small>{m.note||''}</small>
                </div>
              ))}
            </div>
            <h3 style={{marginTop:12}}>Wall materials</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <div>
                <strong>Decorative</strong>
                {materials.walls.decorative.map((m:any)=>(<div key={m.id} style={{border:'1px solid #333', padding:8, marginTop:6, borderRadius:8}}>{m.title} — {m.ral}</div>))}
              </div>
              <div>
                <strong>Insulation</strong>
                {materials.walls.insulation.map((m:any)=>(<div key={m.id} style={{border:'1px solid #333', padding:8, marginTop:6, borderRadius:8}}>{m.title} — {m.u_value}</div>))}
              </div>
            </div>
            <hr style={{borderColor:'#222', margin:'14px 0'}}/>
            <h3>Identity Score</h3>
            <pre style={{background:'#0a0a0a', padding:10, fontSize:12}}>{JSON.stringify(score, null, 2)}</pre>

            <h3>Instant 3D</h3>
            <form onSubmit={async (e)=>{
              e.preventDefault();
              const form = new FormData(e.currentTarget as HTMLFormElement);
              const res = await fetch(`${API}/v1/3d/reconstruct`, { method:'POST', body: form });
              const js = await res.json();
              alert('3D summary: '+JSON.stringify(js.summary));
              setDims({w:Number(form.get('width')),d:Number(form.get('depth')),h:Number(form.get('height'))});
            }}>
              <label>Width <input name="width" defaultValue="6" /></label>
              <label>Depth <input name="depth" defaultValue="4" /></label>
              <label>Height <input name="height" defaultValue="3" /></label>
              <button type="submit" style={{display:'block', marginTop:8}}>Reconstruct</button>
            </form>
          </div>
        ): <div>Loading…</div>}
      </aside>
    </main>
  );
}
