'use client';
import { useState, useEffect } from 'react';
export default function Simulator(){
  const [pid, setPid] = useState('00000000-0000-0000-0000-000000000000');
  const [iot, setIot] = useState<any>({readings:[]});
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const load = async()=>{
    const r = await fetch(`${API}/v1/iot/latest/${pid}`);
    setIot(await r.json());
  };
  useEffect(()=>{ load(); },[]);
  return (<section className="grid gap-3">
    <h2 className="text-xl font-bold">محاكاة حضرية</h2>
    <div className="card">
      <div className="flex gap-2">
        <input className="border p-2" value={pid} onChange={e=>setPid(e.target.value)} />
        <button className="btn" onClick={load}>تحديث</button>
      </div>
      <div className="mt-3">
        {iot.readings?.map((r:any, i:number)=>(
          <div key={i} className="text-sm">{r.ts} — {r.type}: {r.value}</div>
        ))}
      </div>
    </div>
  </section>);
}
