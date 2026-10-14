import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, canManageContent } from '@/lib/auth';

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.any(),
  categoryId: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  publishedAt: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  coverId: z.string().optional(),
  coverUrl: z.string().optional(),
  authorName: z.string().optional(),
  featured: z.boolean().default(false),
});

// عمومی: فقط منتشرشده‌ها — نویسنده/مدیر: همه
export async function GET(req: Request) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const limit = Math.min(Number(searchParams.get('limit') ?? 10), 50);

  const where = canManageContent(session) ? {} : { status: 'PUBLISHED' as const };

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      include: { category: true, cover: true, author: { select: { id: true, name: true } } },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.news.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

// فقط نویسنده و مدیر
export async function POST(req: Request) {
  const session = await getSession();
  if (!canManageContent(session))
    return NextResponse.json({ error: 'دسترسی نداری' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const news = await prisma.news.create({
    data: { ...parsed.data, authorId: session!.id },
  });
  return NextResponse.json(news, { status: 201 });
}
