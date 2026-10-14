import RegisterForm from '@/components/RegisterForm';
import { getSession } from '@/lib/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'ثبت‌نام' };

export default async function RegisterPage() {
  if (await getSession()) redirect('/profile');

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-black">ثبت‌نام</h1>
      <p className="mt-3 text-sm leading-8 text-gray-600 dark:text-gray-300">
        با ساخت حساب می‌توانید روی خبرها و ویدیوها نظر بگذارید. بعد از ثبت‌نام یک لینک به همان ایمیل
        ارسال می‌شود؛ تا وقتی آن را باز نکنید ورود ممکن نیست.
      </p>
      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <RegisterForm />
      </div>
    </main>
  );
}
