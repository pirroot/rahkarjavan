import { getBrand } from '@/lib/settings';
import type { Metadata } from 'next';
import { submitContact } from './actions';
import { SubmitButton } from './submit-button';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    title: 'تماس با ما',
    description: `پیام خود را برای تحریریهٔ ${brand.shortName} ارسال کنید؛ سوژهٔ خبری، اصلاحیه، پیشنهاد و انتقاد.`,
    alternates: { canonical: '/contact' },
    openGraph: {
      title: `تماس با ${brand.shortName}`,
      description: 'سوژهٔ خبری، اصلاحیه یا پیشنهاد خود را برای تحریریه ارسال کنید.',
      type: 'website',
    },
  };
}

type PageProps = { searchParams: Promise<{ sent?: string }> };

const field =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal outline-none transition placeholder:text-gray-400 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 dark:border-white/15 dark:bg-white/5';

const topics = [
  {
    icon: '📰',
    title: 'ارسال سوژهٔ خبری',
    text: 'در صورت داشتن خبر یا گزارش، آن را برای تحریریه ارسال کنید.',
  },
  {
    icon: '✍️',
    title: 'درخواست اصلاحیه',
    text: 'در صورت مشاهدهٔ خطا، پس از بررسی در اسرع وقت اصلاح می‌شود.',
  },
  {
    icon: '💡',
    title: 'پیشنهاد و انتقاد',
    text: 'دیدگاه شما در ارتقای کیفیت رسانه نقش مهمی دارد.',
  },
];

const notices = {
  '1': {
    role: 'status',
    icon: '✅',
    text: 'پیام شما با موفقیت به تحریریه ارسال شد. از ارتباط شما سپاسگزاریم.',
    cls: 'border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-300',
  },
  '0': {
    role: 'alert',
    icon: '⚠️',
    text: 'اطلاعات فرم کامل یا معتبر نیست؛ لطفاً موارد را بررسی و دوباره تلاش کنید.',
    cls: 'border-brand-red/30 bg-brand-red/10 text-brand-red',
  },
  limit: {
    role: 'alert',
    icon: '⏳',
    text: 'تعداد ارسال‌ها در مدت کوتاه بیش از حد مجاز بوده است؛ لطفاً دقایقی بعد دوباره تلاش کنید.',
    cls: 'border-brand-red/30 bg-brand-red/10 text-brand-red',
  },
  error: {
    role: 'alert',
    icon: '⚠️',
    text: 'خطای غیرمنتظره‌ای رخ داد؛ لطفاً دقایقی بعد دوباره تلاش کنید.',
    cls: 'border-brand-red/30 bg-brand-red/10 text-brand-red',
  },
} as const;

export default async function ContactPage({ searchParams }: PageProps) {
  const sent = (await searchParams).sent;
  const notice = sent && sent in notices ? notices[sent as keyof typeof notices] : undefined;
  const brand = await getBrand();

  return (
    <main className="min-h-[70vh]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-red/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold text-brand-red">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
            ارتباط با تحریریه
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
            تماس با <span className="text-brand-red">{brand.shortName}</span>
          </h1>
          <p className="mt-5 max-w-xl leading-9 text-gray-600 dark:text-gray-300">
            پیشنهاد، انتقاد یا سوژهٔ خبری خود را برای ما ارسال کنید.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1fr_1.6fr]">
        {/* Side info */}
        <aside className="grid content-start gap-4">
          {topics.map((t) => (
            <div
              key={t.title}
              className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-red/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-red/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-xl">
                {t.icon}
              </div>
              <div>
                <h2 className="font-black">{t.title}</h2>
                <p className="mt-1 text-sm leading-7 text-gray-600 dark:text-gray-300">{t.text}</p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-black">سایر راه‌های ارتباطی</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600 dark:text-gray-300">
              <li>
                ایمیل تحریریه:{' '}
                <a
                  href={`mailto:${brand.email}`}
                  dir="ltr"
                  className="font-bold text-brand-red hover:underline"
                >
                  {brand.email}
                </a>
              </li>
              {brand.phone && (
                <li dir="ltr" className="text-left">
                  {brand.phone}
                </li>
              )}
              <li>ساعات پاسخ‌گویی: شنبه تا چهارشنبه، ۹ تا ۱۷</li>
            </ul>
          </div>
        </aside>

        {/* Form card */}
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-white/5">
          {notice && (
            <p
              role={notice.role}
              className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${notice.cls}`}
            >
              <span aria-hidden>{notice.icon}</span>
              {notice.text}
            </p>
          )}

          <form action={submitContact} className="relative grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                نام و نام خانوادگی
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="نام و نام خانوادگی خود را وارد کنید"
                  className={field}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                نشانی ایمیل
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  inputMode="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  className={`${field} text-left`}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              موضوع
              <input
                name="subject"
                required
                minLength={3}
                maxLength={160}
                placeholder="موضوع پیام"
                className={field}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              متن پیام
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={7}
                placeholder="متن پیام خود را اینجا بنویسید…"
                className={`${field} resize-y leading-7`}
              />
            </label>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SubmitButton />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                نشانی ایمیل شما صرفاً برای پاسخ به همین پیام استفاده می‌شود.
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
