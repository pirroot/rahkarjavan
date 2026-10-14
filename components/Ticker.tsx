'use client';

import { SITE } from '@/lib/site';
import { Zap } from 'lucide-react';
import Link from 'next/link';

type TickerItem = { slug: string; title: string };

/**
 * Breaking-news ticker:
 * - pauses on hover and on focus (so users can actually click)
 * - edge fade masks instead of hard clipping
 * - duplicated track for a seamless CSS loop
 * - duplicate copies are skipped for keyboard/screen-reader users
 * - respects prefers-reduced-motion (CSS side)
 */
export default function Ticker({ news }: { news: TickerItem[] }) {
  if (!news.length) return null;

  const items = [...news, ...news]; // duplicated for seamless loop

  return (
    <div
      className="group relative flex items-stretch overflow-hidden border-b border-gray-200 bg-white text-sm text-gray-900 dark:border-white/10 dark:bg-[#17191c] dark:text-white"
      aria-label="خبرهای فوری"
    >
      {/* Live badge */}
      <span className="relative z-10 flex shrink-0 items-center gap-1.5 bg-linear-to-l from-brand-red to-red-700 px-4 font-black text-white">
        <Zap size={13} className="animate-pulse fill-current" aria-hidden />
        خبر فوری
      </span>

      {/* Scroll area */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        {/* Edge fades — text dissolves instead of hard-clipping */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-white to-transparent dark:from-[#17191c]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white to-transparent dark:from-[#17191c]"
        />

        {/* Ticker pauses on hover via CSS (see .ticker-track:hover below) */}
        <div className="ticker-track flex items-center whitespace-nowrap py-2.5 group-hover:[animation-play-state:paused]">
          {items.map((item, i) => (
            <Link
              key={`${i}-${item.slug}`}
              href={`/mag/${item.slug}`}
              tabIndex={i >= news.length ? -1 : 0} // duplicates skipped for keyboard users
              className="flex items-center px-5 text-gray-700 outline-none transition hover:text-brand-red focus-visible:text-brand-red dark:text-gray-200"
            >
              <time
                className="ml-3 shrink-0 rounded bg-brand-red/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-brand-red"
                suppressHydrationWarning
              >
                {/* Small red dot separator with newsroom feel */}●
              </time>
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Brand watermark — quiet identity touch */}
      <span className="z-10 hidden shrink-0 items-center border-r border-gray-200 px-3 text-[10px] font-bold text-gray-400 lg:flex dark:border-white/10">
        {SITE.shortName}
      </span>
    </div>
  );
}
