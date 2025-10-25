export default function Page(){
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">مرحبًا بك في منصة الاعتماد المعماري السعودي</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><div className="text-sm">مشاريع</div><div className="text-3xl font-bold">12</div></div>
        <div className="card"><div className="text-sm">PASS</div><div className="text-3xl font-bold text-green-600">8</div></div>
        <div className="card"><div className="text-sm">CONDITIONAL</div><div className="text-3xl font-bold text-yellow-600">2</div></div>
        <div className="card"><div className="text-sm">FAIL</div><div className="text-3xl font-bold text-red-600">2</div></div>
      </div>
    </section>
  );
}
