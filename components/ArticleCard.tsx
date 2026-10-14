import type { Article } from '@/lib/data';
import { CalendarDays } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card group relative">
      {/* Overlay link — same pattern as VideoCard */}
      <Link
        href={`/mag/${article.slug}`}
        aria-label={article.title}
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">{article.title}</span>
      </Link>

      {/* Cover — newspaper style: clean frame, no shade overload */}
      <div className="relative mb-3 aspect-16/10 overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm transition-shadow duration-300 group-hover:shadow-lg dark:border-white/10 dark:bg-white/5">
        <Image
          src={article.thumb}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 19vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
        />
        {/* Thin red accent bar slides in on hover — editorial signature */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1 origin-right scale-x-0 bg-brand-red transition-transform duration-300 group-hover:scale-x-100"
        />
        {/* Category chip — top-right, same rhythm as VideoCard */}
        <span className="absolute right-2.5 top-2.5 rounded-md bg-brand-red/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
          {article.category}
        </span>
      </div>

      {/* Headline */}
      <h2 className="line-clamp-2 text-base font-bold leading-7 transition-colors duration-300 group-hover:text-brand-red">
        {article.title}
      </h2>

      {/* Excerpt — only the hook */}
      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
        {article.excerpt}
      </p>

      {/* Meta — single clean row */}
      <p className="mt-2.5 flex items-center gap-1.5 border-t border-gray-100 pt-2.5 text-[11px] text-gray-500 dark:border-white/5 dark:text-gray-400">
        <CalendarDays size={12} className="shrink-0 text-brand-red" aria-hidden />
        <span className="truncate">{article.author}</span>
        <span className="text-brand-red" aria-hidden>
          ·
        </span>
        {article.date}
      </p>
    </article>
  );
}
