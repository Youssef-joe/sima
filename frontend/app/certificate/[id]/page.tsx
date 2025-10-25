'use client';
export default function Cert({ params }:{ params:{ id: string } }){
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${API}/v1/project/${params.id}/certificate`;
  return (<section className="grid gap-3">
    <h2 className="text-xl font-bold">الشهادة</h2>
    <a className="btn" href={url} target="_blank">تحميل PDF</a>
  </section>);
}
