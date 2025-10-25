'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Simulator(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [vals, setVals] = useState({lighting:50, greenery:50, mobility:50, culture:50});
  const [out, setOut] = useState<any>(null);
  useEffect(()=>{ run(); },[]);

  async function run(){
    const r = await axios.post(`${API}/v1/simulator/urban`, vals);
    setOut(r.data);
  }

  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{position:'relative', background:'#f2f2f2'}}>
        {/* Before/After mock: a simple overlay controlled by range */}
        <div style={{position:'absolute', inset:0, background:'#ddd'}}/>
        <div style={{position:'absolute', inset:0, width: `${vals.greenery+20}%`, overflow:'hidden'}}>
          <div style={{position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(34,197,94,0.4), rgba(59,130,246,0.35))'}}/>
        </div>
        <input type="range" min={0} max={100} value={vals.greenery} onChange={e=>setVals({...vals, greenery:Number(e.target.value)})} style={{position:'absolute', left:20, right:20, bottom:20}}/>
      </section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h2>Urban Scenario Control</h2>
        {["lighting","greenery","mobility","culture"].map(k=>(
          <div key={k} style={{margin:'10px 0'}}>
            <label style={{display:'flex', justifyContent:'space-between'}}>
              <span>{k}</span><span>{(vals as any)[k]}</span>
            </label>
            <input type="range" min={0} max={100} value={(vals as any)[k]} onChange={e=>setVals({...vals, [k]:Number(e.target.value)})}/>
          </div>
        ))}
        <button onClick={run} style={{marginTop:8}}>Simulate</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:10}}>{out?JSON.stringify(out,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
