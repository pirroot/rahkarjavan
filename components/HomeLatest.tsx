'use client';

import VideoCard from '@/components/VideoCard';
import type { MediaItem } from '@/lib/data';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  initial: MediaItem[];
  startPage: number;
  hasMore: boolean;
};

/**
 * Infinite scroll for the homepage:
 * - IntersectionObserver sentinel auto-loads the next batch
 * - Manual button stays as the accessible fallback
 * - Dedupes by slug so nothing appears twice
 */
export default function HomeLatest({ initial, startPage, hasMore: initialHasMore }: Props) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(startPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMore) return;
    busyRef.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/videos?page=${page + 1}&limit=12`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setItems((prev) => {
        const seen = new Set(prev.map((v) => v.slug));
        const fresh = (data.items as MediaItem[]).filter((v) => !seen.has(v.slug));
        return [...prev, ...fresh];
      });
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch {
      setFailed(true); // button stays clickable for a manual retry
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, [page, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: '600px' } // start fetching before the user reaches the end
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, hasMore]);

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-6 w-1.5 rounded-full bg-brand-red" />
        <h2 className="text-lg font-black sm:text-xl">تازه‌ترین ویدیوها</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <VideoCard key={item.slug} item={item} />
        ))}
      </div>

      {loading && (
        <div className="mt-8 flex justify-center">
          <span className="size-8 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red" />
        </div>
      )}

      {!loading && hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => void loadMore()}
            className="rounded-full border border-brand-red px-8 py-3 text-sm font-bold text-brand-red transition hover:bg-brand-red hover:text-white"
          >
            {failed ? 'تلاش دوباره' : 'ویدیوهای بیشتر'}
          </button>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">همهٔ ویدیوها نمایش داده شد ✅</p>
      )}

      {/* Invisible sentinel that triggers auto-load */}
      <div ref={sentinelRef} aria-hidden className="h-1" />
    </section>
  );
}
