'use client';
import { useState, useEffect } from 'react';
export default function Login(){
  const [email,setEmail]=useState('authority@sima.sa');
  const [password,setPassword]=useState('sima1234');
  const [role,setRole]=useState('authority');
  const [msg,setMsg]=useState('');
  async function ensureSeedUser(){
    try{ await fetch('http://localhost:8080/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, full_name:'Authority', role, password})}); }catch{}
  }
  useEffect(()=>{ ensureSeedUser(); },[]);
  async function login(e:any){
    e.preventDefault();
    const r = await fetch('http://localhost:8080/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({email,password})});
    if(!r.ok){ setMsg('فشل الدخول'); return; }
    const d = await r.json();
    localStorage.setItem('token',d.token); localStorage.setItem('role',d.role); localStorage.setItem('email',email);
    location.href='/dashboard';
  }
  return (<section className="card" style={{maxWidth:420, margin:'40px auto'}}>
    <h2>تسجيل الدخول</h2>
    <label>البريد</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)}/>
    <label>كلمة المرور</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
    <label>الدور</label>
    <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
      <option value="authority">جهة الاعتماد</option>
      <option value="consultant">استشاري التصميم</option>
      <option value="client">العميل</option>
    </select>
    <button className="btn" onClick={login}>دخول</button>
    <div className="hint">{msg}</div>
  </section>);
}
