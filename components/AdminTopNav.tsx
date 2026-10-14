'use client';

import {
  ArrowRight,
  Bell,
  Film,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Newspaper,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/news', label: 'خبرها', icon: Newspaper },
  { href: '/admin/videos', label: 'ویدیوها', icon: Film },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
  { href: '/admin/media', label: 'رسانه‌ها', icon: ImageIcon },
  { href: '/admin/comments', label: 'دیدگاه‌ها', icon: MessageSquare },
  { href: '/admin/contacts', label: 'پیام‌ها', icon: Mail, adminOnly: true },
  { href: '/admin/users', label: 'کاربران', icon: Users, adminOnly: true },
  { href: '/admin/subscribers', label: 'خبرنامه', icon: Bell, adminOnly: true },
  { href: '/admin/settings', label: 'تنظیمات', icon: Settings, adminOnly: true },
];

export default function AdminTopNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0d141e] px-4 py-3 sm:px-8"
      aria-label="ناوبری مدیریت"
    >
      {items
        .filter((i) => !i.adminOnly || isAdmin)
        .map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return active ? (
            <span
              key={href}
              aria-current="page"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white"
            >
              <Icon size={16} /> {label}
            </span>
          ) : (
            <Link
              key={href}
              href={href}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Icon size={16} /> {label}
            </Link>
          );
        })}

      <Link
        href="/"
        className="mr-auto inline-flex shrink-0 items-center gap-2 text-xs text-slate-400 transition hover:text-white"
      >
        <ArrowRight size={14} /> بازگشت به سایت
      </Link>
    </nav>
  );
}
