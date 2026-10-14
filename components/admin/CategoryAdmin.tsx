'use client';

import CategoryForm, { type CategoryRow } from '@/components/admin/CategoryForm';
import { FolderTree, Pencil, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const sectionFa: Record<string, { label: string; icon: string }> = {
  VIDEO: { label: 'رسانه تصویری', icon: '🎬' },
  ARTICLE: { label: 'مجله', icon: '📰' },
  BOTH: { label: 'هر دو بخش', icon: '✨' },
};

export default function CategoryAdmin() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formRow, setFormRow] = useState<CategoryRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/categories?limit=50', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'خطا');
      setItems(d.items);
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

  async function remove(row: CategoryRow) {
    if (!confirm(`دسته «${row.name}» حذف شود؟`)) return;
    const r = await fetch(`/api/admin/categories/${row.id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      // friendly version of the Prisma restrict error
      setError(d.error ?? 'این دسته دارای محتوا است؛ اول خبرها/ویدیوهایش را جابه‌جا کنید.');
      return;
    }
    setNotice('دسته حذف شد.');
    void load();
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-bold text-emerald-400">مدیریت محتوا</p>
          <h1 className="text-3xl font-black">دسته‌بندی‌ها</h1>
          <p className="mt-2 text-sm text-slate-400">
            دسته‌بندی‌ها خبرها و ویدیوها را مرتب می‌کنند و در فیلتر سایت نمایش داده می‌شوند.
          </p>
        </div>
        <button
          onClick={() => {
            setFormRow(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
        >
          <Plus size={17} /> دسته‌بندی جدید
        </button>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
            ))
          : items.map((row) => {
              const s = sectionFa[row.section] ?? sectionFa.BOTH;
              return (
                <article
                  key={row.id}
                  className="group rounded-2xl border border-white/10 bg-[#101823] p-4 transition hover:border-emerald-500/40"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className="grid size-9 place-items-center rounded-xl bg-white/5 text-lg"
                        aria-hidden
                      >
                        {s.icon}
                      </span>
                      <span>
                        <strong className="block text-sm font-bold text-white">{row.name}</strong>
                        <span dir="ltr" className="mt-0.5 block text-[11px] text-slate-500">
                          /category/{row.slug}
                        </span>
                      </span>
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                      {s.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFormRow(row);
                          setFormOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-300"
                      >
                        <Pencil size={12} /> ویرایش
                      </button>
                      <button
                        onClick={() => void remove(row)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-500/50"
                      >
                        حذف
                      </button>
                    </div>
                    <FolderTree size={13} className="text-slate-600" aria-hidden />
                  </div>
                </article>
              );
            })}
        {!loading && items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 py-16 text-center text-slate-400">
            هنوز دسته‌بندی‌ای ساخته نشده — چند دسته بساز (مصاحبه، گزارش ویژه، اقتصاد و…)
          </div>
        )}
      </div>

      {formOpen && (
        <CategoryForm
          row={formRow}
          onClose={() => {
            setFormOpen(false);
            setFormRow(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setFormRow(null);
            setNotice('دسته‌بندی ذخیره شد.');
            void load();
          }}
        />
      )}
    </section>
  );
}
