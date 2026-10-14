'use client';

import ResendVerification from '@/components/ResendVerification';
import { LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

const field =
  'min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500';

// Open-redirect guard: only same-origin relative paths are allowed
function safeNext(raw: string | null): string {
  if (!raw) return '/profile';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/profile';
  return raw;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(
    searchParams.get('error') === 'verify' ? 'لینک تأیید نامعتبر یا منقضی است.' : ''
  );
  const [needsVerification, setNeedsVerification] = useState(
    searchParams.get('error') === 'verify'
  );
  // Pre-fill from ?email= so ResendVerification works right away
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel in-flight request if the component unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNeedsVerification(false);

    const form = new FormData(event.currentTarget);
    const emailValue = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();
    setEmail(emailValue);
    abortRef.current = new AbortController();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, password: form.get('password') }),
      signal: abortRef.current.signal,
    }).catch(() => null);

    if (!response) {
      setError('ارتباط با سرور برقرار نشد.');
      setSubmitting(false);
      return;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? 'ورود ناموفق بود.');
      setNeedsVerification(Boolean(result?.needsVerification));
      setSubmitting(false);
      return;
    }

    router.replace(safeNext(searchParams.get('next')));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
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
            autoComplete="current-password"
            className={field}
            dir="ltr"
          />
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red"
        >
          {error}
        </p>
      )}
      {needsVerification && <ResendVerification email={email} />}

      <button
        disabled={submitting}
        aria-busy={submitting}
        className="h-12 rounded-xl bg-brand-red text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? 'در حال ورود…' : 'ورود'}
      </button>

      <p className="text-center text-sm text-gray-500">
        حساب ندارید؟{' '}
        <Link href="/register" className="font-bold text-brand-red hover:underline">
          ثبت‌نام کنید
        </Link>
      </p>
    </form>
  );
}
