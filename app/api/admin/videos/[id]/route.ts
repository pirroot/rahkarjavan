import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateContent } from '@/lib/revalidate';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type Context = { params: Promise<{ id: string }> };

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);

const videoPatchSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .transform((v) => v.replace(/\s+/g, '-'))
    .optional(),
  description: z.string().trim().min(1).optional(),
  videoUrl: optionalString,
  thumbnailUrl: optionalString,
  duration: z.string().trim().min(1).max(20).optional(),
  categoryId: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  publishedAt: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  isLive: z.boolean().optional(),
  metaTitle: optionalString,
  metaDescription: optionalString,
});

export async function PATCH(req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (session.role !== 'ADMIN' && session.role !== 'AUTHOR')
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.video.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return NextResponse.json({ error: 'ویدیو پیدا نشد' }, { status: 404 });

  if (session.role !== 'ADMIN' && existing.authorId !== session.id)
    return NextResponse.json(
      { error: 'فقط ویدیوهای خودت را می‌توانی ویرایش کنی' },
      { status: 403 }
    );

  const parsed = videoPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const item = await prisma.video.update({ where: { id }, data: parsed.data });
    revalidateContent();
    return NextResponse.json({ item });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002')
      return NextResponse.json({ error: 'این نامک قبلاً استفاده شده.' }, { status: 400 });
    return NextResponse.json({ error: 'ذخیره ناموفق بود.' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (session.role !== 'ADMIN' && session.role !== 'AUTHOR')
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.video.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return NextResponse.json({ error: 'ویدیو پیدا نشد' }, { status: 404 });

  if (session.role !== 'ADMIN' && existing.authorId !== session.id)
    return NextResponse.json({ error: 'فقط ویدیوهای خودت را می‌توانی حذف کنی' }, { status: 403 });

  try {
    await prisma.video.delete({ where: { id } });
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'حذف انجام نشد.' }, { status: 400 });
  }
}
