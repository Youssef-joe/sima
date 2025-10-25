'use client';
import { useEffect, useState } from 'react';

export default function RAG(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [hits, setHits] = useState<any[]>([]);

  const onUpload = async (e:any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    await fetch(`${API}/v1/rag/upload`, { method:'POST', body: fd });
    const res = await (await fetch(`${API}/v1/rag/search`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({query:'الهوية السعودية', k:3}) })).json();
    setHits(res.hits || []);
  };

  return (
    <main style={{padding:16}}>
      <h3>رفع مراجع (PDF/TXT/MD)</h3>
      <input type="file" onChange={onUpload} />
      <h3 style={{marginTop:12}}>نتائج البحث</h3>
      <pre style={{background:'#0a0a0a', padding:10, fontSize:12}}>{JSON.stringify(hits, null, 2)}</pre>
    </main>
  );
}
