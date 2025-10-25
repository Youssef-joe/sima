export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0, padding:0, background:'#0b0b0b', color:'#fff', fontFamily:'system-ui'}}>
        {children}
      </body>
    </html>
  );
}
