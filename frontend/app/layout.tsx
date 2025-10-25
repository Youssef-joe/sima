'use client';
import './globals.css';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    const handleStorageChange = () => {
      const storedLang = localStorage.getItem('language') || 'ar';
      setLang(storedLang);
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="light">
      <head>
        <title>SIMA AI Unified</title>
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}