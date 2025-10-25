export const metadata = { title: "SIMA AI v6 NEXT" };
export default function RootLayout({ children }){
  return (
    <html lang="ar" dir="rtl">
      <body style={{margin:0, padding:0, background:'#0b0b0b', color:'#e9e9e9', fontFamily:'system-ui'}}>
        <nav style={{display:'flex', gap:12, padding:'12px 20px', background:'#111', borderBottom:'1px solid #222'}}>
          <a href="/studio">Studio</a>
          <a href="/simulator">Simulator</a>
          <a href="/design">AI Design</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
