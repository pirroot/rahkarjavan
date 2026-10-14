import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
    ...(session.role === 'AUTHOR' ? { authorId: session.id } : {}),
  };

  const [items, total, categories] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        thumbnail: { select: { url: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
    prisma.category.findMany({
      where: { section: { in: ['VIDEO', 'BOTH'] as ('VIDEO' | 'BOTH')[] } },
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
