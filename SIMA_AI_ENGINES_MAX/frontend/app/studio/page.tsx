'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import axios from 'axios';
const Viewer = dynamic(()=>import('../../components/Viewer'), { ssr:false });

export default function Studio(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [dims, setDims] = useState({w:10,d:8,h:6.4});
  const [score, setScore] = useState<any>(null);

  useEffect(()=>{
    axios.post(`${API}/v1/identity/score`, {region_hint:'Central_Najdi', wwr:22, height_ratio:1.6, colors:['RAL 1015'], features:['triangular_bands','crenellation']})
      .then(r=>setScore(r.data));
  },[]);

  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section><Viewer dims={dims}/></section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h3>Design Generator</h3>
        <form onSubmit={async e=>{
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const js = await (await fetch(`${API}/v1/design/generate`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
            typology: fd.get('typology'), floors: Number(fd.get('floors')), footprint_w: Number(fd.get('w')), footprint_d: Number(fd.get('d')), style: fd.get('style')
          })})).json();
          const totH = js.massing.reduce((a:any,l:any)=>a+l.h,0);
          setDims({w:Number(fd.get('w')), d:Number(fd.get('d')), h: totH});
          alert('Features: '+js.features.join(', '));
        }}>
          <label>Typology <input name="typology" defaultValue="villa"/></label><br/>
          <label>Floors <input name="floors" defaultValue="2"/></label><br/>
          <label>W (m) <input name="w" defaultValue="10"/></label><br/>
          <label>D (m) <input name="d" defaultValue="8"/></label><br/>
          <label>Style <input name="style" defaultValue="Central_Najdi"/></label><br/>
          <button type="submit">Generate</button>
        </form>
        <h3 style={{marginTop:16}}>Identity Score</h3>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12}}>{JSON.stringify(score,null,2)}</pre>
      </aside>
    </main>
  );
}
