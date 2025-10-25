'use client';
import { useEffect, useState } from 'react';
type Row = {type:string; val:number; ts:string};
export default function IOT(){
  const [projectId,setProjectId] = useState('demo-project');
  const [data,setData] = useState<Row[]>([]);
  const token = typeof window!=='undefined' ? localStorage.getItem('token')||'' : '';
  async function load(){
    const r = await fetch(`http://localhost:8080/v1/sensor/${projectId}/latest`,{headers:{'Authorization':'Bearer '+token}});
    const d = await r.json(); setData(d.data||[]);
  }
  useEffect(()=>{ load(); const id=setInterval(load, 3000); return ()=>clearInterval(id); },[projectId]);
  return (<section className="card">
    <h2>لوحة حساسات IoT — TLS MQTT</h2>
    <div style={{display:'flex', gap:8, marginBottom:12}}>
      <input value={projectId} onChange={e=>setProjectId(e.target.value)} className="input" placeholder="Project ID"/>
      <button className="btn" onClick={load}>تحديث</button>
    </div>
    <table style={{width:'100%'}}>
      <thead><tr><th>النوع</th><th>القيمة</th><th>الزمن</th></tr></thead>
      <tbody>{data.map((r,i)=>(<tr key={i}><td>{r.type}</td><td>{r.val.toFixed(2)}</td><td>{new Date(r.ts).toLocaleString()}</td></tr>))}</tbody>
    </table>
    <p style={{marginTop:8, opacity:.8}}>اختبار سريع: <code>python scripts/sensor_publish_demo.py &lt;PROJECT_ID&gt;</code></p>
  </section>);
}
