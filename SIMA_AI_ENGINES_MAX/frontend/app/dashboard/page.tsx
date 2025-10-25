'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard(){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const [status, setStatus] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  useEffect(()=>{
    const interval = setInterval(()=>{
      axios.get(`${API}/healthz`).then(()=>setStatus('ok'));
      fetch('http://localhost:8090/').then(r=>r.json()).then(setTrainer).catch(()=>{});
    }, 1500);
    return ()=>clearInterval(interval);
  },[]);

  return (
    <main style={{padding:20}}>
      <h2>System</h2>
      <div>API Health: {String(status)}</div>
      <div>Trainer: {trainer? JSON.stringify(trainer): '...'}</div>
      <p>افتح /metrics لـ Prometheus.</p>
    </main>
  );
}
