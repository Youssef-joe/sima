'use client';
import { useState, useEffect } from 'react';
export default function Login(){
  const [email,setEmail]=useState('authority@sima.sa');
  const [password,setPassword]=useState('sima1234');
  const [role,setRole]=useState('authority');
  async function seed(){ try{ await fetch('http://localhost:8080/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({email, full_name:'Authority', role, password})}); }catch{} }
  useEffect(()=>{ seed(); },[]);
  async function login(e:any){
    e.preventDefault();
    const r = await fetch('http://localhost:8080/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({email,password})});
    const d = await r.json(); localStorage.setItem('token',d.token); location.href='/dashboard';
  }
  return (<section className="card" style={{maxWidth:420, margin:'40px auto'}}>
    <h2>تسجيل الدخول</h2>
    <input className="input" value={email} onChange={e=>setEmail(e.target.value)}/>
    <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
    <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
      <option value="authority">جهة الاعتماد</option>
      <option value="consultant">استشاري</option>
      <option value="client">عميل</option>
    </select>
    <button className="btn" onClick={login}>دخول</button>
  </section>);
}
