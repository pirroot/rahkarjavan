import ResendVerification from '@/components/ResendVerification';
import { getSession } from '@/lib/auth';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'تأیید ایمیل' };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  if (await getSession()) redirect('/profile');
  const email = (await searchParams).email?.trim().toLowerCase() ?? '';

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-black">ایمیل را تأیید کنید</h1>
      <p className="mt-4 text-sm leading-8 text-gray-600 dark:text-gray-300">
        حساب ساخته شد، ولی تا وقتی لینک داخل صندوق ورودی را باز نکنید نمی‌توانید وارد شوید. این کار ثابت می‌کند ایمیل متعلق به خودتان است.
      </p>
      {email && (
        <p className="mt-3 text-sm" dir="ltr">
          {email}
        </p>
      )}
      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <ResendVerification email={email} />
        <p className="mt-5 text-sm text-gray-500">
          پوشه هرزنامه را هم بررسی کنید.{' '}
          <Link href="/login" className="font-bold text-brand-red hover:underline">
            بازگشت به ورود
          </Link>
        </p>
      </div>
    </main>
  );
}
