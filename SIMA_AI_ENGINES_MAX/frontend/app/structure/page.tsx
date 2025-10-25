'use client';
import { useState } from 'react';
export default function Structure(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [out, setOut] = useState<any>(null);
  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{display:'grid', placeItems:'center'}}><div>Env/Structure</div></section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h3>WWR / Orientation / U</h3>
        <button onClick={async ()=>{
          const js = await (await fetch(`${API}/v1/structure/simulate`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({wwr:25, orientation_deg:90, glazing_u:2.0, area_m2:120})})).json();
          setOut(js);
        }}>Simulate</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:10}}>{out?JSON.stringify(out,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
