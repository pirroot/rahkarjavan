import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, canEditOwnContent, isAdmin } from '@/lib/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'لاگین کن' }, { status: 401 });

  const article = await prisma.news.findUnique({ where: { id: (await params).id } });
  if (!article) return NextResponse.json({ error: 'پیدا نشد' }, { status: 404 });
  if (!canEditOwnContent(session, article.authorId))
    return NextResponse.json({ error: 'دسترسی نداری' }, { status: 403 });

  const updated = await prisma.news.update({
    where: { id: article.id },
    data: await req.json(),
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر می‌تونه حذف کنه' }, { status: 403 });

  await prisma.news.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
