'use client';
import { useState, useRef, useEffect } from 'react';

export default function Chat(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [input, setInput] = useState('اريد واجهة نجدية معاصرة بنسبة فتحات منخفضة');
  const [messages, setMessages] = useState<any[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const send = async () => {
    if (esRef.current) { esRef.current.close(); }
    const payload = { message: input, region: 'Central_Najdi' };
    const es = new EventSource(API + '/v1/chat/stream?' + new URLSearchParams({ body: JSON.stringify(payload) }).toString());
    esRef.current = es;
    const add = (t:string) => setMessages(prev => [...prev, { role:'assistant', content:t }]);
    let buffer = '';
    es.addEventListener('start', (e:any)=> add('🔶 [start] ' + e.data));
    es.addEventListener('token', (e:any)=> { const d = JSON.parse(e.data); buffer += d.text; setMessages(prev=>{
      const copy = [...prev];
      copy[copy.length-1] = { role:'assistant', content: buffer };
      return copy;
    }); });
    es.addEventListener('done', (e:any)=> { add('✅ [done]'); es.close(); });
    // create a placeholder assistant message for streaming
    setMessages(prev => [...prev, { role:'user', content: input }, { role:'assistant', content: '' }]);
    setInput('');
  };

  useEffect(()=>()=>{ if (esRef.current) esRef.current.close(); },[]);

  return (
    <main style={{display:'grid', gridTemplateRows:'1fr auto', height:'calc(100vh - 52px)'}}>
      <section style={{padding:16, overflow:'auto'}}>
        {messages.map((m,i)=>(<div key={i} style={{margin:'8px 0'}}>
          <div style={{opacity:.7, fontSize:12}}>{m.role}</div>
          <div style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
        </div>))}
      </section>
      <footer style={{display:'flex', gap:8, padding:12, borderTop:'1px solid #222', background:'#111'}}>
        <input style={{flex:1}} value={input} onChange={e=>setInput(e.target.value)} placeholder="اكتب سؤالك…" />
        <button onClick={send}>إرسال</button>
      </footer>
    </main>
  );
}
