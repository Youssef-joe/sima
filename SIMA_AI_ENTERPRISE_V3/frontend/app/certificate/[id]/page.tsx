'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Cert(){
  const { id } = useParams() as any;
  const [url,setUrl]=useState('');
  useEffect(()=>{
    (async()=>{
      const token=localStorage.getItem('token')||'';
      const r = await fetch(`http://localhost:8080/v1/project/${id}/certificate.pdf`,{headers:{'Authorization':'Bearer '+token}});
      const blob = await r.blob(); setUrl(URL.createObjectURL(blob));
    })();
  },[id]);
  return (<section className="card" style={{maxWidth:680, margin:'20px auto', textAlign:'center'}}>
    <h2>شهادة المشروع (PDF)</h2>
    {url && <iframe src={url} style={{width:'100%', height:'70vh'}} />}
  </section>);
}
