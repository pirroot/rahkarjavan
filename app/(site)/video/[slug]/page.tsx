import CommentSection from '@/components/CommentSection';
import MediaPlayer from '@/components/MediaPlayer';
import VideoCard from '@/components/VideoCard';
import ViewTracker from '@/components/ViewTracker';
import { getSession, isAdmin } from '@/lib/auth';
import { getPublishedVideos, getVideoBySlug } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { SITE } from '@/lib/site';
import { normalizeSlug } from '@/lib/slug';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

// Persian digits → English so Number() never produces NaN
const toEnDigits = (value: string) =>
  value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

function toIsoDuration(duration: string) {
  const [m = '0', s = '0'] = toEnDigits(duration).split(':');
  return `PT${Number(m) || 0}M${Number(s) || 0}S`;
}

// JSON-LD needs absolute URLs — Google rejects relative ones
const absoluteUrl = (url: string) => (url.startsWith('http') ? url : `${SITE.url}${url}`);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const video = await getVideoBySlug(normalizeSlug((await params).slug));
  if (!video) return { title: 'ویدیو پیدا نشد' };
  return {
    title: video.title,
    description: video.description,
    alternates: { canonical: `/video/${video.slug}` },
    openGraph: {
      type: 'video.other',
      title: video.title,
      description: video.description,
      images: [absoluteUrl(video.thumb)],
      videos: video.videoUrl ? [absoluteUrl(video.videoUrl)] : undefined,
    },
  };
}

export default async function VideoPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();
  const [video, allVideos] = await Promise.all([
    getVideoBySlug(normalizeSlug(slug)),
    getPublishedVideos(20),
  ]);
  if (!video) notFound();

  const comments = await prisma.comment
    .findMany({
      where: { videoId: video.id },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })
    .catch(() => []);

  const commentItems = comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      comment.createdAt
    ),
    author: comment.author,
    canDelete: isAdmin(session) || comment.authorId === session?.id,
  }));

  // Up-next: same category first, then the rest
  const sameCategory = allVideos.filter(
    (v) => v.slug !== video.slug && v.categorySlug === video.categorySlug
  );
  const others = allVideos.filter(
    (v) => v.slug !== video.slug && v.categorySlug !== video.categorySlug
  );
  const nextVideos = [...sameCategory, ...others].slice(0, 8);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: [absoluteUrl(video.thumb)],
    uploadDate: video.publishedAt,
    duration: toIsoDuration(video.duration),
    ...(video.videoUrl ? { contentUrl: absoluteUrl(video.videoUrl) } : {}),
    publisher: { '@id': `${SITE.url}/#org` },
  };

  return (
    <main>
      <br />
      <ViewTracker collection="videos" slug={video.slug} />

      <nav
        className="mx-auto mb-5 max-w-7xl px-4 text-xs text-gray-500 sm:px-6"
        aria-label="مسیر صفحه"
      >
        <Link href="/">خانه</Link>
        <span className="mx-2">/</span>
        {video.categorySlug ? (
          <Link href={`/category/${video.categorySlug}`}>{video.category}</Link>
        ) : (
          <span>{video.category}</span>
        )}
      </nav>

      {/* ⭐ Player — full-bleed on mobile, wider column on desktop */}
      <div className="mx-auto max-w-[1400px] px-0 sm:px-6">
        <MediaPlayer
          title={video.title}
          thumb={video.thumb}
          videoUrl={video.videoUrl}
          duration={video.duration}
          category={video.category}
          live={video.live}
          className="sm:rounded-2xl"
        />
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-9 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <Link
              href={video.categorySlug ? `/category/${video.categorySlug}` : '/mag'}
              className="rounded-full bg-brand-red/10 px-3 py-1.5 font-bold text-brand-red transition hover:bg-brand-red/20"
            >
              {video.category}
            </Link>
            <span>{video.views} بازدید</span>
            <span>{video.date}</span>
          </div>

          <h1 className="mt-3 text-2xl font-black leading-10 md:text-3xl">{video.title}</h1>

          <p className="mt-4 whitespace-pre-line text-base leading-9 text-gray-600 dark:text-gray-300">
            {video.description}
          </p>

          <CommentSection
            videoId={video.id}
            initialComments={commentItems}
            signedIn={Boolean(session)}
          />
        </article>

        <aside className="h-fit border-t-2 border-brand-red pt-4 lg:sticky lg:top-24">
          <h2 className="mb-5 text-lg font-black">ویدیوهای بعدی</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {nextVideos.map((item) => (
              <VideoCard key={item.slug} item={item} />
            ))}
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
    </main>
  );
}
