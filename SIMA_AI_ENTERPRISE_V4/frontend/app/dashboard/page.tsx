'use client';
export default function Dashboard(){
  return (<section className="grid">
    <div className="card"><h3>مشروع جديد</h3><a className="btn" href="/project/new">إنشاء</a></div>
    <div className="card"><h3>استوديو 3D</h3><a className="btn" href="/studio/3d">فتح</a></div>
    <div className="card"><h3>محاكاة الاستدامة</h3><a className="btn" href="/urban/lifecycle">بدء</a></div>
    <div className="card"><h3>City Atlas</h3><a className="btn" href="/city/atlas">عرض الخريطة</a></div>
    <div className="card"><h3>الشات</h3><a className="btn" href="/chat">دردشة</a></div>
  </section>);
}
