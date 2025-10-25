export const metadata = { title: 'SIMA AI', description: 'Saudi Architecture Compliance' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="top">
          <div>🟢 SIMA AI</div>
          <nav className="lang">
            <a href="/auth/login" className="btn">تسجيل الدخول</a>
            <a href="/dashboard" className="btn">لوحة التحكم</a>
            <a href="/studio/3d" className="btn">استوديو 3D</a>
          </nav>
        </div>
        <link rel="stylesheet" href="/app/globals.css" />
        <main style={{padding:'16px'}}>{children}</main>
      </body>
    </html>
  );
}
