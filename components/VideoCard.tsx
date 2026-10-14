import type { MediaItem } from '@/lib/data';
import { Eye, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function VideoCard({ item }: { item: MediaItem }) {
  return (
    <article className="video-card group relative">
      {/* Overlay link: whole card clickable, text stays selectable */}
      <Link href={`/video/${item.slug}`} aria-label={item.title} className="absolute inset-0 z-10">
        <span className="sr-only">{item.title}</span>
      </Link>

      {/* Poster — cinematic, info ON the image */}
      <div className="relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm transition-shadow duration-300 group-hover:shadow-lg dark:border-white/10 dark:bg-brand-card">
        <Image
          src={item.thumb}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 19vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
        />

        {/* Cinematic shade — bottom heavy, deepens on hover */}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/80"
        />

        {/* Play button — appears on hover/focus */}
        <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 scale-75 place-items-center rounded-full border border-white/40 bg-black/45 text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100">
          <Play size={18} fill="currentColor" aria-hidden />
        </span>

        {/* Duration — bottom-left, tabular so it doesn't jiggle */}
        <span className="absolute bottom-2 left-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
          {item.duration}
        </span>

        {/* Live badge replaces duration */}
        {item.live && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-brand-red px-1.5 py-0.5 text-[10px] font-black text-white">
            <span className="size-1 animate-pulse rounded-full bg-white" aria-hidden /> زنده
          </span>
        )}

        {/* Category — top-right chip */}
        {item.category && (
          <span className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {item.category}
          </span>
        )}
      </div>

      {/* Text — below, YouTube-style rhythm */}
      <h3 className="mt-2.5 line-clamp-2 text-sm font-bold leading-6 transition-colors duration-300 group-hover:text-brand-red">
        {item.title}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        <Eye size={11} aria-hidden />
        {item.views} بازدید
        <span className="text-brand-red" aria-hidden>
          ·
        </span>
        {item.date}
      </p>
    </article>
  );
}
