'use client';

import { Check, Save, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  section: 'ARTICLE' | 'VIDEO' | 'BOTH';
};

const sections = [
  {
    value: 'VIDEO' as const,
    icon: '🎬',
    title: 'رسانه تصویری',
    desc: 'فقط در بخش ویدیوها نمایش داده می‌شود',
  },
  {
    value: 'ARTICLE' as const,
    icon: '📰',
    title: 'مجله',
    desc: 'فقط در بخش مجله (اخبار متنی) نمایش داده می‌شود',
  },
  {
    value: 'BOTH' as const,
    icon: '✨',
    title: 'هر دو بخش',
    desc: 'هم ویدیو و هم خبر متنی می‌تواند در این دسته باشد',
  },
];

/** Auto-slug from Persian/English name */
function slugify(name: string): string {
  return name
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

const field =
  'w-full rounded-xl border border-white/10 bg-[#080d14] px-4 py-3 text-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10';
const hint = 'mt-1.5 text-[11px] font-normal leading-5 text-slate-500';

export default function CategoryForm({
  row,
  onClose,
  onSaved,
}: {
  row?: CategoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(row?.name ?? '');
  const [slug, setSlug] = useState(row?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(row));
  const [section, setSection] = useState<CategoryRow['section']>(row?.section ?? 'BOTH');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const r = await fetch(`/api/admin/categories${row ? `/${row.id}` : ''}`, {
      method: row ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        slug: (slug || slugify(name)).trim(),
        section,
      }),
    }).catch(() => null);
    const d = await r?.json().catch(() => null);

    if (!r?.ok) {
      setError(
        typeof d?.error === 'string'
          ? d.error
          : typeof d?.error === 'object'
            ? 'نام دسته و نامک الزامی است.'
            : 'ذخیره ناموفق بود.'
      );
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
      <form
        onSubmit={save}
        className="mx-auto my-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#101823] p-6"
      >
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black">{row ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <X />
          </button>
        </header>

        <div className="grid gap-6">
          {/* ---------- Name ---------- */}
          <label className="grid gap-2 text-sm font-bold">
            نام دسته‌بندی
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              minLength={2}
              maxLength={100}
              className={field}
              placeholder="مثلاً: مصاحبه"
            />
            <p className={hint}>
              نامی که خواننده در سایت می‌بیند. کوتاه و گویا بنویسید — مثل «گزارش ویژه» یا «اقتصاد».
            </p>
          </label>
          {/* ---------- Slug ---------- */}
          <label className="grid gap-2 text-sm font-bold">
            نشانی در سایت (نامک)
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              dir="ltr"
              className={`${field} text-left`}
              placeholder="خودکار از نام پر می‌شود"
            />
            {slug && (
              <p className={hint}>
                آدرس این دسته در سایت:{' '}
                <span dir="ltr" className="font-bold text-emerald-400">
                  /category/{slug}
                </span>
              </p>
            )}
          </label>
          {/* ---------- Section — visual cards instead of dropdown ---------- */}
          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">این دسته در کدام بخش سایت باشد؟</legend>

            <div className="grid gap-2 sm:grid-cols-3">
              {sections.map((s) => {
                const selected = section === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSection(s.value)}
                    className={`rounded-xl border p-4 text-right transition ${
                      selected
                        ? 'border-brand-red bg-brand-red/10'
                        : 'border-white/10 bg-[#080d14] hover:border-white/25'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-xl" aria-hidden>
                        {s.icon}
                      </span>
                      {selected && (
                        <span className="grid size-5 place-items-center rounded-full bg-brand-red text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block text-sm font-bold">{s.title}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                      {s.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              disabled={saving}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-red text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              <Save size={16} /> {saving ? 'در حال ذخیره…' : 'ذخیره دسته‌بندی'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-white/10 px-6 text-sm font-bold text-slate-300 hover:bg-white/5"
            >
              انصراف
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
