'use client';

import UploadField from '@/components/UploadField';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

type Settings = {
  siteName: string;
  shortName: string;
  description: string;
  logoUrl: string;
  email: string;
  phone: string;
  telegram: string;
  instagram: string;
  eitaa: string;
  youtube: string;
  footerText: string;
};

const field =
  'w-full rounded-xl border border-white/10 bg-[#080d14] px-4 py-3 text-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10';
const label = 'grid gap-2 text-sm font-bold';
const hint = 'mt-1.5 text-[11px] font-normal leading-5 text-slate-500';

const EMPTY: Settings = {
  siteName: '',
  shortName: '',
  description: '',
  logoUrl: '',
  email: '',
  phone: '',
  telegram: '',
  instagram: '',
  eitaa: '',
  youtube: '',
  footerText: '',
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101823] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-black">
        <span aria-hidden>{icon}</span> {title}
      </h2>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

export default function SettingsAdmin() {
  const [form, setForm] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/admin/settings', { cache: 'no-store' });
        const d = await r.json();
        if (r.ok && d.settings) setForm({ ...EMPTY, ...d.settings });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key: keyof Settings) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof d.error === 'string' ? d.error : 'ذخیره ناموفق بود.');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
        <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
      <header className="mb-6">
        <p className="mb-2 text-sm font-bold text-emerald-400">پیکربندی سایت</p>
        <h1 className="flex items-center gap-2 text-3xl font-black">
          <SettingsIcon size={24} aria-hidden /> تنظیمات
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          این مقادیر در سراسر سایت (هدر، فوتر، فوتر ایمیل‌ها و...) استفاده می‌شوند.
        </p>
      </header>

      <form onSubmit={save} className="grid gap-6">
        <Section title="هویت سایت" icon="🏷️">
          <label className={label}>
            نام کامل سایت
            <input
              value={form.siteName}
              onChange={(e) => set('siteName')(e.target.value)}
              required
              className={field}
            />
            <p className={hint}>در عنوان صفحه مرورگر، سئو و نتایج گوگل نمایش داده می‌شود.</p>
          </label>

          <label className={label}>
            نام کوتاه
            <input
              value={form.shortName}
              onChange={(e) => set('shortName')(e.target.value)}
              required
              className={field}
            />
            <p className={hint}>نسخهٔ کوتاه برای جای تنگ — مثل کنار لوگو و دکمه‌ها.</p>
          </label>

          <label className={label}>
            توضیحات سایت
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={3}
              maxLength={500}
              className={`${field} leading-7`}
            />
            <p className={hint}>
              یک یا دو جمله دربارهٔ سایت — در موتورهای جست‌وجو نمایش داده می‌شود.
            </p>
          </label>

          <div className="grid gap-2 text-sm font-bold">
            لوگو
            <UploadField
              kind="image"
              value={form.logoUrl}
              onChange={(url) => set('logoUrl')(url ?? '')}
            />
            <p className={hint}>پیشنهاد: مربعی، حداقل ۵۱۲×۵۱۲ پیکسل.</p>
          </div>
        </Section>

        <Section title="اطلاعات تماس" icon="📞">
          <label className={label}>
            ایمیل تحریریه
            <input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
              required
              className={`${field} text-left`}
            />
            <p className={hint}>
              در صفحه تماس و فوتر نمایش داده می‌شود؛ پیام‌های فرم تماس هم به همین ایمیل اطلاع‌رسانی
              می‌شود.
            </p>
          </label>

          <label className={label}>
            شماره تماس (اختیاری)
            <input
              dir="ltr"
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
              className={`${field} text-left`}
              placeholder="021-12345678"
            />
          </label>
        </Section>

        <Section title="شبکه‌های اجتماعی" icon="🌐">
          {(
            [
              { key: 'telegram', label: 'تلگرام', ph: 'https://t.me/rahkarjavan' },
              { key: 'eitaa', label: 'ایتا', ph: 'https://eitaa.com/rahkarjavan' },
              { key: 'instagram', label: 'اینستاگرام', ph: 'https://instagram.com/rahkarjavan' },
              { key: 'youtube', label: 'یوتیوب', ph: 'https://youtube.com/@rahkarjavan' },
            ] as const
          ).map(({ key, label: lbl, ph }) => (
            <label key={key} className={label}>
              {lbl}
              <input
                dir="ltr"
                value={form[key]}
                onChange={(e) => set(key)(e.target.value)}
                className={`${field} text-left`}
                placeholder={ph}
              />
              <p className={hint}>لینک کامل بنویسید؛ خالی بماند از فوتر حذف می‌شود.</p>
            </label>
          ))}
        </Section>

        <Section title="فوتر" icon="📄">
          <label className={label}>
            متن فوتر
            <textarea
              value={form.footerText}
              onChange={(e) => set('footerText')(e.target.value)}
              rows={2}
              maxLength={300}
              className={`${field} leading-7`}
              placeholder="متن کوتاه معرفی که زیر لوگو در فوتر نمایش داده می‌شود"
            />
          </label>
        </Section>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
        {saved && (
          <p
            role="status"
            className="rounded-xl border border-green-600/30 bg-green-600/10 p-3 text-sm text-green-700 dark:text-green-300"
          >
            تنظیمات ذخیره شد و روی سایت اعمال شد.
          </p>
        )}

        <button
          disabled={saving}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-red text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60 sm:w-fit sm:px-8"
        >
          <Save size={16} aria-hidden />
          {saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}
        </button>
      </form>
    </section>
  );
}
