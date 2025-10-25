export const metadata = { title: "SIMA AI — Engines MAX" };
export default function RootLayout({ children }){
  return (
    <html lang="ar" dir="rtl">
      <body style={{margin:0, padding:0, background:'#0b0b0b', color:'#e9e9e9', fontFamily:'system-ui'}}>
        <nav style={{display:'flex', gap:12, padding:'12px 20px', background:'#111', borderBottom:'1px solid #222'}}>
          <a href="/studio">Studio</a>
          <a href="/design">Design</a>
          <a href="/layout">Layout</a>
          <a href="/structure">Structure</a>
          <a href="/materials">Materials</a>
          <a href="/eco">Eco</a>
          <a href="/chat">Chat</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
