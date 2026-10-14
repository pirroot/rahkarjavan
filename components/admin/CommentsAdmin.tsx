'use client';

import { Check, MessageSquare, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  status: string;
  author: { id: string; name: string };
  news: { title: string; slug: string } | null;
  video: { title: string; slug: string } | null;
};

const statusBadge: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'در انتظار تأیید', cls: 'bg-amber-500/15 text-amber-300' },
  APPROVED: { label: 'تأییدشده', cls: 'bg-emerald-500/15 text-emerald-300' },
  REJECTED: { label: 'ردشده', cls: 'bg-red-500/15 text-red-300' },
};

const faDateTime = (v: string | Date) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED' | '';

export default function CommentsAdmin() {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [tab, setTab] = useState<Tab>('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (tab) params.set('status', tab);
      const r = await fetch(`/api/admin/comments?${params}`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'خطا');
      setItems(d.items);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    setError('');
    const r = await fetch(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) {
      setError('انجام نشد.');
      return;
    }
    setNotice(status === 'APPROVED' ? 'دیدگاه تأیید شد.' : 'دیدگاه رد شد.');
    void load();
  }

  async function remove(id: string) {
    if (!confirm('این دیدگاه برای همیشه حذف شود؟')) return;
    const r = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      setError('حذف انجام نشد.');
      return;
    }
    setNotice('دیدگاه حذف شد.');
    void load();
  }

  const tabs: Array<{ v: Tab; label: string }> = [
    { v: 'PENDING', label: 'در انتظار تأیید' },
    { v: 'APPROVED', label: 'تأییدشده' },
    { v: 'REJECTED', label: 'ردشده' },
    { v: '', label: 'همه' },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-6">
        <p className="mb-2 text-sm font-bold text-emerald-400">مدیریت محتوا</p>
        <h1 className="text-3xl font-black">دیدگاه‌ها</h1>
        <p className="mt-2 text-sm text-slate-400">
          دیدگاه‌های کاربران قبل از نمایش در سایت از اینجا تأیید می‌شوند.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
              tab === t.v
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {notice}
        </p>
      )}

      <div className="grid gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center text-slate-400">
            <MessageSquare size={28} className="mx-auto mb-3 text-slate-600" aria-hidden />
            {tab === 'PENDING'
              ? 'دیدگاه در انتظار تأییدی ندارید — همه‌چیز بررسی شده ✅'
              : 'دیدگاهی در این بخش نیست.'}
          </div>
        ) : (
          items.map((row) => {
            const badge = statusBadge[row.status] ?? statusBadge.PENDING;
            const target = row.news ?? row.video;
            const href = row.news
              ? `/mag/${row.news.slug}`
              : row.video
                ? `/video/${row.video.slug}`
                : '#';
            const kind = row.news ? 'خبر' : row.video ? 'ویدیو' : '—';

            return (
              <article
                key={row.id}
                className="rounded-2xl border border-white/10 bg-[#101823] p-4 transition hover:border-white/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-full bg-brand-red/10 text-sm font-black text-brand-red">
                      {row.author?.name?.slice(0, 1) ?? '؟'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {row.author?.name ?? 'کاربر حذف‌شده'}
                      </p>
                      <p className="text-[11px] text-slate-500">{faDateTime(row.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-200">
                  {row.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
                  {target ? (
                    <Link
                      href={href}
                      target="_blank"
                      className="text-[11px] text-slate-500 transition hover:text-white"
                    >
                      {kind}: {target.title} ↗
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-600">محتوا حذف شده</span>
                  )}

                  <div className="flex gap-2">
                    {row.status !== 'APPROVED' && (
                      <button
                        onClick={() => void setStatus(row.id, 'APPROVED')}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                      >
                        <Check size={13} /> تأیید
                      </button>
                    )}
                    {row.status !== 'REJECTED' && (
                      <button
                        onClick={() => void setStatus(row.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300 transition hover:bg-amber-500/10"
                      >
                        <X size={13} /> رد
                      </button>
                    )}
                    <button
                      onClick={() => void remove(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-500/50"
                    >
                      <Trash2 size={13} /> حذف
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
