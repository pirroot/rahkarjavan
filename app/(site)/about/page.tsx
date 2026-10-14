import { getBrand } from '@/lib/settings';
import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    title: 'درباره ما',
    description: `آشنایی با تحریریه و رویکرد خبری ${brand.shortName}.`,
    alternates: { canonical: '/about' },
    openGraph: {
      title: `درباره ${brand.shortName}`,
      description: `آشنایی با تحریریه و رویکرد خبری ${brand.shortName}.`,
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

const values = [
  {
    icon: '🎯',
    title: 'دقت',
    text: 'هر خبر پیش از انتشار با منابع معتبر تطبیق داده می‌شود.',
  },
  {
    icon: '🔍',
    title: 'شفافیت',
    text: 'منبع خبر به‌روشنی ذکر می‌شود و خبر از زمینهٔ خود جدا نمی‌گردد.',
  },
  {
    icon: '✍️',
    title: 'پاسخگویی',
    text: 'در صورت بروز خطا، اصلاحیه به‌روشنی در دسترس مخاطب قرار می‌گیرد.',
  },
  {
    icon: '🤝',
    title: 'احترام به مخاطب',
    text: 'روایتی ساده و دقیق، به‌دور از تیترهای گمراه‌کننده.',
  },
];

const sections = [
  { icon: '🎬', title: 'رسانه تصویری', text: 'مصاحبه، گزارش ویژه و روایت تصویری', href: '/' },
  { icon: '📖', title: 'مجله', text: 'اخبار و گزارش‌های عمیق‌تر', href: '/mag' },
  { icon: '✉️', title: 'تماس', text: 'ارتباط با تحریریه', href: '/contact' },
];

export default async function AboutPage() {
  const brand = await getBrand();

  return (
    <main className="min-h-[70vh]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-red/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold text-brand-red">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
            دربارهٔ {brand.shortName}
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
            خبر را همراه با <span className="text-brand-red">زمینه‌اش</span> روایت می‌کنیم
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-10 text-gray-600 dark:text-gray-300">
            {brand.shortName} یک رسانهٔ خبری و تصویری فارسی‌زبان است؛ برای خبر، گزارش و روایت‌هایی
            که با دقت، شفافیت و احترام به مخاطب منتشر می‌شوند.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-4xl px-4 py-10">
        <ul className="grid gap-3 sm:grid-cols-3">
          {sections.map((s) => (
            <li key={s.title}>
              <Link
                href={s.href}
                className="flex h-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-brand-red/40 dark:border-white/10 dark:bg-white/5"
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-xl"
                >
                  {s.icon}
                </span>
                <div>
                  <h2 className="font-black">{s.title}</h2>
                  <p className="mt-0.5 text-xs leading-6 text-gray-500 dark:text-gray-400">
                    {s.text}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Approach */}
      <section className="mx-auto max-w-4xl px-4 pb-6">
        <h2 className="text-2xl font-black">رویکرد ما</h2>
        <p className="mt-4 leading-9 text-gray-600 dark:text-gray-300">
          تلاش ما این است که خبر را از زمینه‌اش جدا نکنیم، منابع را به‌روشنی بیان کنیم و در صورت
          بروز خطا، اصلاحیه را به‌روشنی در دسترس مخاطب قرار دهیم.
        </p>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-black">ارزش‌های حرفه‌ای ما</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <li
              key={v.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:border-brand-red/40 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
            >
              <div
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red/10 text-xl"
              >
                {v.icon}
              </div>
              <h3 className="mt-4 font-black">{v.title}</h3>
              <p className="mt-2 text-sm leading-8 text-gray-600 dark:text-gray-300">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-gray-900 p-8 text-white sm:flex-row sm:items-center dark:bg-white/10">
          <div>
            <h2 className="text-xl font-black">خطایی مشاهده کرده‌اید یا پیشنهادی دارید؟</h2>
            <p className="mt-2 text-sm text-gray-300">
              تحریریهٔ {brand.shortName} آمادهٔ دریافت نظرات و پیشنهادهای شماست.
            </p>
          </div>
          <Link
            href="/contact"
            className="rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            تماس با ما
          </Link>
        </div>
      </section>
    </main>
  );
}
