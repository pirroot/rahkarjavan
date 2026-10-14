import LoginForm from '@/components/LoginForm';
import { getSession } from '@/lib/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = { title: 'ورود' };

export default async function LoginPage() {
  if (await getSession()) redirect('/profile');

  return (
    <main className="mx-auto flex-1 max-w-md px-4 py-14">
      <h1 className="text-3xl font-black">ورود به حساب</h1>
      <p className="mt-3 text-sm leading-8 text-gray-600 dark:text-gray-300">
        با حساب کاربری می‌توانید نظر بگذارید و پروفایل خود را مدیریت کنید.
      </p>
      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
