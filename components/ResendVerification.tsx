'use client';

import { useEffect, useState } from 'react';

const COOLDOWN_SECONDS = 60;

export default function ResendVerification({ email }: { email?: string }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 60s client cooldown between resend attempts
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    const value = email?.trim().toLowerCase();
    if (!value) {
      setMessage('ایمیل را در فرم ورود وارد کنید، بعد دوباره بفرستید.');
      return;
    }
    setPending(true);
    setMessage('');
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value }),
    }).catch(() => null);
    setPending(false);

    if (!response?.ok) {
      setMessage('ارسال دوباره ممکن نشد. کمی بعد تلاش کنید.');
      return;
    }
    setCooldown(COOLDOWN_SECONDS);
    setMessage('اگر این ایمیل تأیید نشده باشد، لینک تازه ارسال شد.');
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={resend}
        disabled={pending || cooldown > 0}
        className="w-fit text-sm font-bold text-brand-red hover:underline disabled:opacity-60"
      >
        {pending
          ? 'در حال ارسال…'
          : cooldown > 0
            ? `ارسال دوباره تا ${cooldown.toLocaleString('fa-IR')} ثانیه دیگر`
            : 'ارسال دوباره لینک تأیید'}
      </button>
      {message && <p className="text-xs leading-6 text-gray-500">{message}</p>}
    </div>
  );
}
