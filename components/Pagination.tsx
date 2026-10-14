import Link from 'next/link';

type Props = {
  page: number;
  pages: number;
  basePath: string; // e.g. "/mag" or "/category/siasat"
};

/**
 * Link-based pagination — every page is a real <Link> so Google
 * can crawl page 2, 3, ... without JavaScript. No buttons, no fetch.
 */
export default function Pagination({ page, pages, basePath }: Props) {
  if (pages <= 1) return null;

  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  // Compact layout: 1 … 4 5 6 … 12
  const numbers = new Set<number>([1, pages, page - 1, page, page + 1]);
  const list = [...numbers].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  const items: (number | 'gap')[] = [];
  let prev = 0;
  for (const n of list) {
    if (n - prev > 1) items.push('gap');
    items.push(n);
    prev = n;
  }

  const cls =
    'grid min-w-10 place-items-center rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition hover:border-brand-red hover:text-brand-red dark:border-white/15';

  return (
    <nav aria-label="صفحه‌بندی" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={cls}>
          قبلی
        </Link>
      )}

      {items.map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400">
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className="grid min-w-10 place-items-center rounded-lg bg-brand-red px-3 py-2.5 text-sm font-bold text-white"
          >
            {item.toLocaleString('fa-IR')}
          </span>
        ) : (
          <Link key={item} href={href(item)} className={cls}>
            {item.toLocaleString('fa-IR')}
          </Link>
        )
      )}

      {page < pages && (
        <Link href={href(page + 1)} rel="next" className={cls}>
          بعدی
        </Link>
      )}
    </nav>
  );
}
