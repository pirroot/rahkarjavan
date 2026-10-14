import ArticleCard from '@/components/ArticleCard';
import VideoCard from '@/components/VideoCard';
import { getCategoryPageData } from '@/lib/data';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getCategoryPageData((await params).slug);
  return {
    title: data?.category ?? 'دسته‌بندی پیدا نشد',
    description: `آخرین خبرها و ویدیوهای ${data?.category ?? ''} در راهکار جوان.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const data = await getCategoryPageData((await params).slug);
  if (!data) notFound();
  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10">
      <p className="mb-2 text-xs font-bold text-brand-red">دسته‌بندی</p>
      <h1 className="mb-8 text-3xl font-black">{data.category}</h1>
      {data.articles.length + data.videos.length === 0 ? (
        <p className="border-y border-gray-200 py-12 text-center text-gray-500 dark:border-white/10">
          هنوز محتوایی در این دسته منتشر نشده است.
        </p>
      ) : (
        <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {data.articles.map((article) => (
            <ArticleCard key={`article-${article.slug}`} article={article} />
          ))}
          {data.videos.map((video) => (
            <VideoCard key={`video-${video.slug}`} item={video} />
          ))}
        </div>
      )}
    </main>
  );
}
