import Link from 'next/link';

type TrendingItem = { slug: string; title: string; views: string };

export default function Trending({ items }: { items: TrendingItem[] }) {
  if (!items.length) return null;

  return (
    <section className="mt-12 border-t-2 border-brand-red pt-5">
      <h2 className="mb-5 text-lg font-black sm:text-xl">پربازدیدترین ویدیوها</h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, i) => (
          <li key={item.slug}>
            <Link
              href={`/video/${item.slug}`}
              className="group flex h-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-brand-red/40 hover:shadow-md dark:border-white/10 dark:bg-white/[0.035]"
            >
              <span className="text-3xl font-black leading-9 text-gray-300 transition group-hover:text-brand-red dark:text-gray-600">
                {(i + 1).toLocaleString('fa-IR')}
              </span>
              <span className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-bold leading-6 transition group-hover:text-brand-red">
                  {item.title}
                </h3>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {item.views} بازدید
                </p>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
