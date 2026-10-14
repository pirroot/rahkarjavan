'use client';

import { SITE } from '@/lib/site';
import {
  ArrowDownLeft,
  Bell,
  Film,
  FolderTree,
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
  { href: '/admin/comments', label: 'دیدگاه‌ها', icon: MessageSquare },
  { href: '/admin/contacts', label: 'پیام‌ها', icon: Mail, adminOnly: true },
  { href: '/admin/users', label: 'کاربران', icon: Users, adminOnly: true },
  { href: '/admin/subscribers', label: 'خبرنامه', icon: Bell, adminOnly: true },
  { href: '/admin/settings', label: 'تنظیمات', icon: Settings, adminOnly: true },
];

export default function AdminSidebar({
  displayName,
  role,
}: {
  displayName: string;
  role: 'ADMIN' | 'AUTHOR';
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside className="tn-admin-sidebar">
      <Link href="/admin" className="tn-admin-brand">
        <span>ر</span>
        <span>
          <strong>{SITE.shortName}</strong>
          <small>مدیریت تحریریه</small>
        </span>
      </Link>

      <p className="tn-admin-nav-label">فضای کاری</p>
      <nav aria-label="ناوبری پنل مدیریت">
        {items
          .filter((item) => !item.adminOnly || role === 'ADMIN')
          .map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`tn-admin-nav-item ${isActive(href) ? 'is-active' : ''}`}
            >
              <Icon size={17} /> {label}
            </Link>
          ))}
      </nav>

      <div className="tn-admin-sidebar-bottom">
        <span className="tn-admin-avatar">{displayName.slice(0, 1)}</span>
        <span>
          <strong>{displayName}</strong>
          <small>{role === 'ADMIN' ? 'مدیر کل' : 'نویسنده'}</small>
        </span>
        <Link href="/" aria-label="مشاهده وب‌سایت" title="مشاهده وب‌سایت">
          <ArrowDownLeft size={16} />
        </Link>
      </div>
    </aside>
  );
}
