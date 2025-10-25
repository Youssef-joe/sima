'use client';
import { useEffect, useState } from 'react';
export default function Report({ params }:{ params:{ id:string } }){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [analysis, setAnalysis] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  useEffect(()=>{
    (async()=>{
      const a = await (await fetch(`${API}/v1/project/${params.id}/analysis`)).json();
      setAnalysis(a);
      const s = await (await fetch(`${API}/v1/project/${params.id}/score`)).json();
      setScore(s);
    })();
  },[params.id]);
  return (<section className="grid gap-3">
    <h2 className="text-xl font-bold">تقرير مشروع</h2>
    <pre className="card text-xs">{JSON.stringify(analysis,null,2)}</pre>
    <pre className="card text-xs">{JSON.stringify(score,null,2)}</pre>
  </section>);
}
