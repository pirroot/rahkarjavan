'use client';

import { Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

type Props = {
  kind: 'image' | 'video';
  value?: string | null;
  onChange: (url: string | null) => void;
};

export default function UploadField({ kind, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  function upload(file: File) {
    setError('');
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/upload?kind=${kind}&filename=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setProgress(null);
      try {
        const d = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) onChange(d.url);
        else setError(d.error ?? 'آپلود ناموفق بود.');
      } catch {
        setError('پاسخ نامعتبر از سرور.');
      }
    };

    xhr.onerror = () => {
      setProgress(null);
      setError('خطای شبکه در آپلود.');
    };

    xhr.send(file);
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={
          kind === 'video'
            ? 'video/mp4,video/webm,video/quicktime,video/x-matroska'
            : 'image/jpeg,image/png,image/webp,image/gif,image/avif'
        }
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = '';
        }}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#080d14] p-2">
          {kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-14 w-24 rounded object-cover" />
          ) : (
            <video src={value} className="h-14 w-24 rounded object-cover" muted />
          )}

          <span className="min-w-0 flex-1 truncate text-xs text-slate-300" dir="ltr">
            {value}
          </span>

          {/* Replace without deleting first */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            className="shrink-0 text-xs text-emerald-300 transition hover:text-emerald-200 disabled:opacity-40"
          >
            تعویض
          </button>

          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-red-300 transition hover:text-red-200"
            aria-label="حذف"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-white/20 bg-[#080d14] p-5 text-xs text-slate-300 transition hover:border-emerald-500/50 disabled:opacity-60"
        >
          <UploadCloud size={20} />
          {progress !== null
            ? 'در حال آپلود…'
            : kind === 'video'
              ? 'انتخاب فایل ویدیو'
              : 'انتخاب تصویر'}
        </button>
      )}

      {progress !== null && (
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
            {progress.toLocaleString('fa-IR')}٪
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
