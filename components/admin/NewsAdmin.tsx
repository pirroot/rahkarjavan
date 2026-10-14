'use client';

import NewsForm, { type NewsRow } from '@/components/admin/NewsForm';
import { useDebounced } from '@/lib/use-debounced';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Item = NewsRow & {
  views: number;
  category?: { name: string };
  cover: { url: string } | null;
};

const statusFa: Record<string, string> = { PUBLISHED: 'منتشرشده', DRAFT: 'پیش‌نویس' };

export default function NewsAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 350);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formRow, setFormRow] = useState<NewsRow | Item | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (debounced.trim()) params.set('q', debounced.trim());
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch(`/api/admin/news?${params}`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'خطا');
      setItems(d.items);
      setCategories(d.categories ?? []);
      setTotal(d.total);
      setPages(Math.max(1, d.pages));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [page, debounced, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(item: Item) {
    if (!confirm(`خبر «${item.title}» حذف شود؟ این کار برگشت‌پذیر نیست.`)) return;
    const r = await fetch(`/api/admin/news/${item.id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d.error ?? 'حذف ناموفق بود');
      return;
    }
    setNotice('خبر حذف شد.');
    void load();
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-bold text-emerald-400">مدیریت محتوا</p>
          <h1 className="text-3xl font-black">خبرها</h1>
          <p className="mt-2 text-sm text-slate-400">{total.toLocaleString('fa-IR')} خبر</p>
        </div>
        <button
          onClick={() => {
            setFormRow(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
        >
          <Plus size={17} /> خبر جدید
        </button>
      </header>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#101823] p-4 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی عنوان یا نامک…"
            className="h-11 w-full rounded-lg border border-white/10 bg-black/20 pr-10 pl-3 text-sm outline-none focus:border-emerald-500/60"
          />
        </label>
        <div className="flex gap-2">
          {[
            { v: '', label: 'همه' },
            { v: 'PUBLISHED', label: 'منتشرشده' },
            { v: 'DRAFT', label: 'پیش‌نویس' },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => {
                setStatusFilter(opt.v);
                setPage(1);
              }}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                statusFilter === opt.v
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />
            ))
          : items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101823] transition hover:border-emerald-500/40"
              >
                <div className="relative aspect-video bg-white/5">
                  {item.cover?.url || item.coverUrl ? (
                    <Image
                      src={item.cover?.url ?? item.coverUrl ?? ''}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-3xl text-slate-600">📄</div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      item.status === 'PUBLISHED'
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-amber-500/90 text-black'
                    }`}
                  >
                    {statusFa[item.status] ?? item.status}
                  </span>
                  {item.featured && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-red px-2.5 py-1 text-[10px] font-bold text-white">
                      ویژه
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-[11px] font-bold text-brand-red">
                    {item.category?.name ?? 'بدون دسته'}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={11} /> {item.views.toLocaleString('fa-IR')}
                    </span>
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFormRow(item);
                          setFormOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-300"
                      >
                        <Pencil size={12} /> ویرایش
                      </button>
                      <button
                        onClick={() => void remove(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-500/50"
                      >
                        <Trash2 size={12} /> حذف
                      </button>
                    </div>
                    <Link
                      href={`/mag/${item.slug}`}
                      target="_blank"
                      className="text-[11px] text-slate-500 transition hover:text-white"
                    >
                      مشاهده ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
        {!loading && items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 py-16 text-center text-slate-400">
            خبری پیدا نشد — با دکمه «خبر جدید» اولین خبر را بساز.
          </div>
        )}
      </div>

      {/* Pagination */}
      <footer className="mt-6 flex items-center justify-between text-xs text-slate-400">
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

      {/* Dedicated form */}
      {formOpen && (
        <NewsForm
          row={formRow}
          categories={categories}
          onClose={() => {
            setFormOpen(false);
            setFormRow(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setFormRow(null);
            setNotice('خبر با موفقیت ذخیره شد.');
            void load();
          }}
        />
      )}
    </section>
  );
}
