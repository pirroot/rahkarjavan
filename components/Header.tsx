'use client';

import LogoutButton from '@/components/LogoutButton';
import type { Brand } from '@/lib/settings';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/', label: 'رسانه تصویری' },
  { href: '/mag', label: 'مجله' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس با ما' },
];

export default function Header({ brand }: { brand: Brand }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  const { theme, setTheme } = useTheme();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 text-gray-950 backdrop-blur-xl dark:border-white/10 dark:bg-brand-dark/95 dark:text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${brand.shortName}، صفحه اصلی`}
        >
          {brand.logoUrl ? (
            <Image
              src={brand.logoUrl}
              alt={brand.shortName}
              width={48}
              height={48}
              className="rounded-xl object-contain"
            />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-red text-base font-black text-white">
              ر
            </span>
          )}
          <span>
            <span className="block font-black leading-5">{brand.shortName}</span>
            <span className="hidden text-[10px] text-gray-400 sm:block">رسانه تصویری و مجله</span>
          </span>
        </Link>

        <nav className="mr-5 hidden items-center gap-1 md:flex" aria-label="ناوبری اصلی">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                isActive(n.href)
                  ? 'bg-gray-100 font-bold text-gray-950 dark:bg-white/10 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-2">
          <form action="/search" role="search" className="hidden lg:block">
            <label className="sr-only" htmlFor="site-search">
              جست‌وجو در خبرها
            </label>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="جست‌وجو در خبرها"
              className="h-10 w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-brand-red dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
            />
          </form>

          <button
            aria-label="تغییر تم"
            title="تغییر تم"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="grid size-10 place-items-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
          >
            <Sun className="dark:hidden" size={18} aria-hidden="true" />
            <Moon className="hidden dark:block" size={18} aria-hidden="true" />
          </button>

          {user ? (
            <Link
              href="/profile"
              className="hidden h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-bold hover:bg-gray-100 dark:border-white/15 dark:hover:bg-white/10 sm:inline-flex"
            >
              <span className="grid size-6 place-items-center rounded-full bg-brand-red/10 text-xs text-brand-red">
                {user.name.slice(0, 1)}
              </span>
              {user.name}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-lg bg-brand-red px-3 text-sm font-bold text-white hover:bg-red-700 sm:inline-flex"
            >
              ورود
            </Link>
          )}

          <button
            aria-label="منو"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            title={open ? 'بستن منو' : 'بازکردن منو'}
            onClick={() => setOpen(!open)}
            className="grid size-10 place-items-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10 md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          className="border-t border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-brand-dark md:hidden"
          aria-label="ناوبری موبایل"
        >
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(n.href) ? 'page' : undefined}
              className={`block rounded-lg px-3 py-3 text-sm ${
                isActive(n.href)
                  ? 'bg-gray-100 font-bold text-gray-950 dark:bg-white/10 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
          >
            جست‌وجو
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
              >
                پروفایل ({user.name})
              </Link>
              <LogoutButton className="block w-full rounded-lg px-3 py-3 text-right text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
              >
                ورود
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
              >
                ثبت‌نام
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
