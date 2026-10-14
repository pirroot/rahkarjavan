'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <div className="text-center">
        <p className="text-5xl">😵</p>
        <h1 className="mt-4 text-xl font-black">مشکلی پیش آمد!</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          در بارگذاری این بخش خطایی رخ داد. لطفاً دوباره تلاش کنید.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-brand-red px-6 py-3 text-sm font-bold text-white"
        >
          تلاش مجدد
        </button>
      </div>
    </main>
  );
}
