'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

function HeatCell({level}:{level:number}){
  const palette = ['#1b4332','#2d6a4f','#52b788','#ffd166','#ef476f'];
  const idx = Math.min(palette.length-1, Math.max(0, Math.floor(level)));
  return <div style={{width:24, height:24, background: palette[idx], borderRadius:4}}/>;
}

export default function Dashboard(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [data, setData] = useState<any>(null);
  useEffect(()=>{ axios.get(`${API}/v1/dashboard/engines`).then(r=>setData(r.data)); },[]);

  const grid = Array.from({length:8},()=>Array.from({length:12},()=>Math.random()*4));

  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{padding:20}}>
        <h2>Saudi City — Urban Cognition Map</h2>
        <div style={{display:'grid', gridTemplateColumns:`repeat(12, 24px)`, gap:6, marginTop:12}}>
          {grid.map((row,i)=>(row.map((v,j)=>(<HeatCell key={i+'-'+j} level={v}/>))) )}
        </div>
      </section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h3>AI Engines Performance</h3>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12}}>{data?JSON.stringify(data,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
