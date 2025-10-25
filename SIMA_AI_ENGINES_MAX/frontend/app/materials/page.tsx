'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
export default function Materials(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [catalog, setCatalog] = useState<any>(null);
  const [rec, setRec] = useState<any>(null);
  useEffect(()=>{ axios.get(`${API}/v1/materials`).then(r=>setCatalog(r.data)); },[]);
  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{padding:16}}>
        <h3>Catalog</h3>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12}}>{catalog?JSON.stringify(catalog,null,2):'Loading…'}</pre>
      </section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h3>Recommend</h3>
        <button onClick={async ()=>{
          const js = await (await fetch(`${API}/v1/materials/recommend`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({region:'Central_Najdi'})})).json();
          setRec(js);
        }}>Get Recommendation</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:10}}>{rec?JSON.stringify(rec,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
