import { prisma } from '@/lib/prisma';

// ---------- Types ----------
export type MediaItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumb: string;
  duration: string;
  category: string;
  categorySlug: string;
  views: string;
  date: string;
  publishedAt: string;
  live?: boolean;
  featured?: boolean;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  thumb: string;
  category: string;
  categorySlug: string;
  author: string;
  views: string;
  date: string;
  publishedAt: string;
  categoryId: string;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  section: 'article' | 'video' | 'both';
};

export type HomePageData = {
  featured: (MediaItem & { isLive: boolean }) | null;
  sideVideos: MediaItem[];
  rows: { category: string; items: MediaItem[] }[];
  trending: { slug: string; title: string; views: string }[];
  breaking: { slug: string; title: string }[];
  latestArticles: Article[];
  latest: MediaItem[];
  latestHasMore: boolean;
};

// ---------- Helpers ----------
const image = (slug: string) => `https://picsum.photos/seed/${slug}/1200/675`;

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value));

const formatNumber = (value: number) => value.toLocaleString('fa-IR');

// IMPORTANT: a function, not a module-level constant — otherwise "new Date()"
// freezes at server start and scheduled publishing stops working
const publishedWhere = () => ({
  status: 'PUBLISHED' as const,
  publishedAt: { lte: new Date() },
});

const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);
let localDatabaseUnavailable = false;

// Dev-only fallback so the site still renders when Docker/DB is down.
// In production the real error is thrown — never fake data on live.
async function withLocalPreview<T>(load: () => Promise<T>, preview: () => T): Promise<T> {
  if (process.env.NODE_ENV !== 'production' && localDatabaseUnavailable) return preview();
  try {
    return await load();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
    localDatabaseUnavailable = true;
    console.warn('[data] DB unavailable — showing local sample content (dev only).');
    return preview();
  }
}

// ---------- Sample content (dev fallback only) ----------
const sampleVideos: MediaItem[] = [
  {
    id: 'video-1',
    slug: 'documentary-cinema-future',
    title: 'گفت‌وگوی اختصاصی با سینماگر پیشرو درباره آینده سینمای مستند',
    description:
      'در این گفت‌وگو از مسیر سینمای مستند، دشواری‌های روایت واقعیت و نقش نسل تازه فیلم‌سازان می‌گوییم.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumb: image('documentary-cinema'),
    duration: '۳۱:۵۲',
    category: 'مصاحبه',
    categorySlug: 'interviews',
    views: '۲۸٬۴۷۲',
    date: '۲۰ آبان ۱۴۰۳',
    publishedAt: '2024-11-10T09:00:00.000Z',
    featured: true,
  },
];

const sampleCategories: CategorySummary[] = [
  { id: 'cat-1', name: 'اقتصاد', slug: 'economy', section: 'both' },
];
const sampleArticles: Article[] = [
  {
    id: 'article-1',
    slug: 'young-people-digital-economy',
    title: 'جوانان و اقتصاد دیجیتال؛ فرصت‌هایی که نباید از دست بروند',
    excerpt:
      'نسل تازه با دسترسی به ابزارهای دیجیتال، مسیرهای جدیدی برای کارآفرینی و حضور در بازارهای جهانی پیش رو دارد.',
    content:
      'اقتصاد دیجیتال فقط به شرکت‌های بزرگ فناوری محدود نیست. کسب‌وکارهای کوچک و گروه‌های جوان هم می‌توانند با شناخت نیازهای واقعی، راه‌حل‌هایی بسازند که در زندگی روزمره اثر بگذارند.\n\nدسترسی به آموزش باکیفیت، اینترنت پایدار و امکان سرمایه‌گذاری، از مهم‌ترین پیش‌نیازهای رشد این حوزه است. گفت‌وگو میان دانشگاه، کسب‌وکار و سیاست‌گذار می‌تواند بخشی از این فاصله را کم کند.',
    thumb: image('article-digital-economy'),
    category: 'اقتصاد',
    categorySlug: 'economy',
    author: 'تحریریه راهکار جوان',
    views: '۱۲٬۴۸۰',
    date: '۲۰ آبان ۱۴۰۳',
    publishedAt: '2024-11-10T08:00:00.000Z',
    categoryId: 'cat-1',
  },
];

