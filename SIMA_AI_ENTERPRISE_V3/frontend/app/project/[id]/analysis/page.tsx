'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Analysis(){
  const { id } = useParams() as any;
  const [score,setScore]=useState<any>(null);
  const [stage,setStage]=useState<string>('');
  async function fetchScore(){
    const token=localStorage.getItem('token')||'';
    const r = await fetch(`http://localhost:8080/v1/project/${id}/score`,{headers:{'Authorization':'Bearer '+token}});
    const d = await r.json(); setScore(d);
  }
  async function startWF(){
    const token=localStorage.getItem('token')||'';
    const r = await fetch(`http://localhost:8080/v1/workflow/${id}/start`,{method:'POST',headers:{'Authorization':'Bearer '+token}});
    const d = await r.json(); setStage(d.stage);
  }
  useEffect(()=>{ fetchScore(); },[id]);
  return (<section className="card" style={{maxWidth:720, margin:'20px auto'}}>
    <h2>التحليل والنتيجة</h2>
    {score && <div>
      <div>الهوية: {score.identity}</div>
      <div>المناخ: {score.climate}</div>
      <div>السياق: {score.context}</div>
      <div>الوظيفة: {score.function}</div>
      <div>الإنسان: {score.human}</div>
      <hr/><h3>الإجمالي: {score.total} — {score.status}</h3>
      <button className="btn" onClick={startWF}>بدء دورة الاعتماد</button>
      <div className="hint">المرحلة الحالية: {stage}</div>
    </div>}
  </section>);
}
