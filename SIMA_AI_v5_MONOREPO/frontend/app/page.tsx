'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Viewer = dynamic(() => import('../components/ThreeViewer'), { ssr: false });

export default function Page() {
  const [score, setScore] = useState(null);
  const [apiBase, setApiBase] = useState(process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080');

  async function analyzeDemo() {
    try {
      const body = { region_hint: 'Central_Najdi', wwr: 22, height_ratio: 1.7, colors: ['RAL 1015'], features: ['triangular_bands','crenellation'] };
      const res = await axios.post(`${apiBase}/v1/identity/score`, body);
      setScore(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { analyzeDemo(); }, []);

  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 380px', height:'100vh'}}>
      <section style={{position:'relative'}}>
        <Viewer apiBase={apiBase}/>
      </section>
      <aside style={{padding:'20px', background:'#121212', borderLeft:'1px solid #222'}}>
        <h2>SIMA AI v5 — Smart Studio</h2>
        <p>API: {apiBase}</p>
        <div style={{marginTop:16}}>
          <form onSubmit={async (e)=>{
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const res = await axios.post(`${apiBase}/v1/3d/reconstruct`, form);
            alert('3D summary: ' + JSON.stringify(res.data.summary));
          }}>
            <h3>Instant 3D</h3>
            <div style={{display:'grid', gap:8}}>
              <label>Width (m) <input name="width" defaultValue="6" /></label>
              <label>Depth (m) <input name="depth" defaultValue="4" /></label>
              <label>Height (m) <input name="height" defaultValue="3" /></label>
              <button type="submit">Reconstruct</button>
            </div>
          </form>
        </div>
        <div style={{marginTop:16}}>
          <h3>Identity Score (Demo)</h3>
          <pre style={{whiteSpace:'pre-wrap', fontSize:12, background:'#0a0a0a', padding:10, border:'1px solid #333'}}>
            {JSON.stringify(score, null, 2)}
          </pre>
        </div>
        <div style={{marginTop:16}}>
          <h3>Analyze Image</h3>
          <input type="file" id="img" onChange={async (e)=>{
            const f = e.target.files?.[0];
            if(!f) return;
            const fd = new FormData();
            fd.append('file', f);
            const res = await axios.post(`${apiBase}/v1/vision/analyze`, fd, { headers: {'Content-Type':'multipart/form-data'} });
            alert('Predicted Regions: ' + res.data.predicted_regions.map((p:any)=>p.region+'('+p.confidence+')').join(', '));
          }}/>
        </div>
      </aside>
    </main>
  );
}
