'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Viewer = dynamic(()=>import('./viewer'), { ssr:false });

export default function Page(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [msg, setMsg] = useState('ارفع نسبة ظلال الشرفة وحافظ على هوية نجد');
  const [reply, setReply] = useState<any>(null);
  const [score, setScore] = useState<any>(null);

  useEffect(()=>{
    axios.post(`${API}/v1/identity/score`, {region_hint:'Central_Najdi', wwr:22, height_ratio:1.6, colors:['RAL 1015'], features:['triangular_bands','crenellation']})
      .then(r=>setScore(r.data)).catch(console.error);
  },[]);

  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'100vh'}}>
      <section style={{position:'relative'}}>
        <Viewer/>
      </section>
      <aside style={{padding:20, borderLeft:'1px solid #222', background:'#111'}}>
        <h2>SIMA AI v5 MAX</h2>
        <p>API: {API}</p>

        <h3 style={{marginTop:16}}>هوية المشروع</h3>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12}}>{JSON.stringify(score, null, 2)}</pre>

        <h3 style={{marginTop:16}}>المحادثة الذكية</h3>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} style={{width:'100%', height:90}} />
        <button onClick={async ()=>{
          const r = await axios.post(`${API}/v1/chat`, {message: msg, region: 'Central_Najdi'});
          setReply(r.data);
        }} style={{marginTop:8}}>أرسل</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:8}}>{reply ? JSON.stringify(reply, null, 2) : '...'}</pre>

        <h3 style={{marginTop:16}}>رفع صورة للتحليل</h3>
        <input type="file" onChange={async e=>{
          const f = e.target.files?.[0]; if(!f) return;
          const fd = new FormData(); fd.append('file', f);
          const r = await axios.post(`${API}/v1/vision/analyze`, fd, {headers:{'Content-Type':'multipart/form-data'}});
          alert('Predicted: '+ r.data.predicted_regions.map((x:any)=>x.region+':'+x.confidence).join(', '));
        }}/>
      </aside>
    </main>
  );
}
