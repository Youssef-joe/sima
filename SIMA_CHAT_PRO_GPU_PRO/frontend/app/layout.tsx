export const metadata = { title: "SIMA Chat Pro GPU-PRO" };
export default function RootLayout({ children }){
  return (
    <html lang="ar" dir="rtl">
      <body style={{margin:0, padding:0, background:'#0b0b0b', color:'#eaeaea', fontFamily:'system-ui'}}>
        <nav style={{display:'flex', gap:12, padding:'12px 20px', background:'#111', borderBottom:'1px solid #222'}}>
          <a href="/chat">الشات</a>
          <a href="/rag">RAG</a>
          <a href="/settings">الإعدادات</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
