'use client';
import { useEffect, useState } from 'react';
function Guard({children}:{children:any}){ useEffect(()=>{ if(!localStorage.getItem('token')) location.href='/auth/login'; },[]); return children;}
export default function Dashboard(){
  const [role,setRole]=useState(''); const [email,setEmail]=useState('');
  useEffect(()=>{ setRole(localStorage.getItem('role')||''); setEmail(localStorage.getItem('email')||''); },[]);
  return (<Guard>
    <section className="grid">
      <div className="card"><h3>الترحيب</h3><div>الدور: {role} — {email}</div></div>
      <div className="card"><h3>مشروع جديد</h3><a href="/project/new" className="btn">إنشاء مشروع</a></div>
      <div className="card"><h3>استوديو 3D</h3><a href="/studio/3d" className="btn">فتح الاستوديو</a></div>
      <div className="card"><h3>لوحات مراقبة</h3><a href="http://localhost:3001" className="btn" target="_blank">Grafana</a></div>
      <div className="card"><h3>لوحة الجهات</h3><a href="/authority/panel" className="btn">Authority Panel</a></div>
      <div className="card"><h3>الشات</h3><a href="/chat" className="btn">دردشة الذكاء</a></div>
    </section>
  </Guard>);
}
