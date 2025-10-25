'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [lang, setLang] = useState('ar');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('language') || 'ar';
    setLang(storedLang);
  }, []);

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
    window.dispatchEvent(new Event('storage'));
  };

  const t = {
    ar: {
      brand: 'سيما الذكاء المعماري',
      dashboard: 'لوحة التحكم',
      projects: 'المشاريع',
      chat: 'المساعد الذكي',
      studio: 'الاستوديو ثلاثي الأبعاد',
      reports: 'التقارير',
      authority: 'الجهة المعتمدة'
    },
    en: {
      brand: 'SIMA Architectural AI',
      dashboard: 'Dashboard',
      projects: 'Projects',
      chat: 'AI Assistant',
      studio: '3D Studio',
      reports: 'Reports',
      authority: 'Authority'
    }
  };

  const navItems = [
    { href: '/dashboard', label: t[lang].dashboard },
    { href: '/project', label: t[lang].projects },
    { href: '/chat', label: t[lang].chat },
    { href: '/studio/3d', label: t[lang].studio },
    { href: '/reports', label: t[lang].reports },
    { href: '/authority', label: t[lang].authority }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center">
                <Shield className="w-5 h-5 text-white"/>
              </div>
              <span className="font-semibold text-slate-900">{t[lang].brand}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLangChange(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}