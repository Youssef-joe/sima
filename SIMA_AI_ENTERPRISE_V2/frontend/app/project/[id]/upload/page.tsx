'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function Upload(){
  const { id } = useParams() as any;
  const [file,setFile]=useState<File|null>(null);
  const [msg,setMsg]=useState('');

  async function send(e:any){
    e.preventDefault();
    const token=localStorage.getItem('token')||'';
    const form = new FormData();
    if(file) form.append('file', file, file.name);
    const r = await fetch(`http://localhost:8080/v1/project/${id}/upload`,{ method:'POST', headers:{'Authorization':'Bearer '+token}, body: form });
    setMsg(r.ok?'تم الرفع بنجاح':'فشل');
  }
  return (<section className="card" style={{maxWidth:680, margin:'20px auto'}}>
    <h2>رفع ملفات المشروع</h2>
    <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} className="input"/>
    <button className="btn" onClick={send}>رفع</button>
    <div className="hint">{msg}</div>
    <a className="btn" href={`/project/${id}/analysis`}>الذهاب للتحليل</a>
  </section>);
}
