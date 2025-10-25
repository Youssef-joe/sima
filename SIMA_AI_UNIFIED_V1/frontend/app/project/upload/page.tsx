'use client';
import { useState } from 'react';
export default function Upload(){
  const [file, setFile]=useState<File|null>(null);
  const [res, setRes]=useState<any>(null);
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const send = async()=>{
    if(!file) return;
    const fd = new FormData(); fd.append('file', file);
    const r = await fetch(API + '/v1/project/upload', { method:'POST', body: fd });
    const j = await r.json(); setRes(j);
  };
  return (<section className="grid gap-3">
    <h2 className="text-xl font-bold">رفع مشروع</h2>
    <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
    <button className="btn" onClick={send}>رفع</button>
    <pre className="card text-xs">{JSON.stringify(res,null,2)}</pre>
  </section>);
}
