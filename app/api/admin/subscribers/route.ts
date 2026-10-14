import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20) || 20));

  const [items, total] = await Promise.all([
    prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.subscriber.count(),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}
