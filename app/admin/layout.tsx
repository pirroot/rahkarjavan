import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'پنل مدیریت', template: '%s | پنل راهکار جوان' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div dir="rtl" className="min-h-screen  bg-[#080d14] font-sans text-slate-100 antialiased">
      {children}
    </div>
  );
}
