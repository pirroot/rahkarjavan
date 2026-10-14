'use client';

import { BadgeCheck, Search, Shield, Trash2, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Role = 'ADMIN' | 'AUTHOR' | 'USER';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerifiedAt: string | null;
  createdAt: string;
};

type UserResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  pages: number;
  error?: string;
};

const roleLabels: Record<Role, string> = { ADMIN: 'مدیر', AUTHOR: 'نویسنده', USER: 'کاربر' };
const roleBadgeCls: Record<Role, string> = {
  ADMIN: 'bg-brand-red/15 text-brand-red',
  AUTHOR: 'bg-emerald-500/15 text-emerald-300',
  USER: 'bg-white/10 text-slate-300',
};
const roleOptions: Role[] = ['ADMIN', 'AUTHOR', 'USER'];

const dateFormat = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

export default function UsersAdmin({ currentUserId }: { currentUserId: string }) {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (p: number, q: string, role: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' });
      if (q.trim()) params.set('q', q.trim());
      if (role) params.set('role', role);
      const response = await fetch(`/api/users?${params}`, { cache: 'no-store' });
      const data = (await response.json()) as UserResponse;
      if (!response.ok) throw new Error(data.error ?? 'دریافت کاربران ناموفق بود');
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPages(Math.max(1, data.pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, '', '');
  }, [load]);

  // Debounced live search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    void load(1, debouncedQuery, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, roleFilter]);

  async function changeRole(user: AdminUser, role: Role) {
    if (role === user.role) return;
    // Never allow changing your own role — the last admin could lock everyone out
    if (user.id === currentUserId) {
      setError('نمی‌توانی نقش حساب خودت را تغییر دهی.');
      return;
    }
    setBusyId(user.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'تغییر نقش انجام نشد');
      setNotice(`نقش ${user.name} به ${roleLabels[role]} تغییر کرد.`);
      await load(page, debouncedQuery, roleFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تغییر نقش انجام نشد');
      await load(page, debouncedQuery, roleFilter);
    } finally {
      setBusyId('');
    }
  }

  async function removeUser(user: AdminUser) {
    if (user.id === currentUserId) {
      setError('نمی‌توانی حساب خودت را حذف کنی.');
      return;
    }
    if (
      !window.confirm(`حساب «${user.name}» برای همیشه حذف شود؟ خبرها و ویدیوهای او باقی می‌مانند.`)
    )
      return;
    setBusyId(user.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'حذف کاربر انجام نشد');
      setNotice(`کاربر ${user.name} حذف شد.`);
      await load(page, debouncedQuery, roleFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حذف کاربر انجام نشد');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-6">
        <p className="mb-2 text-sm font-bold text-emerald-400">مدیریت دسترسی‌ها</p>
        <h1 className="text-3xl font-black">کاربران</h1>
        <p className="mt-2 text-sm text-slate-400">
          {total.toLocaleString('fa-IR')} کاربر — نقش هر نفر مشخص می‌کند چه چیزی می‌تواند انجام دهد.
        </p>
      </header>

      {/* ---------- Search + role filter ---------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(1, debouncedQuery, roleFilter);
        }}
        className="mb-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#101823] p-4 sm:flex-row"
      >
        <label className="relative min-w-0 flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی نام یا ایمیل…"
            className="h-11 w-full rounded-lg border border-white/10 bg-black/20 pr-10 pl-3 text-sm text-white outline-none focus:border-emerald-500/60"
          />
        </label>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="h-11 rounded-lg border border-white/10 bg-[#0b1119] px-3 text-sm text-slate-200 outline-none focus:border-emerald-500/60"
        >
          <option value="">همه نقش‌ها</option>
          <option value="ADMIN">مدیر</option>
          <option value="AUTHOR">نویسنده</option>
          <option value="USER">کاربر</option>
        </select>
      </form>

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

      {/* ---------- User cards ---------- */}
      <div className="grid gap-3 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />
            ))
          : items.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <article
                  key={user.id}
                  className="rounded-2xl border border-white/10 bg-[#101823] p-4 transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Identity */}
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-black ${
                          user.role === 'ADMIN'
                            ? 'bg-brand-red/15 text-brand-red'
                            : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {user.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-black text-white">
                          {user.name}
                          {isSelf && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                              شما
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-500" dir="ltr">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Role badge */}
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${roleBadgeCls[user.role]}`}
                    >
                      {user.role === 'ADMIN' ? (
                        <Shield size={10} aria-hidden />
                      ) : (
                        <UserRound size={10} aria-hidden />
                      )}
                      {roleLabels[user.role]}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        user.emailVerifiedAt ? 'text-emerald-400/80' : 'text-amber-400/80'
                      }`}
                    >
                      <BadgeCheck size={12} aria-hidden />
                      {user.emailVerifiedAt ? 'ایمیل تأییدشده' : 'ایمیل تأییدنشده'}
                    </span>
                    <span>عضویت: {dateFormat.format(new Date(user.createdAt))}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                    {isSelf ? (
                      <span className="rounded-md bg-white/5 px-3 py-2 text-xs text-slate-400">
                        نقش شما قابل تغییر نیست
                      </span>
                    ) : (
                      <select
                        aria-label={`نقش ${user.name}`}
                        value={user.role}
                        disabled={busyId === user.id}
                        onChange={(event) => void changeRole(user, event.target.value as Role)}
                        className="rounded-md border border-white/10 bg-[#0b1119] px-3 py-2 text-xs text-slate-200 outline-none disabled:opacity-50"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                    )}

                    {isSelf ? (
                      <span className="text-xs text-slate-600">—</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => void removeUser(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-500/50 disabled:opacity-50"
                      >
                        <Trash2 size={13} /> حذف
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
        {!loading && items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 py-16 text-center text-slate-400">
            <UserRound size={28} className="mx-auto mb-3 text-slate-600" aria-hidden />
            کاربری مطابق جست‌وجو پیدا نشد.
          </div>
        )}
      </div>

      {/* ---------- Pagination ---------- */}
      <footer className="mt-6 flex items-center justify-between text-xs text-slate-400">
        <span>
          صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1, debouncedQuery, roleFilter)}
            className="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            قبلی
          </button>
          <button
            disabled={page >= pages || loading}
            onClick={() => void load(page + 1, debouncedQuery, roleFilter)}
            className="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      </footer>
    </section>
  );
}
