'use client';
import { useEffect, useState } from 'react';
export default function Chat(){
  const [q,setQ]=useState('حلل مشروع سكني في الرياض'); const [out,setOut]=useState('');
  async function ask(){
    const r = await fetch('http://localhost:8080/v1/chat/stream',{method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:q})});
    const reader = r.body?.getReader(); const dec = new TextDecoder();
    let buf=''; setOut('');
    while(true){ const {value,done} = await reader!.read(); if(done) break; buf += dec.decode(value,{stream:true});
      for(const chunk of buf.split('\n\n')){
        if(chunk.startsWith('event: token')){
          const line = chunk.split('\n')[1]||'';
          const data = line.replace('data: ',''); try{ const j=JSON.parse(data); setOut(prev=>prev + (j.text||'')); }catch{}
        }
      }
    }
  }
  function voice(){
    const w = window as any; if(!('webkitSpeechRecognition' in w)) { alert('المتصفح لا يدعم الصوت'); return; }
    const rec = new w.webkitSpeechRecognition(); rec.lang='ar-SA'; rec.onresult=(e:any)=>{ setQ(e.results[0][0].transcript); }; rec.start();
  }
  return (<section className="card" style={{maxWidth:780, margin:'20px auto'}}>
    <h2>الشات الذكي</h2>
    <textarea className="input" value={q} onChange={e=>setQ(e.target.value)} rows={3}/>
    <div style={{display:'flex',gap:8}}>
      <button className="btn" onClick={ask}>إرسال</button>
      <button className="btn" onClick={voice}>🎤 صوت</button>
    </div>
    <pre style={{whiteSpace:'pre-wrap', minHeight:120}}>{out}</pre>
  </section>);
}
