'use client';
import { useEffect, useRef, useState } from 'react';
export default function Chat(){
  const [input, setInput] = useState('حلّل مشروع واجهة نجدية');
  const [out, setOut] = useState('');
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const send = async() => {
    const r = await fetch(API + '/v1/chat/stream', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:input}) });
    const es = new EventSource(API + '/v1/chat/stream');
    es.addEventListener('token', (e:any)=> {
      try{ const d = JSON.parse(e.data); setOut(prev => prev + d.text); }catch{}
    });
    es.addEventListener('done', ()=> es.close());
  };
  return (<section className="grid gap-3">
    <h2 className="text-xl font-bold">الشات الذكي</h2>
    <div className="flex gap-2">
      <input className="border p-2 flex-1" value={input} onChange={e=>setInput(e.target.value)} />
      <button className="btn" onClick={send}>إرسال</button>
    </div>
    <pre className="card text-sm whitespace-pre-wrap">{out}</pre>
  </section>);
}
