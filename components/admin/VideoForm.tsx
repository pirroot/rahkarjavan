'use client';

import UploadField from '@/components/UploadField';
import { Clock, Loader2, Save, Trash2, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';

type Category = { id: string; name: string };

export type VideoRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: string;
  categoryId: string;
  status: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
  isLive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

/** Auto-slug from the title — same rules as NewsForm */
function slugify(title: string): string {
  return title
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

/**
 * Reads the duration from a local video file —
 * the browser decodes the metadata instantly, no upload needed.
 * Resolves to '' when the format is unreadable (field stays manual).
 */
function readDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';

    probe.onloadedmetadata = () => {
      const total = Math.round(probe.duration);
      const m = Math.floor(total / 60);
      const s = total % 60;
      URL.revokeObjectURL(url);
      resolve(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    probe.src = url;
  });
}

/** Upload with progress — resolves the URL when finished, throws on failure */
function uploadFile(
  file: File,
  kind: 'video' | 'image',
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/upload?kind=${kind}&filename=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 201) resolve(data.url);
        else reject(new Error(data.error ?? 'آپلود ناموفق بود.'));
      } catch {
        reject(new Error('پاسخ نامعتبر از سرور.'));
      }
    };
    xhr.onerror = () => reject(new Error('خطای شبکه در آپلود.'));

    xhr.send(file);
  });
}

