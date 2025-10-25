'use client';
import { useEffect, useState } from 'react';
function Guard({children}:{children:any}){
  useEffect(()=>{ if(!localStorage.getItem('token')) location.href='/auth/login'; },[]);
  return children;
}
export default function Dashboard(){
  const [role,setRole]=useState(''); const [email,setEmail]=useState('');
  useEffect(()=>{ setRole(localStorage.getItem('role')||''); setEmail(localStorage.getItem('email')||''); },[]);
  return (<Guard>
    <section className="grid">
      <div className="card"><h3>الترحيب</h3><div>الدور: {role} — {email}</div></div>
      <div className="card"><h3>مشروع جديد</h3><a href="/project/new" className="btn">إنشاء مشروع</a></div>
      <div className="card"><h3>المحاكاة</h3><a href="/studio/3d" className="btn">استوديو ثلاثي الأبعاد</a></div>
      <div className="card"><h3>التحليلات</h3><a href="http://localhost:3001" className="btn" target="_blank">Grafana</a></div>
    </section>
  </Guard>);
}
