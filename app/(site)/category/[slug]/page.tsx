import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';
import VideoCard from '@/components/VideoCard';
import { mapArticle, mapVideo } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { SITE } from '@/lib/site';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PER_PAGE = 12;

async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, section: true },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'دسته‌بندی پیدا نشد' };

  // NOTE: needs dynamic page number — we accept the same static title for all
  // pages of a category; canonical per page is set in the page itself
  return {
    title: category.name,
    description: `تازه‌ترین مطالب دسته «${category.name}» در ${SITE.shortName}.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title: category.name, type: 'website', locale: 'fa_IR' },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);

  const category = await getCategory(slug);
  if (!category) notFound();

  const publishedWhere = {
    status: 'PUBLISHED' as const,
    publishedAt: { lte: new Date() },
    categoryId: category.id,
  };

  const [videos, articleRows, articleTotal] = await Promise.all([
    prisma.video.findMany({
      where: publishedWhere,
      include: {
        category: { select: { name: true, slug: true } },
        thumbnail: { select: { url: true } },
        videoFile: { select: { url: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 12,
    }),
    prisma.news.findMany({
      where: publishedWhere,
      include: {
        category: { select: { name: true, slug: true } },
        cover: { select: { url: true } },
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.news.count({ where: publishedWhere }),
  ]);

  const pages = Math.max(1, Math.ceil(articleTotal / PER_PAGE));

  // Out-of-range ?page= → 404 (no thin empty pages for crawlers)
  if (page > pages && page !== 1) notFound();

  const videoItems = videos.map(mapVideo);
  const articleItems = articleRows.map(mapArticle);
  const hasVideos = videoItems.length > 0;
  const hasArticles = articleItems.length > 0;

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10">
      <header className="mb-8 border-b border-gray-200 pb-6 dark:border-white/10">
        <p className="mb-2 text-xs font-bold text-brand-red">{SITE.shortName} / دسته‌بندی</p>
        <h1 className="text-3xl font-black">{category.name}</h1>
      </header>

      {!hasVideos && !hasArticles && (
        <div className="border-y border-gray-200 py-16 text-center dark:border-white/10">
          <p className="text-4xl" aria-hidden>
            🗂️
          </p>
          <p className="mt-4 font-bold">هنوز مطلبی در این دسته منتشر نشده است.</p>
        </div>
      )}

      {hasVideos && (
        <section className="mb-12">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
            <span className="h-6 w-1.5 rounded-full bg-brand-red" />
            ویدیوها
          </h2>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videoItems.map((item) => (
              <VideoCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      )}

      {hasArticles && (
        <section>
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
            <span className="h-6 w-1.5 rounded-full bg-brand-red" />
            مطالب
          </h2>
          <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {articleItems.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>

          <Pagination page={page} pages={pages} basePath={`/category/${category.slug}`} />
        </section>
      )}
    </main>
  );
}
