import ArticleCard from '@/components/ArticleCard';
import VideoCard from '@/components/VideoCard';
import { searchContent } from '@/lib/data';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Search results must never be indexed — classic SEO hygiene
export const metadata: Metadata = {
  title: 'جست‌وجو',
  robots: { index: false, follow: true },
};

type PageProps = { searchParams: Promise<{ q?: string | string[] }> };

// Clickable suggestions for the empty state — keeps users moving
const suggestions = ['مصاحبه', 'گزارش ویژه', 'اقتصاد', 'فرهنگ', 'سینما'];

export default async function SearchPage({ searchParams }: PageProps) {
  const queryValue = (await searchParams).q;
  const query =
    (Array.isArray(queryValue) ? queryValue[0] : queryValue)?.trim().slice(0, 100) ?? '';

  const results = query ? await searchContent(query) : { articles: [], videos: [] };

  const total = results.articles.length + results.videos.length;

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-black">جست‌وجو</h1>
        <form action="/search" role="search" className="mt-6 flex max-w-2xl gap-2">
          <label className="sr-only" htmlFor="query">
            عبارت جست‌وجو
          </label>
          <input
            id="query"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="عنوان خبر یا ویدیو…"
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 dark:border-white/15 dark:bg-white/5"
          />
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700">
            <Search size={16} aria-hidden />
            جست‌وجو
          </button>
        </form>
      </header>

      {query && (
        <p className="mt-8 text-sm text-gray-500">
          {total > 0 ? (
            <>
              <span className="font-bold text-gray-900 dark:text-white">
                {total.toLocaleString('fa-IR')}
              </span>{' '}
              نتیجه برای «{query}»
            </>
          ) : (
            <>نتیجه‌ای برای «{query}» پیدا نشد.</>
          )}
        </p>
      )}

      {total > 0 ? (
        <div className="mt-5">
          {/* Videos first — this is a video-first platform */}
          {results.videos.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
                <span className="h-6 w-1.5 rounded-full bg-brand-red" />
                ویدیوها{' '}
                <span className="text-sm font-normal text-gray-400">
                  ({results.videos.length.toLocaleString('fa-IR')})
                </span>
              </h2>
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.videos.map((video) => (
                  <VideoCard key={`video-${video.slug}`} item={video} />
                ))}
              </div>
            </section>
          )}

          {results.articles.length > 0 && (
            <section>
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
                <span className="h-6 w-1.5 rounded-full bg-brand-red" />
                مطالب مجله{' '}
                <span className="text-sm font-normal text-gray-400">
                  ({results.articles.length.toLocaleString('fa-IR')})
                </span>
              </h2>
              <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {results.articles.map((article) => (
                  <ArticleCard key={`article-${article.slug}`} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-10 border-y border-gray-200 py-14 text-center dark:border-white/10">
          <Search size={32} className="mx-auto text-gray-300 dark:text-gray-600" aria-hidden />
          <p className="mt-4 font-bold">
            {query ? 'نتیجه‌ای برای این عبارت پیدا نشد.' : 'دنبال چی می‌گردی؟'}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {query
              ? 'املای عبارت را بررسی کن یا با کلمه‌های کوتاه‌تر امتحان کن.'
              : 'عنوان خبر یا ویدیوی موردنظرت را بنویس.'}
          </p>

          {/* Give empty-state users somewhere to click */}
          {!query && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold transition hover:-translate-y-0.5 hover:border-brand-red hover:text-brand-red dark:border-white/15"
                >
                  {term}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