// ---------- Mappers ----------
function contentText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(contentText).filter(Boolean).join('\n\n');
  if (!value || typeof value !== 'object') return '';
  const node = value as { text?: unknown; children?: unknown };
  if (typeof node.text === 'string') return node.text;
  return contentText(node.children);
}

export function mapArticle(article: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: unknown;
  coverUrl: string | null;
  cover: { url: string } | null;
  category: { name: string; slug: string };
  authorName: string | null;
  author: { name: string } | null;
  views: number;
  categoryId: string;
  publishedAt: Date;
}): Article {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: contentText(article.content),
    thumb: article.cover?.url ?? article.coverUrl ?? image(article.slug),
    category: article.category.name,
    categorySlug: article.category.slug,
    author: article.authorName ?? article.author?.name ?? 'تحریریه راهکار جوان',
    views: formatNumber(article.views),
    date: formatDate(article.publishedAt),
    publishedAt: article.publishedAt.toISOString(),
    categoryId: article.categoryId,
  };
}

export function mapVideo(video: {
  id: string;
  slug: string;
  title: string;
  description: string;
  videoUrl: string | null;
  videoFile: { url: string } | null;
  thumbnailUrl: string | null;
  thumbnail: { url: string } | null;
  duration: string;
  category: { name: string; slug: string };
  views: number;
  isLive: boolean;
  featured: boolean;
  publishedAt: Date;
}): MediaItem {
  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    description: video.description,
    videoUrl: video.videoFile?.url ?? video.videoUrl ?? undefined,
    thumb: video.thumbnail?.url ?? video.thumbnailUrl ?? image(video.slug),
    duration: video.duration,
    category: video.category.name,
    categorySlug: video.category.slug,
    views: formatNumber(video.views),
    date: formatDate(video.publishedAt),
    publishedAt: video.publishedAt.toISOString(),
    live: video.isLive,
    featured: video.featured,
  };
}

const videoInclude = { category: true, thumbnail: true, videoFile: true } as const;
const articleInclude = { category: true, cover: true, author: { select: { name: true } } } as const;

