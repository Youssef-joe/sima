'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Cert(){
  const { id } = useParams() as any;
  const [url,setUrl]=useState('');
  useEffect(()=>{
    (async()=>{
      const token=localStorage.getItem('token')||'';
      const r = await fetch(`http://localhost:8080/v1/project/${id}/certificate`,{headers:{'Authorization':'Bearer '+token}});
      const blob = await r.blob();
      setUrl(URL.createObjectURL(blob));
    })();
  },[id]);
  return (<section className="card" style={{maxWidth:540, margin:'20px auto', textAlign:'center'}}>
    <h2>شهادة المشروع</h2>
    {url && <img src={url} alt="QR" style={{maxWidth:'100%'}}/>}
  </section>);
}
