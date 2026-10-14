import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/** List comments for the moderation panel — filterable by status */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 50) || 50));

  const where: Record<string, unknown> = {};
  if (statusParam === 'PENDING' || statusParam === 'APPROVED' || statusParam === 'REJECTED') {
    where.status = statusParam;
  }

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        news: { select: { title: true, slug: true } },
        video: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
