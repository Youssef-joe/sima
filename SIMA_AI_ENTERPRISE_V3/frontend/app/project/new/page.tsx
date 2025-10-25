'use client';
import { useState } from 'react';
export default function NewProject(){
  const [title,setTitle]=useState('مشروع سكني');
  const [region,setRegion]=useState('Najdi');
  const [city,setCity]=useState('الرياض');
  const [fn,setFn]=useState('residential');
  const [pid,setPid]=useState(''); const [tracking,setTracking]=useState('');
  async function createProject(e:any){
    e.preventDefault();
    const token=localStorage.getItem('token')||'';
    const r = await fetch('http://localhost:8080/v1/project/new',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({title, region, city, function:fn})});
    const data = await r.json(); setPid(data.project_id); setTracking(data.tracking_no);
  }
  return (<section className="card" style={{maxWidth:680, margin:'20px auto'}}>
    <h2>إنشاء مشروع</h2>
    <form onSubmit={createProject}>
      <label>العنوان</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)}/>
      <label>المنطقة</label><input className="input" value={region} onChange={e=>setRegion(e.target.value)}/>
      <label>المدينة</label><input className="input" value={city} onChange={e=>setCity(e.target.value)}/>
      <label>الوظيفة</label><input className="input" value={fn} onChange={e=>setFn(e.target.value)}/>
      <button className="btn">إنشاء</button>
    </form>
    {pid && <div className="card">
      <div>project_id: {pid}</div>
      <div>tracking: {tracking}</div>
      <a className="btn" href={`/project/${pid}/upload`}>رفع الملفات</a>
    </div>}
  </section>);
}
