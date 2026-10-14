'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3.5 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:min-w-[10rem]"
    >
      <span
        aria-hidden
        className={`h-4 w-4 rounded-full border-2 border-white/40 border-t-white ${pending ? 'animate-spin' : 'hidden'}`}
      />
      {pending ? 'در حال ارسال…' : 'ارسال پیام'}
    </button>
  );
}
