'use client';
import { useState } from 'react';

export default function Panel(){
  const [pid,setPid]=useState('');
  const [msg,setMsg]=useState('');
  async function advance(){
    const token=localStorage.getItem('token')||'';
    const r = await fetch(`http://localhost:8080/v1/workflow/${pid}/advance`,{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body: JSON.stringify({comment:'advance'})});
    const d = await r.json(); setMsg('مرحلة: '+d.stage);
  }
  return (<section className="card" style={{maxWidth:680, margin:'20px auto'}}>
    <h2>لوحة جهة الاعتماد</h2>
    <label>Project ID</label>
    <input className="input" value={pid} onChange={e=>setPid(e.target.value)}/>
    <button className="btn" onClick={advance}>Advance</button>
    <div className="hint">{msg}</div>
  </section>);
}
