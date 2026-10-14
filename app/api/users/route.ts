import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const VALID_ROLES = ['ADMIN', 'AUTHOR', 'USER'] as const;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const role = searchParams.get('role');
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20) || 20));

  const where = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(role && (VALID_ROLES as readonly string[]).includes(role)
      ? { role: role as (typeof VALID_ROLES)[number] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}
