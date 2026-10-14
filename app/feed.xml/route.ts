import { prisma } from '@/lib/prisma';
import { SITE } from '@/lib/site';

// Fresh feed without hammering the DB on every request
export const revalidate = 600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const items = await prisma.news
    .findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        category: { section: { in: ['ARTICLE', 'BOTH'] } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 30,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        coverUrl: true,
        cover: { select: { url: true } },
        publishedAt: true,
        authorName: true,
        author: { select: { name: true } },
      },
    })
    .catch(() => []);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>fa-ir</language>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
 ${items
   .map((item) => {
     const cover = item.cover?.url ?? item.coverUrl ?? '';
     const image = cover ? (cover.startsWith('http') ? cover : `${SITE.url}${cover}`) : '';
     return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${SITE.url}/mag/${item.slug}</link>
      <guid isPermaLink="true">${SITE.url}/mag/${item.slug}</guid>
      <description>${escapeXml(item.excerpt)}</description>
      <pubDate>${item.publishedAt.toUTCString()}</pubDate>
      <author>${escapeXml(item.authorName ?? item.author?.name ?? SITE.shortName)}</author>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" length="0"/>` : ''}
    </item>`;
   })
   .join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
