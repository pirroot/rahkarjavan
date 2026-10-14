'use client';

import { Mail, MailOpen, Phone, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

const faDateTime = (v: string | Date) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));

export default function MessagesAdmin() {
  const [items, setItems] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Which message is expanded — read/unread like an inbox
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/contacts?limit=50', { cache: 'no-store' });
      const text = await r.text();
      const d = text ? JSON.parse(text) : {};
      if (!r.ok) throw new Error(d.error ?? 'خطا');
      setItems(d.items ?? []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Mark as read when a message is opened */
  async function open(row: ContactRow) {
    const next = openId === row.id ? null : row.id;
    setOpenId(next);
    if (next && row.status === 'NEW') {
      await fetch(`/api/admin/contacts/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READ' }),
      }).catch(() => null);
      setItems((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, status: 'READ' } : item))
      );
    }
  }

  async function remove(row: ContactRow) {
    if (!confirm(`پیام «${row.subject}» حذف شود؟`)) return;
    const r = await fetch(`/api/admin/contacts/${row.id}`, { method: 'DELETE' }).catch(() => null);
    if (!r?.ok) {
      setError('حذف انجام نشد.');
      return;
    }
    setNotice('پیام حذف شد.');
    void load();
  }

  const unreadCount = items.filter((i) => i.status === 'NEW').length;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-6">
        <p className="mb-2 text-sm font-bold text-emerald-400">مدیریت محتوا</p>
        <h1 className="text-3xl font-black">پیام‌ها</h1>
        <p className="mt-2 text-sm text-slate-400">
          {unreadCount > 0
            ? `${unreadCount.toLocaleString('fa-IR')} پیام خوانده‌نشده دارید`
            : 'همهٔ پیام‌ها خوانده شده‌اند ✅'}
        </p>
      </header>

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
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center text-slate-400">
            <Mail size={28} className="mx-auto mb-3 text-slate-600" aria-hidden />
            پیامی دریافت نشده است.
          </div>
        ) : (
          items.map((row) => {
            const isUnread = row.status === 'NEW';
            const isOpen = openId === row.id;

            return (
              <article
                key={row.id}
                className={`overflow-hidden rounded-2xl border transition ${
                  isUnread
                    ? 'border-brand-red/30 bg-brand-red/[0.03]'
                    : 'border-white/10 bg-[#101823]'
                }`}
              >
                {/* ---------- Row header — click to open/close ---------- */}
                <button
                  type="button"
                  onClick={() => void open(row)}
                  className="flex w-full items-center gap-3 p-4 text-right"
                >
                  {/* Unread dot / opened icon */}
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      isUnread ? 'bg-brand-red text-white' : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {isUnread ? <Mail size={17} aria-hidden /> : <MailOpen size={17} aria-hidden />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      {isUnread && (
                        <span
                          className="size-2 shrink-0 animate-pulse rounded-full bg-brand-red"
                          aria-hidden
                        />
                      )}
                      <strong
                        className={`truncate text-sm ${isUnread ? 'font-black text-white' : 'font-bold text-slate-300'}`}
                      >
                        {row.subject}
                      </strong>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {row.name} · {row.email}
                    </span>
                  </span>

                  <span className="shrink-0 text-[11px] text-slate-500">
                    {faDateTime(row.createdAt)}
                  </span>
                </button>

                {/* ---------- Expanded body ---------- */}
                {isOpen && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3">
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-200">
                      {row.message}
                    </p>

                    {/* Contact info + actions */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <a
                          href={`mailto:${row.email}`}
                          dir="ltr"
                          className="font-bold text-brand-red hover:underline"
                        >
                          {row.email}
                        </a>
                        {row.phone && (
                          <span className="inline-flex items-center gap-1" dir="ltr">
                            <Phone size={11} aria-hidden /> {row.phone}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`mailto:${row.email}?subject=${encodeURIComponent(`پاسخ: ${row.subject}`)}`}
                          className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                        >
                          پاسخ با ایمیل
                        </a>
                        <button
                          type="button"
                          onClick={() => void remove(row)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-500/50"
                        >
                          <Trash2 size={13} /> حذف
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
