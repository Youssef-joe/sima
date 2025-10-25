'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Design(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [msg, setMsg] = useState('منزل معاصر بنسب نجديّة ولون بيج RAL 1015');
  const [reply, setReply] = useState<any>(null);

  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{display:'grid', placeItems:'center'}}>
        <div style={{width:520, height:320, background:'#333', borderRadius:12, display:'grid', placeItems:'center'}}>AI Preview</div>
      </section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h2>AI Design Studio</h2>
        <label>وصف الفكرة</label>
        <textarea style={{width:'100%', height:120}} value={msg} onChange={e=>setMsg(e.target.value)}/>
        <button style={{marginTop:8}} onClick={async ()=>{
          const r = await axios.post(`${API}/v1/chat`, {message: msg, region:'Central_Najdi'});
          setReply(r.data);
        }}>Create Design</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:10}}>{reply?JSON.stringify(reply,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
