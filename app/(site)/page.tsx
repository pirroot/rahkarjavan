import Hero from '@/components/Hero';
import HomeLatest from '@/components/HomeLatest';
import Ticker from '@/components/Ticker';
import Trending from '@/components/Trending';
import VideoGridSection from '@/components/VideoGridSection';
import { getHomePageData } from '@/lib/data';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { featured, sideVideos, rows, trending, breaking, latest, latestHasMore } =
    await getHomePageData();

  return (
    <main className="home-page">
      <Ticker news={breaking} />

      <div className="home-content mx-auto max-w-7xl px-4 py-7">
        {/* Hero — full width, no sidebar anymore */}
        <Hero featured={featured} sideVideos={sideVideos} />

        {/* Dense category grids — the reference layout */}
        {rows.map((row) => (
          <VideoGridSection
            key={row.category}
            title={row.category}
            items={row.items.slice(0, 10)}
            href={`/video`}
          />
        ))}

        <Trending items={trending} />

        {/* Magazine teaser — the second half of the site */}

        {/* Infinite scroll — keeps the homepage endless like the reference */}
        <HomeLatest initial={latest} startPage={1} hasMore={latestHasMore} />

        <p className="mt-10 text-center text-xs text-gray-400">{SITE.name} — رسانه تصویری و مجله</p>
      </div>
    </main>
  );
}