export default function VideoForm({
  row,
  categories,
  onClose,
  onSaved,
}: {
  row?: VideoRow | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // ---------- text fields ----------
  const [title, setTitle] = useState(row?.title ?? '');
  const [slug, setSlug] = useState(row?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(row));
  const [description, setDescription] = useState(row?.description ?? '');
  const [tags, setTags] = useState((row?.tags ?? []).join('، '));
  const [metaTitle, setMetaTitle] = useState(row?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(row?.metaDescription ?? '');

  // ---------- media ----------
  const [videoUrl, setVideoUrl] = useState(row?.videoUrl ?? '');
  const [videoProgress, setVideoProgress] = useState<number | null>(null); // null = idle
  const [thumbnailUrl, setThumbnailUrl] = useState(row?.thumbnailUrl ?? '');

  // ---------- duration ----------
  const [duration, setDuration] = useState(row?.duration ?? '');
  const [durationAuto, setDurationAuto] = useState(!row);

  // ---------- meta ----------
  const [categoryId, setCategoryId] = useState(row?.categoryId ?? '');
  const [status, setStatus] = useState(row?.status ?? 'DRAFT');
  const [publishedAt, setPublishedAt] = useState(
    // eslint-disable-next-line react-hooks/purity
    new Date(row?.publishedAt ?? Date.now()).toISOString().slice(0, 16)
  );
  const [featured, setFeatured] = useState(row?.featured ?? false);
  const [isLive, setIsLive] = useState(row?.isLive ?? false);

  // ---------- form state ----------
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // ---------- video upload ----------
  async function onVideoFileChange(file: File) {
    setError('');

    // Duration probe runs in parallel with the upload
    void readDuration(file).then((d) => {
      if (durationAuto && d) setDuration(d);
    });

    setVideoProgress(0);
    try {
      const url = await uploadFile(file, 'video', setVideoProgress);
      setVideoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'آپلود ویدیو ناموفق بود.');
    } finally {
      setVideoProgress(null); // ⭐ releases the save button in every path
    }
  }

  function onVideoInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void onVideoFileChange(file);
    event.target.value = '';
  }

  // ---------- form submit ----------
  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      title: title.trim(),
      slug: (slug || slugify(title)).trim(),
      description: description.trim(),
      videoUrl: videoUrl || null,
      thumbnailUrl: thumbnailUrl || null,
      duration: duration.trim() || '00:00',
      categoryId,
      status,
      publishedAt: new Date(publishedAt).toISOString(),
      tags: tags
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean),
      featured,
      isLive,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
    };

    try {
      abortRef.current = new AbortController();
      const r = await fetch(`/api/admin/videos${row ? `/${row.id}` : ''}`, {
        method: row ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setError(
          typeof d?.error === 'string' ? d.error : 'ذخیره ناموفق بود؛ فیلدهای الزامی را بررسی کن.'
        );
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
      setSaving(false);
    }
  }

  const uploading = videoProgress !== null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
      <form
        onSubmit={save}
        className="mx-auto my-6 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#101823] p-6"
      >
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black">{row ? 'ویرایش ویدیو' : 'ویدیوی جدید'}</h2>
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
          {/* ---------- Title (auto-slug) ---------- */}
          <label className="grid gap-2 text-sm font-bold">
            عنوان ویدیو
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              className="rounded-xl border border-white/10 bg-[#080d14] px-4 py-3"
              placeholder="مثلاً: گفت‌وگوی اختصاصی با …"
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

          {/* ---------- Video file upload ---------- */}
          <div className="grid gap-2 text-xs font-bold text-slate-300">
            فایل ویدیو (MP4/WebM — حداکثر ۱ گیگابایت)
            <div className="rounded-xl border border-dashed border-white/20 bg-[#080d14] p-4">
              {videoUrl ? (
                <div className="flex items-center gap-3">
                  <video src={videoUrl} className="h-20 w-36 rounded-lg object-cover" muted />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-300" dir="ltr">
                    {videoUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    aria-label="حذف فایل ویدیو"
                    className="grid size-8 place-items-center rounded-lg text-red-300 transition hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : uploading ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <Loader2 size={24} className="animate-spin text-brand-red" aria-hidden />
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-brand-red transition-all"
                      style={{ width: `${videoProgress ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-slate-400">
                    در حال آپلود… {videoProgress?.toLocaleString('fa-IR')}٪
                  </span>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 py-5 text-center text-slate-300 transition hover:text-white">
                  <span className="grid size-11 place-items-center rounded-full bg-brand-red/10 text-brand-red">
                    <Loader2 size={20} aria-hidden className="hidden" />
                    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                      <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
                    </svg>
                  </span>
                  <span className="text-sm">انتخاب فایل ویدیو</span>
                  <input
                    type="file"
                    hidden
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    onChange={onVideoInput}
                  />
                </label>
              )}
            </div>
          </div>

          {/* ---------- Thumbnail + duration ---------- */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2 text-xs font-bold text-slate-300">
              تصویر شاخص
              <UploadField
                kind="image"
                value={thumbnailUrl}
                onChange={(url) => setThumbnailUrl(url ?? '')}
              />
            </div>

            <label className="grid content-start gap-2 text-xs font-bold text-slate-300">
              <span className="inline-flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden /> مدت‌زمان
                </span>
                {durationAuto && duration && (
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    خودکار از فایل
                  </span>
                )}
              </span>
              <input
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setDurationAuto(false); // manual edit disables auto-fill
                }}
                dir="ltr"
                placeholder="00:00"
                className="rounded-xl border border-white/10 bg-[#080d14] px-4 py-3 text-left tabular-nums"
              />
            </label>
          </div>

          {/* ---------- Description ---------- */}
          <label className="grid gap-2 text-xs font-bold text-slate-300">
            توضیحات
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="rounded-xl border border-white/10 bg-[#080d14] px-4 py-3 leading-7"
              placeholder="توضیح کوتاهی که زیر ویدیو نمایش داده می‌شود…"
            />
          </label>

          {/* ---------- Status / schedule / tags ---------- */}
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

          {/* ---------- Flags ---------- */}
          <div className="flex flex-wrap gap-5 rounded-xl border border-white/10 bg-[#080d14] p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4 accent-brand-red"
              />
              ویدیوی ویژه (پلیر صفحه اصلی)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
                className="size-4 accent-brand-red"
              />
              پخش زنده
            </label>
          </div>

          {/* ---------- SEO ---------- */}
          <details className="rounded-xl border border-white/10 bg-[#080d14] p-4">
            <summary className="cursor-pointer text-sm font-bold">تنظیمات سئو (اختیاری)</summary>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-xs font-bold text-slate-300">
                عنوان سئو
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#101823] px-4 py-3"
                  placeholder="خالی = عنوان خود ویدیو"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold text-slate-300">
                توضیحات سئو
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="rounded-xl border border-white/10 bg-[#101823] px-4 py-3 leading-7"
                  placeholder="خالی = توضیحات ویدیو"
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

          {/* ---------- Actions ---------- */}
          <div className="flex gap-3">
            <button
              disabled={saving || uploading}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-red text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'در حال ذخیره…' : 'ذخیره ویدیو'}
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
