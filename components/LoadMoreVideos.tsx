'use client';

import VideoCard from '@/components/VideoCard';
import type { MediaItem } from '@/lib/data';
import { useEffect, useState } from 'react';

type Props = {
  initialItems: MediaItem[];
  startPage: number;
  hasMoreInitial: boolean;
};

// API /api/videos returns ready-made MediaItem[] — no client-side mapping
export default function LoadMoreVideos({ initialItems, startPage, hasMoreInitial }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [page, setPage] = useState(startPage);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If the user lands on ?page=3, show everything up to 3 right away
  useEffect(() => {
    if (startPage <= 1) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/videos?page=1&limit=${startPage * 12}`);
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setItems(data.items as MediaItem[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startPage]);

  async function loadMore() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/videos?page=${page + 1}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'خطا');
      setItems((prev) => {
        const seen = new Set(prev.map((v) => v.slug));
        return [...prev, ...(data.items as MediaItem[]).filter((v) => !seen.has(v.slug))];
      });
      setPage(data.page);
      setHasMore(data.hasMore);
      if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
    } catch {
      setError('دریافت ویدیوها ناموفق بود؛ دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <VideoCard key={item.slug} item={item} />
        ))}
      </section>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-brand-red/30 bg-brand-red/10 p-3 text-center text-sm text-brand-red"
        >
          {error}
        </p>
      )}

      {hasMore ? (
        <div className="mt-10 text-center">
          <button
            onClick={() => void loadMore()}
            disabled={loading}
            className="rounded-full bg-brand-red px-8 py-3.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'در حال دریافت…' : 'ویدیوهای بیشتر'}
          </button>
        </div>
      ) : (
        items.length > 0 && (
          <p className="mt-10 text-center text-sm text-gray-500">همهٔ ویدیوها نمایش داده شد ✅</p>
        )
      )}
    </>
  );
}
