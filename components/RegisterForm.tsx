'use client';

import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

const field =
  'min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500';

// Same open-redirect guard as LoginForm — keep them in sync
function safeNext(raw: string | null): string {
  if (!raw) return '/profile';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/profile';
  return raw;
}

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    abortRef.current = new AbortController();

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: String(form.get('email') ?? '')
          .trim()
          .toLowerCase(),
        password: form.get('password'),
      }),
      signal: abortRef.current.signal,
    }).catch(() => null);

    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(result?.error ?? 'ارتباط با سرور برقرار نشد.');
      setSubmitting(false);
      return;
    }
    if (result?.needsVerification) {
      const params = new URLSearchParams();
      if (result.email) params.set('email', String(result.email));
      // Preserve the destination so login after verification returns the user
      const next = safeNext(new URLSearchParams(window.location.search).get('next'));
      params.set('next', next);
      router.replace(`/register/check-email?${params.toString()}`);
      return;
    }
    router.replace(safeNext(new URLSearchParams(window.location.search).get('next')));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <label className="grid gap-2 text-sm font-bold">
        نام
        <span className="flex h-12 items-center gap-3 rounded-xl border border-gray-300 bg-white px-3 focus-within:border-brand-red dark:border-white/15 dark:bg-white/5">
          <UserRound size={17} className="text-gray-400" />
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="نام نمایشی"
            className={field}
          />
        </span>
      </label>

      <label className="grid gap-2 text-sm font-bold">
        نشانی ایمیل
        <span className="flex h-12 items-center gap-3 rounded-xl border border-gray-300 bg-white px-3 focus-within:border-brand-red dark:border-white/15 dark:bg-white/5">
          <Mail size={17} className="text-gray-400" />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            placeholder="name@example.com"
            className={`${field} text-left`}
          />
        </span>
      </label>

      <label className="grid gap-2 text-sm font-bold">
        گذرواژه
        <span className="flex h-12 items-center gap-3 rounded-xl border border-gray-300 bg-white px-3 focus-within:border-brand-red dark:border-white/15 dark:bg-white/5">
          <LockKeyhole size={17} className="text-gray-400" />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={field}
            dir="ltr"
          />
        </span>
      </label>
      <p className="-mt-2 text-[11px] text-gray-400">
        حداقل ۸ کاراکتر؛ ترکیب حرف و عدد امن‌تر است.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red"
        >
          {error}
        </p>
      )}

      <button
        disabled={submitting}
        aria-busy={submitting}
        className="h-12 rounded-xl bg-brand-red text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? 'در حال ثبت…' : 'ساخت حساب'}
      </button>

      <p className="text-center text-sm text-gray-500">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <Link href="/login" className="font-bold text-brand-red hover:underline">
          وارد شوید
        </Link>
      </p>
    </form>
  );
}
