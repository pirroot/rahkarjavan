'use client';

import { Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

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
const dateFormat = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

export default function AdminUsersPanel({ currentUserId }: { currentUserId: string }) {
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

  const loadUsers = useCallback(async (currentPage: number, q: string, role: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' });
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
    void loadUsers(1, '', '');
  }, [loadUsers]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadUsers(1, query, roleFilter);
  }

  // Role filter should apply immediately, not wait for the search button
  function onRoleFilterChange(role: string) {
    setRoleFilter(role);
    void loadUsers(1, query, role);
  }

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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'تغییر نقش انجام نشد');
      setNotice(`نقش ${user.name} به ${roleLabels[role]} تغییر کرد.`);
      await loadUsers(page, query, roleFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تغییر نقش انجام نشد');
      await loadUsers(page, query, roleFilter);
    } finally {
      setBusyId('');
    }
  }

  async function removeUser(user: AdminUser) {
    if (user.id === currentUserId) {
      setError('نمی‌توانی حساب خودت را حذف کنی.');
      return;
    }
    if (!window.confirm(`کاربر «${user.name}» حذف شود؟ این کار برگشت‌پذیر نیست.`)) return;
    setBusyId(user.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'حذف کاربر انجام نشد');
      setNotice(`کاربر ${user.name} حذف شد.`);
      await loadUsers(page, query, roleFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حذف کاربر انجام نشد');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8" dir="rtl">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-400">
            <ShieldCheck size={16} /> مدیریت دسترسی‌ها
          </p>
          <h1 className="text-2xl font-black text-white sm:text-3xl">کاربران</h1>
          <p className="mt-2 text-sm text-slate-400">جست‌وجو و مدیریت نقش اعضای سایت</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          <Users size={18} className="text-emerald-400" /> {total.toLocaleString('fa-IR')} کاربر
        </div>
      </header>

      <form
        onSubmit={search}
        className="mb-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#101823] p-4 sm:flex-row"
      >
        <label className="relative min-w-0 flex-1">
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی نام یا ایمیل"
            className="h-11 w-full rounded-lg border border-white/10 bg-black/20 pr-10 pl-3 text-sm text-white outline-none focus:border-emerald-500/60"
          />
        </label>
        <select
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value)}
          className="h-11 rounded-lg border border-white/10 bg-[#0b1119] px-3 text-sm text-slate-200 outline-none focus:border-emerald-500/60"
        >
          <option value="">همه نقش‌ها</option>
          <option value="ADMIN">مدیر</option>
          <option value="AUTHOR">نویسنده</option>
          <option value="USER">کاربر</option>
        </select>
        <button
          disabled={loading}
          className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          جست‌وجو
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
        >
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101823]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-white/[0.03] text-xs text-slate-400">
              <tr>
                <th className="px-5 py-4 font-semibold">کاربر</th>
                <th className="px-5 py-4 font-semibold">نقش</th>
                <th className="px-5 py-4 font-semibold">وضعیت ایمیل</th>
                <th className="px-5 py-4 font-semibold">عضویت</th>
                <th className="px-5 py-4 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    در حال دریافت کاربران…
                  </td>
                </tr>
              ) : items.length ? (
                items.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <tr key={user.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <strong className="block text-slate-100">
                          {user.name}{' '}
                          {isSelf && <span className="text-xs text-emerald-400">(شما)</span>}
                        </strong>
                        <span dir="ltr" className="mt-1 block text-right text-xs text-slate-500">
                          {user.email}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span className="rounded-md bg-white/5 px-3 py-2 text-xs text-slate-300">
                            {roleLabels[user.role]}
                          </span>
                        ) : (
                          <select
                            aria-label={`نقش ${user.name}`}
                            value={user.role}
                            disabled={busyId === user.id}
                            onChange={(event) => void changeRole(user, event.target.value as Role)}
                            className="rounded-md border border-white/10 bg-[#0b1119] px-3 py-2 text-xs text-slate-200 outline-none disabled:opacity-50"
                          >
                            <option value="ADMIN">مدیر</option>
                            <option value="AUTHOR">نویسنده</option>
                            <option value="USER">کاربر</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${user.emailVerifiedAt ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}
                        >
                          {user.emailVerifiedAt ? 'تأییدشده' : 'تأییدنشده'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {dateFormat.format(new Date(user.createdAt))}
                      </td>
                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span className="text-xs text-slate-600">—</span>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === user.id}
                            onClick={() => void removeUser(user)}
                            className="inline-flex items-center gap-2 rounded-md border border-red-400/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> حذف
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    کاربری مطابق جست‌وجو پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-slate-400 sm:px-5">
          <span>
            صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => void loadUsers(page - 1, query, roleFilter)}
              className="rounded-md border border-white/10 px-3 py-2 disabled:opacity-40"
            >
              قبلی
            </button>
            <button
              disabled={page >= pages || loading}
              onClick={() => void loadUsers(page + 1, query, roleFilter)}
              className="rounded-md border border-white/10 px-3 py-2 disabled:opacity-40"
            >
              بعدی
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
