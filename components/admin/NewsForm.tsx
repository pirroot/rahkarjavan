'use client';

import RichEditor from '@/components/admin/RichEditor';
import UploadField from '@/components/UploadField';
import { Save, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type Category = { id: string; name: string };

export type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  coverUrl: string | null;
  categoryId: string;
  status: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
  isBreaking: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

/** Auto-slug from Persian title: keep Persian chars, spaces → dashes */
function slugify(title: string): string {
  return title
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export default function NewsForm({
  row,
  categories,
  onClose,
  onSaved,
}: {
  row?: NewsRow | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(row?.title ?? '');
  const [slug, setSlug] = useState(row?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(row)); // auto-slug only for new posts
  const [excerpt, setExcerpt] = useState(row?.excerpt ?? '');
  const [content, setContent] = useState<unknown>(row?.content ?? null);
  const [coverUrl, setCoverUrl] = useState(row?.coverUrl ?? '');
  const [categoryId, setCategoryId] = useState(row?.categoryId ?? '');
  const [status, setStatus] = useState(row?.status ?? 'DRAFT');
  const [publishedAt, setPublishedAt] = useState(
    (row?.publishedAt ?? new Date()).toString().slice(0, 16)
  );
  const [tags, setTags] = useState((row?.tags ?? []).join('، '));
  const [featured, setFeatured] = useState(row?.featured ?? false);
  const [isBreaking, setIsBreaking] = useState(row?.isBreaking ?? false);
  const [metaTitle, setMetaTitle] = useState(row?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(row?.metaDescription ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      title: title.trim(),
      slug: (slug || slugify(title)).trim(),
      excerpt: excerpt.trim(),
      content,
      categoryId,
      status,
      publishedAt: new Date(publishedAt).toISOString(),
      tags: tags
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean),
      coverUrl: coverUrl || null,
      featured,
      isBreaking,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
    };

    const r = await fetch(`/api/admin/news${row ? `/${row.id}` : ''}`, {
      method: row ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);
    const d = await r?.json().catch(() => null);

    if (!r?.ok) {
      setError(
        typeof d?.error === 'string' ? d.error : 'ذخیره ناموفق بود؛ فیلدهای الزامی را بررسی کن.'
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
        className="mx-auto my-6 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#101823] p-6"
      >
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black">{row ? 'ویرایش خبر' : 'خبر جدید'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <X />
          </button>
        </header>

        <div className="grid gap-5">
          {/* Title — auto-slug hint */}
          <label className="grid gap-2 text-sm font-bold">
            عنوان خبر
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              className="rounded-xl border border-white/10 bg-[#080d14] px-4 py-3"
              placeholder="مثلاً: گزارشی از رویداد امسال"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold text-slate-300">
              نامک (در URL)
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                dir="ltr"
                className="rounded-xl border border-white/10 bg-[#080d14] px-4 py-3 text-left"
                placeholder="خودکار از عنوان"
              />
            </label>

            <label className="grid gap-2 text-xs font-bold text-slate-300">
              دسته‌بندی
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#080d14] px-4 py-3"
              >
                <option value="" disabled>
                  انتخاب دسته…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Excerpt */}
          <label className="grid gap-2 text-xs font-bold text-slate-300">
            خلاصه (نمایش در کارت‌ها و گوگل)
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              required
              maxLength={500}
              rows={3}
              className="rounded-xl border border-white/10 bg-[#080d14] px-4 py-3 leading-7"
              placeholder="دو سه جمله که خواننده را وسط مطلب ببرد…"
            />
          </label>

          {/* Cover upload */}
          <div className="grid gap-2 text-xs font-bold text-slate-300">
            تصویر کاور
            <UploadField kind="image" value={coverUrl} onChange={(url) => setCoverUrl(url ?? '')} />
          </div>

          {/* ⭐ The real editor — no JSON anywhere */}
          <div className="grid gap-2 text-xs font-bold text-slate-300">
            متن مقاله
            <RichEditor content={content} onChange={setContent} />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-2 text-xs font-bold text-slate-300">
              وضعیت
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#080d14] px-3 py-3"
              >
                <option value="DRAFT">پیش‌نویس</option>
                <option value="PUBLISHED">منتشرشده</option>
              </select>
            </label>

            <label className="grid gap-2 text-xs font-bold text-slate-300">
              زمان انتشار
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#080d14] px-3 py-3"
              />
            </label>

            <label className="grid gap-2 text-xs font-bold text-slate-300">
              برچسب‌ها (با ویرگول)
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#080d14] px-3 py-3"
              />
            </label>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-5 rounded-xl border border-white/10 bg-[#080d14] p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4 accent-brand-red"
              />
              خبر ویژه (نمایش در صفحه اصلی)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="size-4 accent-brand-red"
              />
              خبر فوری (نوار متحرک)
            </label>
          </div>

          {/* SEO — collapsed by default feel */}
          <details className="rounded-xl border border-white/10 bg-[#080d14] p-4">
            <summary className="cursor-pointer text-sm font-bold">تنظیمات سئو (اختیاری)</summary>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-xs font-bold text-slate-300">
                عنوان سئو
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#101823] px-4 py-3"
                  placeholder="خالی = عنوان خود خبر"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold text-slate-300">
                توضیحات سئو
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="rounded-xl border border-white/10 bg-[#101823] px-4 py-3 leading-7"
                  placeholder="خالی = خلاصه خبر"
                />
              </label>
            </div>
          </details>

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
              <Save size={16} /> {saving ? 'در حال ذخیره…' : 'ذخیره خبر'}
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
