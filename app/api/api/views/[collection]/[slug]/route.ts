import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ collection: string; slug: string }> };

// Whitelist — only these two collections are countable
const ALLOWED: ReadonlySet<string> = new Set(['videos', 'articles']);

export async function POST(_req: Request, { params }: Context) {
  const { collection, slug: rawSlug } = await params;

  if (!ALLOWED.has(collection)) {
    return NextResponse.json({ error: 'invalid collection' }, { status: 400 });
  }

  // Decode URL-encoded Persian slugs — must match what is stored in the DB
  let slug = rawSlug.trim();
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // already decoded
  }

  try {
    if (collection === 'videos') {
      await prisma.video.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    } else {
      // 'articles' maps to the News model
      await prisma.news.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[views] increment failed:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
