'use client';
import { useState } from 'react';
export default function LC(){
  const [city,setCity]=useState('الرياض'); const [area,setArea]=useState(1000); const [wwr,setWWR]=useState(0.35);
  const [res,setRes]=useState<any>(null);
  async function run(){
    const token=localStorage.getItem('token')||'';
    const r = await fetch('http://localhost:8080/v1/sim/lifecycle',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({city, area: +area, wwr:+wwr})});
    const d = await r.json(); setRes(d);
  }
  return (<section className="card" style={{maxWidth:720, margin:'20px auto'}}>
    <h2>محاكاة الاستدامة (10 سنوات)</h2>
    <label>المدينة</label><select className="input" value={city} onChange={e=>setCity(e.target.value)}>
      <option>الرياض</option><option>جدة</option><option>أبها</option>
    </select>
    <label>المساحة (م²)</label><input className="input" type="number" value={area} onChange={e=>setArea(+e.target.value)} />
    <label>WWR</label><input className="input" type="number" step="0.05" value={wwr} onChange={e=>setWWR(+e.target.value)} />
    <button className="btn" onClick={run}>تشغيل</button>
    {res && <div className="card">
      <h3>النتائج السنوية</h3>
      <div>Cooling (MWh): {res.yearly.cooling_mwh}</div>
      <div>Water (m³): {res.yearly.water_m3}</div>
      <h3>الإجمالي (10 سنوات)</h3>
      <div>Energy (MWh): {res.ten_years.energy_mwh}</div>
      <div>Water (m³): {res.ten_years.water_m3}</div>
      <div>Materials Index: {res.ten_years.materials_index}</div>
      <h3>مؤشر الاستدامة: {res.sustainability_index}</h3>
    </div>}
  </section>);
}
