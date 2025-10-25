'use client';
import { useState } from 'react';
export default function Chat(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [msg, setMsg] = useState('واجهة نجديّة معاصرة بنسبة فتحات منخفضة');
  const [reply, setReply] = useState<any>(null);
  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{display:'grid', placeItems:'center'}}><div>Chat Architect</div></section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <textarea style={{width:'100%', height:120}} value={msg} onChange={e=>setMsg(e.target.value)}/>
        <button style={{marginTop:8}} onClick={async ()=>{
          const js = await (await fetch(`${API}/v1/chat`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:msg, region:'Central_Najdi'})})).json();
          setReply(js);
        }}>Send</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:10}}>{reply?JSON.stringify(reply,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
