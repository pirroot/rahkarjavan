'use client';

import { BellOff, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Row = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

const faDate = (v: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v));

export default function SubscribersAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/subscribers?page=${p}&limit=20`, { cache: 'no-store' });
      const text = await r.text();
      const d = text ? JSON.parse(text) : {};
      if (!r.ok) throw new Error(d.error ?? 'خطا');
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
      setPages(Math.max(1, d.pages ?? 1));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  async function toggle(row: Row) {
    const r = await fetch(`/api/admin/subscribers/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !row.isActive }),
    }).catch(() => null);
    if (!r?.ok) {
      setError('انجام نشد.');
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === row.id ? { ...x, isActive: !x.isActive } : x)));
  }

  async function remove(row: Row) {
    if (!confirm(`${row.email} از خبرنامه حذف شود؟`)) return;
    const r = await fetch(`/api/admin/subscribers/${row.id}`, { method: 'DELETE' }).catch(
      () => null
    );
    if (!r?.ok) {
      setError('حذف انجام نشد.');
      return;
    }
    void load(page);
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
      <header className="mb-6">
        <p className="mb-2 text-sm font-bold text-emerald-400">مدیریت محتوا</p>
        <h1 className="text-3xl font-black">خبرنامه</h1>
        <p className="mt-2 text-sm text-slate-400">
          {total.toLocaleString('fa-IR')} مشترک — ایمیل‌هایی که برای دریافت اخبار ثبت‌نام کرده‌اند.
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101823]">
        {loading ? (
          <div className="p-10 text-center text-slate-400">در حال بارگذاری…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <BellOff size={28} className="mx-auto mb-3 text-slate-600" aria-hidden />
            هنوز کسی در خبرنامه عضو نشده است.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-200" dir="ltr">
                  {row.email}
                </span>
                <span className="shrink-0 text-[11px] text-slate-500">{faDate(row.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => void toggle(row)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                    row.isActive
                      ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  {row.isActive ? 'فعال' : 'غیرفعال'}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(row)}
                  aria-label="حذف"
                  className="shrink-0 text-red-300/70 transition hover:text-red-300"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>
          صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            قبلی
          </button>
          <button
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      </footer>
    </section>
  );
}
