'use client';
import { useState } from 'react';
export default function Chat(){
  const [q,setQ]=useState('حلل مشروع سكني في جدة'); const [out,setOut]=useState('');
  async function ask(){
    const r = await fetch('http://localhost:8080/v1/chat/stream',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({message:q})});
    const reader = r.body?.getReader(); const dec = new TextDecoder(); let buf=''; setOut('');
    while(true){ const {value,done} = await reader!.read(); if(done) break; buf += dec.decode(value,{stream:true});
      for(const chunk of buf.split('\n\n')){
        if(chunk.startsWith('event: token')){ const line = chunk.split('\n')[1]||''; const data = line.replace('data: ',''); try{ const j=JSON.parse(data); setOut(prev=>prev + (j.text||'')); }catch{} }
      }
    }
  }
  return (<section className="card" style={{maxWidth:780, margin:'20px auto'}}>
    <h2>الشات الذكي (vLLM Gateway Ready)</h2>
    <textarea className="input" rows={3} value={q} onChange={e=>setQ(e.target.value)} />
    <button className="btn" onClick={ask}>إرسال</button>
    <pre style={{whiteSpace:'pre-wrap', minHeight:120}}>{out}</pre>
  </section>);
}
