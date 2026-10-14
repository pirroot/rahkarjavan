import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-[65vh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-bold text-brand-red">۴۰۴</p>
        <h1 className="mt-3 text-3xl font-black">این خبر پیدا نشد</h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          ممکن است نشانی تغییر کرده یا محتوا از دسترس خارج شده باشد.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white"
        >
          بازگشت به صفحهٔ اصلی
        </Link>
      </div>
    </main>
  );
}
