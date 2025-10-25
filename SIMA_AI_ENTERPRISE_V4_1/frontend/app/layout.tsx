export const metadata = { title: 'SIMA AI', description: 'Saudi Architecture' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="ar" dir="rtl"><body>{children}</body></html>);
}
