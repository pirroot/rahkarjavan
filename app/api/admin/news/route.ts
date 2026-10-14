import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateContent } from '@/lib/revalidate';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// ---------- JSON type Prisma-compatible ----------
// NOTE: no `null` in this union — Prisma's InputJsonValue rejects null and
// TipTap's getJSON() never produces it anyway, so dropping it is safe and
// makes parsed.data directly assignable to create/update inputs.
type Json = string | number | boolean | Json[] | { [key: string]: Json };
const jsonContent: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(jsonContent),
    z.record(z.string(), jsonContent),
  ])
);

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);

const newsSchema = z.object({
  title: z.string().trim().min(1).max(240),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .transform((v) => v.replace(/\s+/g, '-')),
  excerpt: z.string().trim().min(1).max(500),
  content: jsonContent,
  categoryId: z.string().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  publishedAt: z.coerce.date().default(() => new Date()),
  tags: z.array(z.string()).default([]),
  coverUrl: optionalString,
  featured: z.boolean().default(false),
  isBreaking: z.boolean().default(false),
  metaTitle: optionalString,
  metaDescription: optionalString,
});

/** List — card grid in the admin panel */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (session.role !== 'ADMIN' && session.role !== 'AUTHOR')
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const statusParam = searchParams.get('status');
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 12) || 12));

  // Literal branches keep `status` narrowed to 'DRAFT' | 'PUBLISHED'
  const statusFilter =
    statusParam === 'DRAFT'
      ? { status: 'DRAFT' as const }
      : statusParam === 'PUBLISHED'
        ? { status: 'PUBLISHED' as const }
        : {};

  const where = {
    ...statusFilter,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    // Authors see only their own posts; admins see everything
    ...(session.role === 'AUTHOR' ? { authorId: session.id } : {}),
  };

  const [items, total, categories] = await Promise.all([
    prisma.news.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        cover: { select: { url: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.news.count({ where }),
    prisma.category.findMany({
      where: { section: { in: ['ARTICLE', 'BOTH'] as ('ARTICLE' | 'BOTH')[] } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    categories,
  });
}

/** Create — from the dedicated NewsForm */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (session.role !== 'ADMIN' && session.role !== 'AUTHOR')
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const parsed = newsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    // Schema is a whitelist — authorId comes only from the session
    const item = await prisma.news.create({
      data: { ...parsed.data, authorId: session.id },
    });
    revalidateContent();
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002')
      return NextResponse.json(
        { error: 'این نامک قبلاً استفاده شده؛ مقدار دیگری وارد کن.' },
        { status: 400 }
      );
    return NextResponse.json({ error: 'ثبت انجام نشد؛ دسته‌بندی را بررسی کن.' }, { status: 400 });
  }
}
