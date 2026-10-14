import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

/** Toggle active/inactive */
export async function PATCH(req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (typeof body?.isActive !== 'boolean')
    return NextResponse.json({ error: 'مقدار نامعتبر است.' }, { status: 400 });

  const item = await prisma.subscriber
    .update({ where: { id }, data: { isActive: body.isActive } })
    .catch(() => null);
  if (!item) return NextResponse.json({ error: 'مشترک پیدا نشد.' }, { status: 404 });

  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { id } = await params;
  await prisma.subscriber.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
