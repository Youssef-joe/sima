import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'SIMA AI Unified' };

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="ar" dir="rtl" className="light">
      <body>
        <nav className="border-b bg-white sticky top-0 z-10">
          <div className="container flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-brand">SIMA AI</span>
              <Link href="/">لوحة التحكم</Link>
              <Link href="/project/upload">رفع</Link>
              <Link href="/studio/3d">3D</Link>
              <Link href="/urban/simulator">محاكاة</Link>
              <Link href="/chat">الشات</Link>
              <Link href="/authority">الجهة</Link>
            </div>
            <div className="flex items-center gap-3">
              <button id="toggle-theme" className="btn">تبديل الوضع</button>
              <select id="lang" className="border rounded p-2">
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </nav>
        <script dangerouslySetInnerHTML={{__html:`
          (function(){
            const html = document.documentElement;
            const btn = document.getElementById('toggle-theme');
            const sel = document.getElementById('lang');
            if(btn){ btn.addEventListener('click',()=>{ html.classList.toggle('dark'); html.classList.toggle('light'); }); }
            if(sel){
              sel.addEventListener('change',(e)=>{
                const v=(e.target as HTMLSelectElement).value;
                localStorage.setItem('lang', v);
                location.reload();
              });
              const saved = localStorage.getItem('lang')||'ar';
              sel.value = saved;
              document.documentElement.lang = saved;
              document.documentElement.dir = saved==='ar'?'rtl':'ltr';
            }
          })();
        `}} />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
