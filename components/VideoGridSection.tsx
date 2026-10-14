import Reveal from '@/components/Reveal';
import VideoCard from '@/components/VideoCard';
import type { MediaItem } from '@/lib/data';
import Link from 'next/link';

export default function VideoGridSection({
  title,
  items,
  href,
}: {
  title: string;
  items: MediaItem[];
  href: string;
}) {
  if (!items.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-6 w-1.5 rounded-full bg-brand-red" />
        <h2 className="text-lg font-black sm:text-xl">{title}</h2>
        <Link
          href={href}
          className="mr-auto text-xs font-bold text-brand-red transition hover:text-red-400"
        >
          مشاهده همه <span aria-hidden>←</span>
        </Link>
      </div>

      {/* Dense grid like the reference: 5 across on desktop, 2 on mobile */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, i) => (
          <Reveal key={item.slug} delay={(i % 5) * 60}>
            <VideoCard item={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
