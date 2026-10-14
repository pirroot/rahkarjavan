import { canManageContent, getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SITE } from '@/lib/site';
import {
  Activity,
  ArrowLeft,
  ArrowUpLeft,
  ArrowUpRight,
  Bell,
  Eye,
  FileText,
  Film,
  MessageSquare,
  PenLine,
  Plus,
  Users,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminDashboardChart } from './AdminDashboardChart';

const faNumber = (v: number) => v.toLocaleString('fa-IR');
const faDate = (v?: Date | string | null) =>
  v ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v)) : '—';
const formatTime = (v?: Date | string | null) =>
  v
    ? new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(v))
    : '—';
const catName = (c?: { name?: string } | null) => c?.name ?? 'بدون دسته';
const statusFa: Record<string, string> = { PUBLISHED: 'منتشرشده', DRAFT: 'پیش‌نویس' };

export async function AdminDashboard() {
  const user = await getSession();
  if (!user) redirect('/admin/login');
  if (!canManageContent(user)) redirect('/');

  // Fresh date on every render — not frozen at server start
  const now = new Date();
  const publishedWhere = { status: 'PUBLISHED' as const, publishedAt: { lte: now } };

  const [
    newsCount,
    videoCount,
    newsDrafts,
    videoDrafts,
    viewAggs,
    commentCount,
    userCount,
    latestNews,
    topVideos,
    newContacts,
    breakingNews,
    categories,
    newsViews,
    videoViews,
  ] = await Promise.all([
    prisma.news.count({ where: publishedWhere }),
    prisma.video.count({ where: publishedWhere }),
    prisma.news.count({ where: { status: 'DRAFT' } }),
    prisma.video.count({ where: { status: 'DRAFT' } }),
    prisma.$transaction([
      prisma.news.aggregate({ _sum: { views: true }, where: publishedWhere }),
      prisma.video.aggregate({ _sum: { views: true }, where: publishedWhere }),
    ]),
    prisma.comment.count(),
    prisma.user.count(),
    prisma.news.findMany({
      where: publishedWhere,
      include: { category: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    }),
    prisma.video.findMany({
      where: publishedWhere,
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, slug: true, title: true, views: true },
    }),
    prisma.contact.findMany({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, subject: true, createdAt: true },
    }),
    prisma.news.findMany({
      where: { ...publishedWhere, isBreaking: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: { id: true, slug: true, title: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.news.groupBy({
      by: ['categoryId'],
      _sum: { views: true },
      where: { status: 'PUBLISHED' },
    }),
    prisma.video.groupBy({
      by: ['categoryId'],
      _sum: { views: true },
      where: { status: 'PUBLISHED' },
    }),
  ]);

  const totalViews = (viewAggs[0]._sum.views ?? 0) + (viewAggs[1]._sum.views ?? 0);

  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const byCat = new Map<string, number>();
  for (const row of [...newsViews, ...videoViews]) {
    const name = nameById.get(row.categoryId) ?? 'بدون دسته';
    byCat.set(name, (byCat.get(name) ?? 0) + (row._sum.views ?? 0));
  }
  const chartData = [...byCat.entries()]
    .map(([category, views]) => ({ category, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 7);

  const displayName = user.name || user.email.split('@')[0] || 'همکار تحریریه';

  // NOTE: sidebar comes from app/admin/(panel)/layout.tsx — this page is content only
  return (
    <main className="tn-dashboard">
      <header className="tn-dashboard__heading">
        <div>
          <div className="tn-dashboard__eyebrow">
            <span /> پنل مدیریت {SITE.shortName}
          </div>
          <h1>خسته نباشی، {displayName}</h1>
          <p>وضعیت امروز تحریریه و محتوای سایت را یک‌جا ببین.</p>
        </div>
        <div className="tn-dashboard__actions">
          <Link href="/admin/news" className="tn-button tn-button--primary">
            <Plus size={17} /> مدیریت خبرها
          </Link>
          <Link href="/admin/videos" className="tn-button tn-button--secondary">
            <Video size={17} /> مدیریت ویدیوها
          </Link>
        </div>
      </header>

      <section className="tn-dashboard__stats" aria-label="آمار کلی">
        <StatCard
          icon={<FileText size={19} />}
          label="خبرهای منتشرشده"
          value={faNumber(newsCount)}
          detail={`${faNumber(newsDrafts)} پیش‌نویس`}
          tone="red"
          href="/admin/news"
        />
        <StatCard
          icon={<Film size={19} />}
          label="ویدیوهای منتشرشده"
          value={faNumber(videoCount)}
          detail={`${faNumber(videoDrafts)} پیش‌نویس`}
          tone="blue"
          href="/admin/videos"
        />
        <StatCard
          icon={<Eye size={19} />}
          label="مجموع بازدید محتوا"
          value={faNumber(totalViews)}
          detail="همهٔ محتوای منتشرشده"
          tone="green"
          href="/"
        />
        {user.role === 'ADMIN' ? (
          <StatCard
            icon={<Users size={19} />}
            label="کاربران تحریریه"
            value={faNumber(userCount)}
            detail="مدیر و نویسنده"
            tone="amber"
            href="/admin/users"
          />
        ) : (
          <StatCard
            icon={<MessageSquare size={19} />}
            label="دیدگاه‌ها"
            value={faNumber(commentCount)}
            detail="کل دیدگاه‌های ثبت‌شده"
            tone="amber"
            href="/admin/comments"
          />
        )}
      </section>

      <section className="tn-dashboard__workspace">
        <div className="tn-dashboard__main-column">
          <section className="tn-panel tn-panel--chart">
            <div className="tn-panel__heading">
              <div>
                <span className="tn-panel__kicker">نمای کلی</span>
                <h2>بازدید به تفکیک دسته</h2>
              </div>
              <span className="tn-panel__period">همهٔ محتوای منتشرشده</span>
            </div>
            {chartData.length ? (
              <AdminDashboardChart data={chartData} />
            ) : (
              <EmptyState text="با انتشار خبر و ویدیو، آمار بازدید اینجا نمایش داده می‌شود." />
            )}
            <div className="tn-chart-note">
              <Activity size={15} /> مجموع بازدید محتوای منتشرشده در هر دسته
            </div>
          </section>

          <section className="tn-panel tn-panel--table">
            <div className="tn-panel__heading">
              <div>
                <span className="tn-panel__kicker">تحریریه</span>
                <h2>آخرین خبرها</h2>
              </div>
              <Link href="/admin/news" className="tn-text-link">
                همهٔ خبرها <ArrowLeft size={15} />
              </Link>
            </div>
            {latestNews.length ? (
              <div className="tn-news-list">
                {latestNews.map((item) => (
                  <Link href={`/mag/${item.slug}`} className="tn-news-row" key={item.id}>
                    <span
                      className={`tn-status ${item.status === 'PUBLISHED' ? 'tn-status--published' : 'tn-status--draft'}`}
                    >
                      {statusFa[item.status] ?? item.status}
                    </span>
                    <span className="tn-news-row__category">{catName(item.category)}</span>
                    <span className="tn-news-row__title">{item.title}</span>
                    <span className="tn-news-row__date">{faDate(item.publishedAt)}</span>
                    <ArrowUpLeft className="tn-news-row__arrow" size={15} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState text="هنوز خبری منتشر نشده است." />
            )}
          </section>
        </div>

        <aside className="tn-dashboard__side-column">
          <section className="tn-panel tn-panel--breaking">
            <div className="tn-panel__heading">
              <div>
                <span className="tn-panel__kicker">روی سایت</span>
                <h2>
                  <Bell size={17} /> خبر فوری
                </h2>
              </div>
              <Link href="/admin/news" className="tn-text-link">
                مدیریت
              </Link>
            </div>
            {breakingNews.length ? (
              breakingNews.map((item) => (
                <Link href={`/mag/${item.slug}`} className="tn-breaking-row" key={item.id}>
                  <span className="tn-breaking-row__dot" />
                  <p>{item.title}</p>
                </Link>
              ))
            ) : (
              <EmptyState text="خبر فوری ثبت نشده است. از بخش خبرها با گزینهٔ «خبر فوری» اضافه کن." />
            )}
          </section>

          <section className="tn-panel tn-panel--popular">
            <div className="tn-panel__heading">
              <div>
                <span className="tn-panel__kicker">بر اساس بازدید</span>
                <h2>
                  <Activity size={17} /> پربازدیدترین ویدیوها
                </h2>
              </div>
            </div>
            {topVideos.length ? (
              topVideos.map((item, index) => (
                <Link href={`/video/${item.slug}`} className="tn-popular-row" key={item.id}>
                  <span className="tn-popular-row__rank">{faNumber(index + 1)}</span>
                  <span className="tn-popular-row__content">
                    <strong>{item.title}</strong>
                    <small>
                      <Eye size={13} /> {faNumber(item.views)} بازدید
                    </small>
                  </span>
                  <ArrowUpRight size={15} className="tn-popular-row__arrow" />
                </Link>
              ))
            ) : (
              <EmptyState text="هنوز ویدیویی منتشر نشده است." />
            )}
          </section>

          <section className="tn-panel tn-panel--contacts">
            <div className="tn-panel__heading">
              <div>
                <span className="tn-panel__kicker">پیگیری</span>
                <h2>
                  <MessageSquare size={17} /> پیام‌های تازه
                </h2>
              </div>
              <Link href="/admin/contacts" className="tn-text-link">
                همه
              </Link>
            </div>
            {newContacts.length ? (
              newContacts.map((contact) => (
                <Link href="/admin/contacts" key={contact.id} className="tn-contact-row">
                  <span>
                    <strong>{contact.subject}</strong>
                    <small>
                      {contact.name} · {formatTime(contact.createdAt)}
                    </small>
                  </span>
                  <ArrowLeft size={14} />
                </Link>
              ))
            ) : (
              <EmptyState text="پیام تازه‌ای ندارید." />
            )}
          </section>

          <div className="tn-dashboard__footer-note">
            <PenLine size={15} /> انتشار و زمان‌بندی محتوا از بخش خبرها و ویدیوها انجام می‌شود.
          </div>
        </aside>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
  href: string;
}) {
  return (
    <Link href={href} className={`tn-stat-card tn-stat-card--${tone}`}>
      <span className="tn-stat-card__top">
        <span className="tn-stat-card__icon">{icon}</span>
        <ArrowUpLeft size={16} className="tn-stat-card__arrow" />
      </span>
      <span className="tn-stat-card__label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="tn-empty-state">{text}</div>;
}
