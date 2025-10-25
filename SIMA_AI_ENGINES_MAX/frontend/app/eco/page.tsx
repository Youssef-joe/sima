'use client';
import { useState } from 'react';
export default function Eco(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [out, setOut] = useState<any>(null);
  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{display:'grid', placeItems:'center'}}><div>Eco</div></section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h3>LCA Heuristic</h3>
        <button onClick={async ()=>{
          const js = await (await fetch(`${API}/v1/eco/assess`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({wall_area_m2:220, roof_area_m2:120})})).json();
          setOut(js);
        }}>Assess</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:10}}>{out?JSON.stringify(out,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
