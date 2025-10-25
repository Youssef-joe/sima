'use client';
import { useState } from 'react';
import axios from 'axios';
export default function Sim(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [vals, setVals] = useState({lighting:50,greenery:50,mobility:50,culture:50});
  const [out, setOut] = useState<any>(null);
  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{position:'relative', background:'#d9d9d9'}}>
        <div style={{position:'absolute', inset:0, background:'#999', mixBlendMode:'multiply', opacity: vals.lighting/100}}/>
      </section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        {["lighting","greenery","mobility","culture"].map((k)=>(
          <div key={k}><label>{k}</label><input type="range" min={0} max={100} value={(vals as any)[k]}
            onChange={e=>setVals({...vals, [k]:Number(e.target.value)})}/></div>
        ))}
        <button onClick={async ()=>{ const r=await axios.post(`${API}/v1/simulator/urban`, vals); setOut(r.data); }}>Simulate</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:8}}>{out?JSON.stringify(out,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
