'use client';

import { Camera, Loader2, Save, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

const field =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 dark:border-white/15 dark:bg-white/5';

type Props = {
  name: string;
  bio: string;
  avatarUrl: string;
};

const BIO_MAX = 500;

export default function ProfileEditor({ name, bio, avatarUrl }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bioLength, setBioLength] = useState(bio.length);

  // Avatar state — file input + instant upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** Upload immediately on file pick — avatar applies without touching name/bio */
  function uploadAvatar(file: File) {
    setAvatarError('');
    setUploading(true);
    abortRef.current = new AbortController();

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/profile/avatar?filename=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.onload = () => {
      setUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 201) {
          setAvatar(data.url);
          router.refresh(); // header/profile pick it up instantly
        } else {
          setAvatarError(data.error ?? 'آپلود ناموفق بود.');
        }
      } catch {
        setAvatarError('پاسخ نامعتبر از سرور.');
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setAvatarError('خطای شبکه در آپلود.');
    };
    xhr.send(file);
  }

  async function removeAvatar() {
    setAvatarError('');
    const response = await fetch('/api/profile/avatar', { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) {
      setAvatarError('حذف تصویر ممکن نشد.');
      return;
    }
    setAvatar('');
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSaved(false);

    const form = new FormData(event.currentTarget);
    abortRef.current = new AbortController();

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        bio: form.get('bio'),
        avatarUrl: avatar || null, // current avatar state (may be freshly uploaded)
      }),
      signal: abortRef.current.signal,
    }).catch(() => null);

    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(result?.error ?? 'ذخیره ممکن نشد.');
      setSubmitting(false);
      return;
    }
    setSaved(true);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      {/* ---------- Avatar uploader ---------- */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt="تصویر پروفایل"
              className="size-20 rounded-2xl border border-gray-200 object-cover dark:border-white/15"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/10">
              <User size={28} aria-hidden />
            </span>
          )}

          {/* Camera overlay button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="تغییر تصویر پروفایل"
            className="absolute -bottom-1.5 -left-1.5 grid size-8 place-items-center rounded-full bg-brand-red text-white shadow-md transition hover:bg-red-700 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Camera size={14} aria-hidden />
            )}
          </button>

          {/* Hidden real file input */}
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
              e.target.value = '';
            }}
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold">تصویر پروفایل</p>
          <p className="mt-1 text-xs text-gray-500">JPG، PNG یا WebP — حداکثر ۱۰ مگابایت</p>
          <div className="mt-1.5 flex items-center gap-3">
            {uploading && <span className="text-xs font-bold text-brand-red">در حال آپلود…</span>}
            {avatar && !uploading && (
              <button
                type="button"
                onClick={() => void removeAvatar()}
                className="inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-brand-red"
              >
                <Trash2 size={12} aria-hidden /> حذف تصویر
              </button>
            )}
          </div>
          {avatarError && (
            <p role="alert" className="mt-1 text-xs text-brand-red">
              {avatarError}
            </p>
          )}
        </div>
      </div>

      {/* ---------- Name ---------- */}
      <label className="grid gap-2 text-sm font-bold">
        <span className="inline-flex items-center gap-1.5">
          <User size={14} className="text-brand-red" aria-hidden /> نام نمایشی
        </span>
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={name}
          className={field}
        />
      </label>

      {/* ---------- Bio ---------- */}
      <label className="grid gap-2 text-sm font-bold">
        <span className="inline-flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5">درباره من</span>
          <span
            className={`text-[11px] font-normal tabular-nums ${
              bioLength > BIO_MAX * 0.9 ? 'text-amber-500' : 'text-gray-400'
            }`}
          >
            {bioLength.toLocaleString('fa-IR')} / {BIO_MAX.toLocaleString('fa-IR')}
          </span>
        </span>
        <textarea
          name="bio"
          maxLength={BIO_MAX}
          rows={4}
          defaultValue={bio}
          onChange={(e) => setBioLength(e.target.value.length)}
          className={`${field} resize-y leading-8`}
          placeholder="کمی درباره خودتان بنویسید…"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-700 dark:text-green-300"
        >
          تغییرات ذخیره شد.
        </p>
      )}

      <button
        disabled={submitting}
        className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        <Save size={16} aria-hidden />
        {submitting ? 'در حال ذخیره…' : 'ذخیره پروفایل'}
      </button>
    </form>
  );
}
