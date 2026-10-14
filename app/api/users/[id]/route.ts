import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const ROLES = ['ADMIN', 'AUTHOR', 'USER'] as const;
type Role = (typeof ROLES)[number];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const role: unknown = body?.role;

  // Only 'role' is accepted here — name/email/passwordHash can never pass through this endpoint
  if (typeof role !== 'string' || !(ROLES as readonly string[]).includes(role))
    return NextResponse.json({ error: 'نقش نامعتبر' }, { status: 400 });

  if (id === session.id && role !== 'ADMIN')
    return NextResponse.json({ error: 'نمی‌توانی نقش خودت را تغییر بدهی' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });

  if (target.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1)
      return NextResponse.json({ error: 'حداقل یک مدیر باید در سایت باقی بماند' }, { status: 400 });
  }

  // Explicit select is critical on User — never let the raw record (with passwordHash) escape
  const user = await prisma.user.update({
    where: { id },
    data: { role: role as Role },
    select: { id: true, role: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (!isAdmin(session))
    return NextResponse.json({ error: 'فقط مدیر دسترسی دارد' }, { status: 403 });

  const { id } = await params;
  if (id === session.id)
    return NextResponse.json({ error: 'امکان حذف حساب خودت را نداری' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });

  if (target.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1)
      return NextResponse.json({ error: 'امکان حذف آخرین مدیر وجود ندارد' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    // Handles P2025 race: user deleted by another admin a moment earlier
    return NextResponse.json(
      { error: 'حذف انجام نشد؛ شاید همزمان حذف شده باشد.' },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
