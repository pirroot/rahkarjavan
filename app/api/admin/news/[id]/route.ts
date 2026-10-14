import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateContent } from '@/lib/revalidate';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type Context = { params: Promise<{ id: string }> };

// Same JSON type as the list route — no null (Prisma rejects it)
type Json = string | number | boolean | Json[] | { [key: string]: Json };
const jsonContent: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(jsonContent),
    z.record(z.string(), jsonContent),
  ])
);

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);

// All fields optional on PATCH — whitelist only; authorId can never pass through
const newsPatchSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .transform((v) => v.replace(/\s+/g, '-'))
    .optional(),
  excerpt: z.string().trim().min(1).max(500).optional(),
  content: jsonContent.optional(),
  categoryId: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  publishedAt: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  coverUrl: optionalString,
  featured: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  metaTitle: optionalString,
  metaDescription: optionalString,
});

export async function PATCH(req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (session.role !== 'ADMIN' && session.role !== 'AUTHOR')
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.news.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return NextResponse.json({ error: 'خبر پیدا نشد' }, { status: 404 });

  // Authors can only edit their own posts
  if (session.role !== 'ADMIN' && existing.authorId !== session.id)
    return NextResponse.json({ error: 'فقط خبرهای خودت را می‌توانی ویرایش کنی' }, { status: 403 });

  const parsed = newsPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    // Prisma's XOR update-input type can't express a plain optional-fields
    // object — this single targeted cast is the standard workaround
    // (same pattern already used by the generic admin route).
    const item = await prisma.news.update({
      where: { id },
      data: parsed.data as never,
    });
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
  const existing = await prisma.news.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return NextResponse.json({ error: 'خبر پیدا نشد' }, { status: 404 });

  if (session.role !== 'ADMIN' && existing.authorId !== session.id)
    return NextResponse.json({ error: 'فقط خبرهای خودت را می‌توانی حذف کنی' }, { status: 403 });

  try {
    await prisma.news.delete({ where: { id } });
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'حذف انجام نشد.' }, { status: 400 });
  }
}
