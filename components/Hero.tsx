import type { HomePageData } from '@/lib/data';
import { Clock, Eye, Flame } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import MediaPlayer from './MediaPlayer';

type Featured = NonNullable<HomePageData['featured']>;

export default function Hero({
  featured,
  sideVideos,
}: {
  featured?: Featured | null;
  sideVideos: HomePageData['sideVideos'];
}) {
  if (!featured) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-white/15">
        <p className="text-4xl" aria-hidden>
          🎬
        </p>
        <h1 className="mt-4 text-2xl font-black">رسانه تصویری راهکار جوان</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          به‌زودی ویدیوهای تازه منتشر می‌شوند.
        </p>
      </section>
    );
  }

  return (
    <section
      className="home-hero grid items-start gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(300px,0.8fr)]"
      aria-label="ویدیوی منتخب و پیشنهاد سردبیر"
    >
      {/* ---------- Featured — cinematic ---------- */}
      <article className="home-feature min-w-0">
        <div className="relative">
          {/* Lazy player — zero video bytes until play */}
          <MediaPlayer
            title={featured.title}
            thumb={featured.thumb}
            videoUrl={featured.videoUrl}
            duration={featured.duration}
            category={featured.category}
            live={featured.isLive}
            className="rounded-2xl"
          />

          {/* Editor's-pick badge — sits on the player, top-right */}
          <span className="pointer-events-none absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-brand-red px-3.5 py-1.5 text-xs font-black text-white shadow-lg shadow-brand-red/30">
            <Flame size={13} className="fill-current" aria-hidden />
            ویژه
          </span>
        </div>

        {/* Meta row — chips style, newsroom rhythm */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {featured.isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-3 py-1 font-black text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              پخش زنده
            </span>
          )}
          {featured.category && (
            <Link
              href={`/category/${featured.categorySlug}`}
              className="rounded-full bg-brand-red/10 px-3 py-1 font-bold text-brand-red transition hover:bg-brand-red/20"
            >
              {featured.category}
            </Link>
          )}
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock size={12} aria-hidden /> {featured.date}
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Eye size={12} aria-hidden /> {featured.views} بازدید
          </span>
        </div>

        <Link href={`/video/${featured.slug}`} className="group block">
          <h1 className="mt-3 max-w-3xl text-xl font-black leading-9 transition-colors group-hover:text-brand-red sm:text-2xl md:text-[1.7rem] md:leading-[1.9]">
            {featured.title}
          </h1>
        </Link>

        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-7 text-gray-500 dark:text-gray-400">
          {featured.description}
        </p>
      </article>

      {/* ---------- Editor's picks ---------- */}
      <aside className="home-picks min-w-0">
        <header className="mb-3 flex items-center gap-2 border-b-2 border-brand-red pb-3">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-red text-white">
            <Flame size={14} aria-hidden />
          </span>
          <h2 className="text-base font-black">پیشنهاد سردبیر</h2>
        </header>

        <div className="flex flex-col gap-3">
          {sideVideos.map((v, index) => (
            <Link
              key={v.slug}
              href={`/video/${v.slug}`}
              className="group flex gap-3 rounded-xl border border-transparent bg-white p-2 transition duration-300 hover:border-brand-red/40 hover:shadow-md dark:bg-white/[0.035] dark:hover:border-brand-red/40"
            >
              <div className="relative aspect-video w-[38%] shrink-0 overflow-hidden rounded-lg bg-black">
                <Image
                  src={v.thumb}
                  alt={v.title}
                  fill
                  sizes="(max-width: 1024px) 38vw, 16vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                  {v.duration}
                </span>
                {/* Rank number — subtle editorial touch */}
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded bg-brand-red text-[10px] font-black text-white">
                  {(index + 2).toLocaleString('fa-IR')}
                </span>
              </div>

              <div className="min-w-0 self-center py-1">
                <span className="text-[10px] font-bold text-brand-red">{v.category}</span>
                <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-6 transition group-hover:text-brand-red">
                  {v.title}
                </h3>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Eye size={11} aria-hidden /> {v.views} بازدید
                </p>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </section>
  );
}
