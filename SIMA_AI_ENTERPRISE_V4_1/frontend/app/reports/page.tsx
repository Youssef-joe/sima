'use client';
import { useState } from 'react';
export default function Reports(){
  const [pid,setPid]=useState(''); const [lang,setLang]=useState('ar'); const [url,setUrl]=useState('');
  async function gen(){
    const token=localStorage.getItem('token')||'';
    const r = await fetch(`http://localhost:8080/v1/project/${pid}/report.pdf?lang=${lang}`,{headers:{'Authorization':'Bearer '+token}});
    const blob = await r.blob(); setUrl(URL.createObjectURL(blob));
  }
  return (<section><h2>تقارير</h2>
    <input value={pid} onChange={e=>setPid(e.target.value)} placeholder="project_id"/>
    <select value={lang} onChange={e=>setLang(e.target.value)}><option value="ar">AR</option><option value="en">EN</option></select>
    <button onClick={gen}>توليد</button>
    {url && <iframe src={url} style={{width:'100%', height:'70vh'}} />}
  </section>);
}
