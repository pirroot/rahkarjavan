import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';
import Reveal from '@/components/Reveal';
import { getCategories, getPublishedArticlesPage } from '@/lib/data';
import { SITE } from '@/lib/site';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 60;

const PER_PAGE = 12;

type PageProps = { searchParams: Promise<{ page?: string }> };

// Per-page metadata: unique title + canonical for every page of the list
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);
  return {
    title: page > 1 ? `مجله — صفحه ${page.toLocaleString('fa-IR')}` : 'مجله',
    description: `خبرها، تحلیل‌ها و روایت‌های تازه در مجله ${SITE.shortName}.`,
    alternates: {
      canonical: page > 1 ? `/mag?page=${page}` : '/mag',
    },
  };
}

export default async function MagazinePage({ searchParams }: PageProps) {
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);

  const [{ items: articles, pages }, categories] = await Promise.all([
    getPublishedArticlesPage(page, PER_PAGE),
    getCategories(),
  ]);

  // Bogus ?page= values → 404 instead of a thin empty page (SEO hygiene)
  if (page > pages) notFound();

  // Featured story only on the first page — it is not a list item there
  const featured = page === 1 ? articles[0] : undefined;
  const rest = featured ? articles.slice(1) : articles;

  return (
    <main className="magazine-page mx-auto min-h-[70vh] max-w-7xl px-4 py-10">
      <header className="magazine-heading mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-gray-200 pb-6 dark:border-white/10">
        <div className="animate-fade-up">
          <p className="mb-2 text-xs font-bold text-brand-red">{SITE.shortName} / مجله</p>
          <h1 className="text-3xl font-black">مجله</h1>
        </div>
        <nav
          aria-label="دسته‌بندی خبرها"
          className="no-scrollbar flex max-w-full py-2 gap-2 overflow-x-auto pb-1 animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          {categories
            .filter((category) => category.section !== 'video')
            .map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-red hover:bg-brand-red/5 hover:text-brand-red dark:border-white/15"
              >
                {category.name}
              </Link>
            ))}
        </nav>
      </header>

      {featured ? (
        <Reveal>
          <Link
            href={`/mag/${featured.slug}`}
            className="featured-story group mb-10 grid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/3 dark:shadow-none dark:hover:border-brand-red/30 md:grid-cols-2"
          >
            <div className="relative aspect-16/10 min-h-56 overflow-hidden md:aspect-auto">
              <Image
                src={featured.thumb}
                alt={featured.title}
                fill
                loading="eager"
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 transition duration-500 group-hover:opacity-100"
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:p-10">
              <span className="text-sm font-bold text-brand-red">{featured.category}</span>
              <h2 className="mt-3 text-2xl font-black leading-10 transition-colors duration-300 group-hover:text-brand-red md:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 line-clamp-3 leading-8 text-gray-600 dark:text-gray-300">
                {featured.excerpt}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {featured.author ?? `تحریریه ${SITE.shortName}`} · {featured.date}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red opacity-0 transition-all duration-300 group-hover:opacity-100">
                  ادامه مطلب
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:-translate-x-1"
                  >
                    ←
                  </span>
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      ) : (
        page === 1 && (
          <div className="border-y border-gray-200 py-16 text-center dark:border-white/10">
            <p className="text-4xl" aria-hidden>
              📖
            </p>
            <p className="mt-4 font-bold">هنوز مطلبی منتشر نشده است.</p>
            <p className="mt-2 text-sm text-gray-500">
              به‌زودی اولین مطالب مجله اینجا قرار می‌گیرد.
            </p>
          </div>
        )
      )}

      {rest.length > 0 && (
        <section className="magazine-grid grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article, index) => (
            <Reveal key={article.slug} delay={(index % 3) * 90}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </section>
      )}

      {/* Real links — Google crawls every page, users can share ?page=3 */}
      <Pagination page={page} pages={pages} basePath="/mag" />
    </main>
  );
}