// ---------- Lists ----------
export async function getPublishedVideos(limit = 24): Promise<MediaItem[]> {
  if (!isDatabaseConfigured) return sampleVideos.slice(0, limit);
  return withLocalPreview(
    async () => {
      const videos = await prisma.video.findMany({
        where: publishedWhere(),
        include: videoInclude,
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
      return videos.map(mapVideo);
    },
    () => sampleVideos.slice(0, limit)
  );
}

export async function getPublishedArticles(limit = 24): Promise<Article[]> {
  if (!isDatabaseConfigured) return sampleArticles.slice(0, limit);
  return withLocalPreview(
    async () => {
      const articles = await prisma.news.findMany({
        where: {
          ...publishedWhere(),
          category: { section: { in: ['ARTICLE', 'BOTH'] as ('ARTICLE' | 'BOTH')[] } },
        },
        include: articleInclude,
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
      return articles.map(mapArticle);
    },
    () => sampleArticles.slice(0, limit)
  );
}

// Paginated latest videos — powers the homepage infinite scroll + /api/videos
export async function getLatestVideosPage(page: number, perPage = 12) {
  const where = {
    ...publishedWhere(),
    category: { section: { in: ['VIDEO', 'BOTH'] as ('VIDEO' | 'BOTH')[] } },
  };

  const load = async () => {
    const [rows, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: videoInclude,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.video.count({ where }),
    ]);
    return {
      items: rows.map(mapVideo),
      total,
      pages: Math.max(1, Math.ceil(total / perPage)),
      hasMore: page * perPage < total,
    };
  };

  const fallback = () => ({
    items: sampleVideos.slice((page - 1) * perPage, page * perPage),
    total: sampleVideos.length,
    pages: 1,
    hasMore: false,
  });

  if (!isDatabaseConfigured) return fallback();
  return withLocalPreview(load, fallback);
}

// Paginated magazine list — link-based pagination (SEO-friendly)
export async function getPublishedArticlesPage(page: number, perPage = 12) {
  const where = {
    ...publishedWhere(),
    category: { section: { in: ['ARTICLE', 'BOTH'] as ('ARTICLE' | 'BOTH')[] } },
  };

  const load = async () => {
    const [rows, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: articleInclude,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.news.count({ where }),
    ]);
    return {
      items: rows.map(mapArticle),
      total,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  };

  const fallback = () => ({
    items: sampleArticles.slice((page - 1) * perPage, page * perPage),
    total: sampleArticles.length,
    pages: Math.max(1, Math.ceil(sampleArticles.length / perPage)),
  });

  if (!isDatabaseConfigured) return fallback();
  return withLocalPreview(load, fallback);
}

// ---------- Single items ----------
import { normalizeSlug } from '@/lib/slug';

// getArticleBySlug:
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const cleanSlug = normalizeSlug(slug);
  if (!isDatabaseConfigured) return sampleArticles.find((a) => a.slug === cleanSlug);
  return withLocalPreview(
    async () => {
      const article = await prisma.news.findFirst({
        where: { ...publishedWhere(), slug: cleanSlug },
        include: articleInclude,
      });
      return article ? mapArticle(article) : undefined;
    },
    () => sampleArticles.find((a) => a.slug === cleanSlug)
  );
}

// getVideoBySlug — همین الگو:
export async function getVideoBySlug(slug: string): Promise<MediaItem | undefined> {
  const cleanSlug = normalizeSlug(slug);
  if (!isDatabaseConfigured) return sampleVideos.find((v) => v.slug === cleanSlug);
  return withLocalPreview(
    async () => {
      const video = await prisma.video.findFirst({
        where: { ...publishedWhere(), slug: cleanSlug },
        include: videoInclude,
      });
      return video ? mapVideo(video) : undefined;
    },
    () => sampleVideos.find((v) => v.slug === cleanSlug)
  );
}

// ---------- Categories ----------
export async function getCategories(): Promise<CategorySummary[]> {
  if (!isDatabaseConfigured) return sampleCategories;
  return withLocalPreview(
    async () => {
      const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        section: category.section.toLowerCase() as CategorySummary['section'],
      }));
    },
    () => sampleCategories
  );
}

export async function getCategoryPageData(slug: string) {
  if (!isDatabaseConfigured) {
    const category = sampleCategories.find((item) => item.slug === slug);
    if (!category) return undefined;
    return {
      category: category.name,
      articles: sampleArticles.filter((item) => item.categorySlug === slug).slice(0, 24),
      videos: sampleVideos.filter((item) => item.categorySlug === slug).slice(0, 24),
    };
  }

  return withLocalPreview(
    async () => {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          news: {
            where: publishedWhere(),
            include: articleInclude,
            orderBy: { publishedAt: 'desc' },
            take: 24,
          },
          videos: {
            where: publishedWhere(),
            include: videoInclude,
            orderBy: { publishedAt: 'desc' },
            take: 24,
          },
        },
      });
      if (!category) return undefined;
      return {
        category: category.name,
        articles: category.news.map(mapArticle),
        videos: category.videos.map(mapVideo),
      };
    },
    () => {
      const category = sampleCategories.find((item) => item.slug === slug);
      return category
        ? {
            category: category.name,
            articles: sampleArticles.filter((item) => item.categorySlug === slug).slice(0, 24),
            videos: sampleVideos.filter((item) => item.categorySlug === slug).slice(0, 24),
          }
        : undefined;
    }
  );
}

