'use client';

import { SITE } from '@/lib/site';
import { LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // اگر وسط درخواست، صفحه عوض شد؛ درخواست را لغو کن
  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const form = new FormData(event.currentTarget);
    abortRef.current = new AbortController();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(form.get('email') ?? '')
          .trim()
          .toLowerCase(),
        password: form.get('password'),
      }),
      signal: abortRef.current.signal,
    }).catch(() => null);

    if (!response) {
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کن.');
      setSubmitting(false);
      return;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      // پیام‌های امنیتی: مبهم نگه دار تا مهاجم نفهمد ایمیل وجود دارد یا پسورد اشتباه است
      setError(
        typeof result?.error === 'string' ? result.error : 'ورود ناموفق بود. دوباره تلاش کن.'
      );
      setSubmitting(false);
      return;
    }

    router.refresh(); // سشن را برای کامپوننت‌های سروری هم تازه کن
    router.replace('/admin');
  }

  return (
    <main
      className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top_right,_#172333_0%,_#080d14_54%)] px-4 py-10"
      dir="rtl"
    >
      <section className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-white">
          <span className="grid size-12 place-items-center rounded-xl bg-brand-red text-base font-black">
            ر
          </span>
          <span>
            <strong className="block text-lg">{SITE.shortName}</strong>
            <small className="text-xs text-slate-400">ورود به تحریریه</small>
          </span>
        </Link>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-white/10 bg-[#101823]/95 p-6 shadow-2xl sm:p-8"
          noValidate
        >
          <h1 className="text-xl font-black">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            برای ادامه، اطلاعات حساب کاربری را وارد کن.
          </p>

          <label className="mt-6 block text-xs font-bold text-slate-300" htmlFor="email">
            ایمیل
          </label>
          <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 focus-within:border-brand-red/70">
            <Mail size={17} className="text-slate-500" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
              placeholder="name@example.com"
              dir="ltr"
            />
          </span>

          <label className="mt-5 block text-xs font-bold text-slate-300" htmlFor="password">
            گذرواژه
          </label>
          <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 focus-within:border-brand-red/70">
            <LockKeyhole size={17} className="text-slate-500" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              dir="ltr"
            />
          </span>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-6 text-red-300"
            >
              {error}
            </p>
          )}

          <button
            disabled={submitting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand-red text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'در حال بررسی…' : 'ورود به پنل'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-600">
          دسترسی فقط برای اعضای تحریریه مجاز است.
        </p>
      </section>
    </main>
  );
}
