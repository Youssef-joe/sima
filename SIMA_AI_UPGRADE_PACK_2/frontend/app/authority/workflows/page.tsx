'use client';
import { useEffect, useState } from 'react';

type Task = { id:string; name:string; role:string; status:string; meta:any; created_at:string };
type Instance = { id:string; stage:string; status:string };

export default function Workflows(){
  const [projectId,setProjectId] = useState('');
  const [inst,setInst] = useState<Instance|null>(null);
  const [tasks,setTasks] = useState<Task[]>([]);
  const token = typeof window!=='undefined' ? localStorage.getItem('token')||'' : '';

  async function start(){
    await fetch(`http://localhost:8080/v1/workflow/${projectId}/start`,{method:'POST', headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}, body: JSON.stringify({stages:['review','committee','authority']})});
    await load();
  }
  async function load(){
    const r = await fetch(`http://localhost:8080/v1/workflow/${projectId}/status`,{headers:{'Authorization':'Bearer '+token}});
    const d = await r.json(); setInst(d.instance); setTasks(d.tasks||[]);
  }
  async function act(task_id:string, action:'approve'|'reject'){
    await fetch(`http://localhost:8080/v1/workflow/${projectId}/task`,{method:'POST', headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}, body: JSON.stringify({task_id, action})});
    await load();
  }

  return (<section className="card">
    <h2>مسارات الاعتماد — Workflow</h2>
    <div style={{display:'flex', gap:8, marginBottom:12}}>
      <input value={projectId} onChange={e=>setProjectId(e.target.value)} className="input" placeholder="Project ID"/>
      <button className="btn" onClick={start}>بدء المسار</button>
      <button className="btn" onClick={load}>تحديث</button>
    </div>
    <div><b>المرحلة:</b> {inst?.stage||'-'} — <b>الحالة:</b> {inst?.status||'-'}</div>
    <table style={{width:'100%', marginTop:12}}>
      <thead><tr><th>المهمة</th><th>الدور</th><th>الحالة</th><th>إجراء</th></tr></thead>
      <tbody>{tasks.map(t=>(
        <tr key={t.id}>
          <td>{t.name}</td><td>{t.role}</td><td>{t.status}</td>
          <td>{t.status==='open' ? (<>
            <button className="btn" onClick={()=>act(t.id,'approve')}>اعتماد</button>
            <button className="btn" onClick={()=>act(t.id,'reject')}>رفض</button>
          </>) : '-'}</td>
        </tr>
      ))}</tbody>
    </table>
  </section>);
}
