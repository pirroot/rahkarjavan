import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateContent } from '@/lib/revalidate';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

/** Set comment status — approve / reject / back to pending */
export async function PATCH(req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status;

  if (status !== 'APPROVED' && status !== 'REJECTED' && status !== 'PENDING')
    return NextResponse.json({ error: 'وضعیت نامعتبر است.' }, { status: 400 });

  try {
    const item = await prisma.comment.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
    revalidateContent();
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'انجام نشد؛ شاید دیدگاه حذف شده باشد.' }, { status: 400 });
  }
}

/** Delete a comment */
export async function DELETE(_req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.comment.delete({ where: { id } });
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'حذف انجام نشد.' }, { status: 400 });
  }
}
