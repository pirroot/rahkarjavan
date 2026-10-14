import ArticleCard from '@/components/ArticleCard';
import ArticleContent from '@/components/ArticleContent';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import CommentSection from '@/components/CommentSection';
import ViewTracker from '@/components/ViewTracker';
import { getSession, isAdmin } from '@/lib/auth';
import { getArticleBySlug } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { SITE } from '@/lib/site';
import { normalizeSlug } from '@/lib/slug';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

const absoluteUrl = (url: string) => (url.startsWith('http') ? url : `${SITE.url}${url}`);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticleBySlug(normalizeSlug((await params).slug));
  if (!article) return { title: 'خبر پیدا نشد' };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/mag/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      images: [absoluteUrl(article.thumb)],
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(normalizeSlug(slug));
  const session = await getSession();
  if (!article) notFound();

  // Same-category related — real relevance, not "latest 5"
  const [related, comments] = await Promise.all([
    prisma.news
      .findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          categoryId: article.categoryId,
          slug: { not: article.slug },
        },
        include: {
          category: { select: { name: true, slug: true } },
          cover: { select: { url: true } },
          author: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      })
      .catch(() => []),
    prisma.comment
      .findMany({
        where: { newsId: article.id },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
        take: 100,
      })
      .catch(() => []),
  ]);

  const commentItems = comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      comment.createdAt
    ),
    author: comment.author,
    canDelete: isAdmin(session) || comment.authorId === session?.id,
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: [absoluteUrl(article.thumb)],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { '@type': 'Organization', name: article.author ?? `تحریریه ${SITE.shortName}` },
    publisher: { '@id': `${SITE.url}/#org` },
    mainEntityOfPage: `${SITE.url}/mag/${article.slug}`,
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <ViewTracker collection="articles" slug={article.slug} />

      <BreadcrumbJsonLd
        crumbs={[
          { name: 'خانه', href: '/' },
          { name: 'مجله', href: '/mag' },
          { name: article.category, href: `/category/${article.categorySlug}` },
        ]}
      />

      <nav className="mb-5 text-xs text-gray-500" aria-label="مسیر صفحه">
        <Link href="/">خانه</Link>
        <span className="mx-2">/</span>
        <Link href="/mag">مجله</Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${article.categorySlug}`}>{article.category}</Link>
      </nav>

      <article className="mx-auto max-w-4xl">
        <Link
          href={`/category/${article.categorySlug}`}
          className="inline-block rounded-full bg-brand-red/10 px-3 py-1.5 text-xs font-bold text-brand-red transition hover:bg-brand-red/20"
        >
          {article.category}
        </Link>

        <h1 className="mt-4 text-2xl font-black leading-[1.7] md:text-4xl md:leading-[1.6]">
          {article.title}
        </h1>

        <p className="mt-4 border-r-4 border-brand-red pr-4 text-base font-bold leading-8 text-gray-600 dark:text-gray-300">
          {article.excerpt}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
          <span className="font-bold text-gray-700 dark:text-gray-300">
            {article.author ?? `تحریریه ${SITE.shortName}`}
          </span>
          <span>{article.date}</span>
          <span>{article.views} بازدید</span>
        </div>

        <div className="relative mt-6 aspect-16/9 overflow-hidden rounded-2xl bg-gray-200 dark:bg-white/5">
          <Image
            src={article.thumb}
            alt={article.title}
            fill
            loading="eager"
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        {/* ⭐ Real rich content — headings, images, lists from TipTap */}
        <div className="mt-8">
          <ArticleContent value={article.content} />
        </div>

        <CommentSection
          newsId={article.id}
          initialComments={commentItems}
          signedIn={Boolean(session)}
        />
      </article>

      {related.length > 0 && (
        <section className="mt-14 border-t border-gray-200 pt-7 dark:border-white/10">
          <div className="mb-5 flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-brand-red" />
            <h2 className="text-xl font-black">خبرهای مرتبط</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((row) => (
              <ArticleCard
                key={row.slug}
                article={{
                  categoryId: row.categoryId,
                  id: row.id,
                  slug: row.slug,
                  title: row.title,
                  excerpt: row.excerpt,
                  content: '',
                  thumb: row.cover?.url ?? row.coverUrl ?? `/placeholder.png`,
                  category: row.category?.name ?? '',
                  categorySlug: row.category?.slug ?? '',
                  author: row.authorName ?? row.author?.name ?? '',
                  views: row.views.toLocaleString('fa-IR'),
                  date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
                    row.publishedAt
                  ),
                  publishedAt: row.publishedAt.toISOString(),
                }}
              />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
    </main>
  );
}
