import LogoutButton from '@/components/LogoutButton';
import ProfileEditor from '@/components/ProfileEditor';
import { canManageContent, getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SITE } from '@/lib/site';
import { CalendarDays, Film, LayoutDashboard, MessageSquare, Newspaper } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'پروفایل' };
export const dynamic = 'force-dynamic';

const roleLabel = { USER: 'کاربر', AUTHOR: 'نویسنده', ADMIN: 'مدیر' } as const;
type RoleKey = keyof typeof roleLabel;

const faDate = (v: Date | string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v));
const faDateTime = (v: Date | string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  news: { title: string; slug: string } | null;
  video: { title: string; slug: string } | null;
};

type ProfileData = {
  name: string;
  email: string;
  role: RoleKey;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  let databaseUnavailable = false;
  let userMissing = false;
  let user: ProfileData = {
    name: session.name,
    email: session.email,
    role: (session.role as RoleKey) ?? 'USER',
    bio: null,
    avatarUrl: null,
    createdAt: new Date(), // replaced by the DB value as soon as it loads
  };
  let comments: CommentRow[] = [];

  try {
    const [dbUser, dbComments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.id },
        select: {
          name: true,
          email: true,
          role: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      prisma.comment.findMany({
        where: { authorId: session.id },
        include: {
          news: { select: { title: true, slug: true } },
          video: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    if (dbUser) user = { ...dbUser, role: dbUser.role as RoleKey };
    else userMissing = true;
    comments = dbComments;
  } catch (error) {
    databaseUnavailable = true;
    console.warn('Database unavailable on profile page.', error);
  }

  // Redirects stay OUTSIDE try/catch — NEXT_REDIRECT must never be swallowed
  if (userMissing) redirect('/login');

  const verified = (await searchParams).verified === '1';
  const role = roleLabel[user.role];
  const memberSince = faDate(user.createdAt);
  const commentCount = comments.length;
  const newsComments = comments.filter((c) => c.news).length;
  const videoComments = comments.filter((c) => c.video).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* ---------- Identity header ---------- */}
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
        <div className="h-20 bg-linear-to-l from-brand-red/80 via-brand-red/50 to-brand-red/30" />
        <div className="-mt-10 px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-20 rounded-2xl border-4 border-white object-cover shadow-md dark:border-[#0f1420]"
                />
              ) : (
                <span className="grid size-20 place-items-center rounded-2xl border-4 border-white bg-brand-red text-2xl font-black text-white shadow-md dark:border-[#0f1420]">
                  {user.name.slice(0, 1)}
                </span>
              )}
              <div className="pb-1">
                <h1 className="text-2xl font-black">{user.name}</h1>
                <p className="mt-0.5 text-sm text-gray-500" dir="ltr">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {canManageContent(session) && (
                <Link
                  href="/admin"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-red px-4 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  <LayoutDashboard size={16} aria-hidden /> پنل مدیریت
                </Link>
              )}
              <LogoutButton className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-bold transition hover:border-brand-red hover:text-brand-red dark:border-white/15" />
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">{user.bio}</p>
          )}

          {/* ---------- Stats strip ---------- */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-gray-200 rounded-2xl border border-gray-200 text-center dark:divide-white/10 dark:border-white/10">
            <div className="px-2 py-3">
              <p className="text-lg font-black">{commentCount.toLocaleString('fa-IR')}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">نظر ثبت‌شده</p>
            </div>
            <div className="px-2 py-3">
              <p className="inline-flex items-center gap-1 text-lg font-black">
                <Film size={15} className="text-brand-red" aria-hidden />
                {videoComments.toLocaleString('fa-IR')}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">روی ویدیوها</p>
            </div>
            <div className="px-2 py-3">
              <p className="inline-flex items-center gap-1 text-lg font-black">
                <Newspaper size={15} className="text-brand-red" aria-hidden />
                {newsComments.toLocaleString('fa-IR')}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">روی خبرها</p>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
            <CalendarDays size={13} aria-hidden />
            عضو {SITE.shortName} از {memberSince} · {role}
          </p>
        </div>
      </section>

      {databaseUnavailable && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red"
        >
          در حال حاضر به پایگاه‌داده وصل نیستیم؛ ویرایش پروفایل و نظرها بعد از اجرای PostgreSQL در
          دسترس است.
        </p>
      )}

      {verified && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-700 dark:text-green-300"
        >
          ایمیل شما تأیید شد. خوش آمدید.
        </p>
      )}

      {!databaseUnavailable && (
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-5 text-lg font-black">ویرایش پروفایل</h2>
          <ProfileEditor name={user.name} bio={user.bio ?? ''} avatarUrl={user.avatarUrl ?? ''} />
        </section>
      )}

      {/* ---------- User comments ---------- */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-6 w-1.5 rounded-full bg-brand-red" />
          <h2 className="text-lg font-black">نظرهای شما</h2>
          {commentCount > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {commentCount.toLocaleString('fa-IR')}
            </span>
          )}
        </div>

        <div className="grid gap-3">
          {comments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center dark:border-white/15">
              <MessageSquare
                size={28}
                className="mx-auto text-gray-300 dark:text-gray-600"
                aria-hidden
              />
              <p className="mt-3 text-sm font-bold">هنوز نظری ثبت نکرده‌اید</p>
              <p className="mt-1 text-xs text-gray-500">
                زیر ویدیوها و خبرها دیدگاه بگذارید تا اینجا نمایش داده شود.
              </p>
            </div>
          )}

          {comments.map((comment) => {
            const href = comment.news
              ? `/mag/${comment.news.slug}`
              : comment.video
                ? `/video/${comment.video.slug}`
                : '#';
            const title = comment.news?.title ?? comment.video?.title ?? 'محتوا';
            const kind = comment.news ? 'خبر' : comment.video ? 'ویدیو' : 'محتوا';

            return (
              <Link
                key={comment.id}
                href={href}
                className="group rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-brand-red/40 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-bold group-hover:text-brand-red">
                    {title}
                  </p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                    {kind}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-gray-600 dark:text-gray-300">
                  {comment.body}
                </p>
                <p className="mt-2 text-[11px] text-gray-400">{faDateTime(comment.createdAt)}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