// ---------- Search ----------
export async function searchContent(query: string) {
  if (!isDatabaseConfigured) {
    const normalized = query.toLocaleLowerCase('fa');
    return {
      articles: sampleArticles.filter((item) =>
        item.title.toLocaleLowerCase('fa').includes(normalized)
      ),
      videos: sampleVideos.filter((item) =>
        item.title.toLocaleLowerCase('fa').includes(normalized)
      ),
    };
  }
  return withLocalPreview(
    async () => {
      const [articles, videos] = await Promise.all([
        prisma.news.findMany({
          where: { ...publishedWhere(), title: { contains: query, mode: 'insensitive' } },
          include: articleInclude,
          orderBy: { publishedAt: 'desc' },
          take: 24,
        }),
        prisma.video.findMany({
          where: { ...publishedWhere(), title: { contains: query, mode: 'insensitive' } },
          include: videoInclude,
          orderBy: { publishedAt: 'desc' },
          take: 24,
        }),
      ]);
      return { articles: articles.map(mapArticle), videos: videos.map(mapVideo) };
    },
    () => {
      const normalized = query.toLocaleLowerCase('fa');
      return {
        articles: sampleArticles.filter((item) =>
          item.title.toLocaleLowerCase('fa').includes(normalized)
        ),
        videos: sampleVideos.filter((item) =>
          item.title.toLocaleLowerCase('fa').includes(normalized)
        ),
      };
    }
  );
}

// ---------- Homepage ----------
export async function getHomePageData(): Promise<HomePageData> {
  // Sample branch — runs when DB is not configured OR unavailable in dev
  const buildFromSample = (): HomePageData => {
    const videos = sampleVideos;
    const featured = videos.find((v) => v.featured) ?? videos[0];
    const rest = featured ? videos.filter((v) => v.slug !== featured.slug) : videos;

    const grouped = new Map<string, MediaItem[]>();
    for (const video of rest) {
      const key = video.category || 'سایر';
      const bucket = grouped.get(key);
      if (bucket) bucket.push(video);
      else grouped.set(key, [video]);
    }

    return {
      featured: featured ? { ...featured, isLive: Boolean(featured.live) } : null,
      sideVideos: rest.slice(0, 2),
      rows: [...grouped.entries()].slice(0, 3).map(([category, items]) => ({ category, items })),
      trending: videos.slice(0, 5).map((v) => ({ slug: v.slug, title: v.title, views: v.views })),
      breaking: [
        {
          slug: sampleArticles[0].slug,
          title: 'اولین خبر فوری تحریریه به‌زودی اینجا نمایش داده می‌شود',
        },
      ],
      latestArticles: sampleArticles,
      latest: sampleVideos.slice(0, 12),
      latestHasMore: false,
    };
  };

  if (!isDatabaseConfigured) return buildFromSample();

  return withLocalPreview(async () => {
    const [videos, latestArticles, trendingRows, breakingRows, latestPage] = await Promise.all([
      getPublishedVideos(30),
      getPublishedArticles(4),
      // Sorted in the DB by the raw integer — never parse Persian-formatted numbers
      prisma.video.findMany({
        where: publishedWhere(),
        orderBy: { views: 'desc' },
        take: 5,
        select: { slug: true, title: true, views: true },
      }),
      prisma.news.findMany({
        where: { ...publishedWhere(), isBreaking: true },
        select: { slug: true, title: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
      getLatestVideosPage(1, 12),
    ]);

    const featuredRow = videos.find((v) => v.featured) ?? videos[0] ?? null;
    const featured = featuredRow ? { ...featuredRow, isLive: Boolean(featuredRow.live) } : null;

    const rest = featuredRow ? videos.filter((v) => v.slug !== featuredRow.slug) : videos;

    const grouped = new Map<string, MediaItem[]>();
    for (const video of rest) {
      const key = video.category || 'سایر';
      const bucket = grouped.get(key);
      if (bucket) bucket.push(video);
      else grouped.set(key, [video]);
    }

    return {
      featured,
      sideVideos: rest.slice(0, 2),
      rows: [...grouped.entries()].slice(0, 3).map(([category, items]) => ({ category, items })),
      trending: trendingRows.map((v) => ({
        slug: v.slug,
        title: v.title,
        views: formatNumber(v.views),
      })),
      breaking: breakingRows,
      latestArticles,
      latest: latestPage.items,
      latestHasMore: latestPage.hasMore,
    };
  }, buildFromSample);
}
