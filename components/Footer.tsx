import type { Brand } from '@/lib/settings';
import { Send, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer({ brand }: { brand: Brand }) {
  const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());

  // Only configured socials appear — empty ones disappear automatically
  const socials = [
    { label: 'تلگرام', href: brand.socials.telegram, icon: Send },
    { label: 'یوتیوب', href: brand.socials.youtube, icon: Youtube },
  ].filter((s) => s.href);

  const quickLinks = [
    { href: '/', label: 'رسانه تصویری' },
    { href: '/mag', label: 'مجله' },
    { href: '/about', label: 'درباره ما' },
    { href: '/contact', label: 'تماس با ما' },
  ];

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white text-gray-500 dark:border-white/10 dark:bg-[#090a0c] dark:text-gray-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        {/* Brand + about */}
        <div>
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
              <span className="grid size-12 place-items-center rounded-xl bg-brand-red text-base font-black text-white">
                ر
              </span>
            )}
            <span>
              <span className="block font-black leading-5 text-gray-900 dark:text-white">
                {brand.shortName}
              </span>
              <span className="hidden text-[10px] text-gray-400 sm:block">رسانه تصویری و مجله</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7">
            {brand.footerText ||
              `${brand.name}؛ رسانه‌ای تصویری و خبری برای نسل جوان — مصاحبه، گزارش ویژه و تازه‌ترین اخبار را اینجا ببینید.`}
          </p>

          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="grid size-10 place-items-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-brand-red hover:text-brand-red dark:border-white/10 dark:text-gray-300 dark:hover:border-brand-red dark:hover:text-brand-red"
                >
                  <Icon size={18} aria-hidden />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <nav aria-label="لینک‌های فوتر">
          <h2 className="font-black text-gray-900 dark:text-white">دسترسی سریع</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-brand-red">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h2 className="font-black text-gray-900 dark:text-white">ارتباط با ما</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={`mailto:${brand.email}`}
                dir="ltr"
                className="transition hover:text-brand-red"
              >
                {brand.email}
              </a>
            </li>
            {brand.phone && (
              <li dir="ltr" className="text-left">
                {brand.phone}
              </li>
            )}
            <li>
              <Link href="/contact" className="transition hover:text-brand-red">
                ارسال سوژهٔ خبری
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 py-5 text-center text-xs dark:border-white/10">
        © {year} — تمامی حقوق برای {brand.shortName} محفوظ است.
      </div>
    </footer>
  );
}
