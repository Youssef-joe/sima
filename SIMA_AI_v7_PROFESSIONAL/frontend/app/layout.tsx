export default function RootLayout({ children }){
  return (
    <html lang="ar" dir="rtl">
      <body style={{margin:0, padding:0, background:'#0b0b0b', color:'#eaeaea', fontFamily:'system-ui'}}>
        <nav style={{display:'flex', gap:12, padding:'12px 20px', background:'#111', borderBottom:'1px solid #222'}}>
          <a href="/">Home</a>
          <a href="/studio">Studio</a>
          <a href="/sim">Simulator</a>
          <a href="/chat">Chat</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
