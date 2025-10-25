'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function TL(){
  const { id } = useParams() as any;
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{
    (async()=>{
      const token=localStorage.getItem('token')||'';
      const r = await fetch(`http://localhost:8080/v1/project/${id}/timeline`,{headers:{'Authorization':'Bearer '+token}});
      const d = await r.json(); setItems(d.events||[]);
    })();
  },[id]);
  return (<section className="card" style={{maxWidth:720, margin:'20px auto'}}>
    <h2>التسلسل الزمني</h2>
    {items.map((x,i)=>(<div key={i} className="card"><b>{x.kind}</b><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(x.payload,null,2)}</pre><div className="hint">{x.at}</div></div>))}
  </section>);
}
