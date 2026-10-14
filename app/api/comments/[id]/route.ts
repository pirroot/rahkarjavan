import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, isAdmin } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'وارد شوید' }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: (await params).id } });
  if (!comment) return NextResponse.json({ error: 'نظر پیدا نشد' }, { status: 404 });
  if (!isAdmin(session) && comment.authorId !== session.id) {
    return NextResponse.json({ error: 'اجازه ندارید' }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: comment.id } });
  return NextResponse.json({ ok: true });
}
