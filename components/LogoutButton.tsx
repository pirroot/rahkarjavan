'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.replace('/');
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} disabled={pending} className={className}>
      {pending ? 'خروج…' : 'خروج'}
    </button>
  );
}
