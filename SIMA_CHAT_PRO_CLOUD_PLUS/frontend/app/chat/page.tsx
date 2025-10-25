'use client';
import { useEffect, useRef, useState } from 'react';

export default function Chat(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [mode, setMode] = useState<'local'|'hybrid'|'cloud'>('local');
  const [input, setInput] = useState('أريد واجهة نجدية معاصرة صالحة لمناخ البحر الأحمر');
  const [msgs, setMsgs] = useState<any[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const send = async () => {
    if (esRef.current) esRef.current.close();
    const payload = { message: input, region: 'Central_Najdi', mode };
    const url = API + '/v1/chat/stream?' + new URLSearchParams({ body: JSON.stringify(payload) }).toString();
    const es = new EventSource(url);
    esRef.current = es;
    setMsgs(prev => [...prev, { role:'user', content: input }, { role:'assistant', content: '' }]);
    let buffer = '';

    es.addEventListener('start', (e:any)=> setMsgs(prev => [...prev, { role:'event', content: e.data }]));
    es.addEventListener('tools', (e:any)=> setMsgs(prev => [...prev, { role:'event', content: 'TOOLS ' + e.data }]));
    es.addEventListener('token', (e:any)=> {
      const d = JSON.parse(e.data);
      buffer += d.text;
      setMsgs(prev => {
        const copy = [...prev];
        copy[copy.length-1] = { role:'assistant', content: buffer };
        return copy;
      });
    });
    es.addEventListener('done', ()=> es.close());
    setInput('');
  };

  useEffect(()=>()=>{ if (esRef.current) esRef.current.close(); },[]);

  return (
    <main style={{display:'grid', gridTemplateRows:'1fr auto', height:'calc(100vh - 52px)'}}>
      <section style={{padding:16, overflow:'auto'}}>
        {msgs.map((m,i)=>(<div key={i} style={{margin:'8px 0'}}>
          <div style={{opacity:.7, fontSize:12}}>{m.role}</div>
          <div style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
        </div>))}
      </section>
      <footer style={{display:'flex', gap:8, padding:12, borderTop:'1px solid #222', background:'#111'}}>
        <select value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="local">محلي أولًا</option>
          <option value="hybrid">هجيني</option>
          <option value="cloud">سحابة فقط</option>
        </select>
        <input style={{flex:1}} value={input} onChange={e=>setInput(e.target.value)} placeholder="اكتب سؤالك…" />
        <button onClick={send}>إرسال</button>
      </footer>
    </main>
  );
}
