import { getCategories, getPublishedArticles, getPublishedVideos } from '@/lib/data';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const [articles, videos, categories] = await Promise.all([
    getPublishedArticles(500),
    getPublishedVideos(500),
    getCategories(),
  ]);

  return [
    ...['/', '/mag', '/about', '/contact'].map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: 'daily' as const,
      priority: path === '/' ? 1 : 0.7,
    })),
    ...articles.map((article) => ({
      url: `${siteUrl}/mag/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...videos.map((video) => ({
      url: `${siteUrl}/video/${video.slug}`,
      lastModified: video.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: `${siteUrl}/category/${category.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  ];
}
