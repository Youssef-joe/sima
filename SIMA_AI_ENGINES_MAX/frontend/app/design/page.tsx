'use client';
import { useState } from 'react';
export default function Design(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [prompt, setPrompt] = useState('modern villa two floors low windows');
  const [out, setOut] = useState<any>(null);
  return (
    <main style={{display:'grid', gridTemplateColumns:'1fr 420px', height:'calc(100vh - 52px)'}}>
      <section style={{display:'grid', placeItems:'center'}}>
        <div style={{width:520, height:320, background:'#333', borderRadius:12, display:'grid', placeItems:'center'}}>AI Preview</div>
      </section>
      <aside style={{padding:16, background:'#121212', borderLeft:'1px solid #222'}}>
        <h3>Text → 3D Params</h3>
        <textarea style={{width:'100%', height:120}} value={prompt} onChange={e=>setPrompt(e.target.value)}/>
        <button style={{marginTop:8}} onClick={async ()=>{
          const js = await (await fetch(`${API}/v1/generate3d/from_text`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt})})).json();
          setOut(js);
        }}>Generate</button>
        <pre style={{background:'#0a0a0a', padding:10, fontSize:12, marginTop:10}}>{out?JSON.stringify(out,null,2):'...'}</pre>
      </aside>
    </main>
  );
}
