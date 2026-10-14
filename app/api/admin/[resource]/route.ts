import { canAccessResource, isResource, type Resource } from '@/lib/admin-resources';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateContent } from '@/lib/revalidate';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type Context = { params: Promise<{ resource: string }> };

// ---------- Shared schema pieces ----------
const contentStatus = z.enum(['DRAFT', 'PUBLISHED']);
const contactStatus = z.enum(['NEW', 'READ', 'ARCHIVED']);
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);
const slugField = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .transform((v) => v.replace(/\s+/g, '-')); // spaces → dashes
const jsonContent = z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]);

/**
 * Input validation for POST only — simple resources.
 * news & videos live in their dedicated routes (/api/admin/news, /api/admin/videos)
 * and comments are never created here (users create them via /api/comments).
 */
function parseInput(resource: Resource, input: unknown, userId: string) {
  const body = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  switch (resource) {
    case 'categories': {
      const result = z
        .object({
          name: z.string().trim().min(1).max(100),
          slug: slugField,
          section: z.enum(['ARTICLE', 'VIDEO', 'BOTH']),
        })
        .safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    case 'media': {
      const result = z
        .object({
          url: z.string().trim().url(),
          mimeType: z.string().trim().min(1),
          alt: z.string().default(''),
          credit: optionalString,
          fileSize: z.coerce.number().int().nonnegative().nullable().optional(),
          width: z.coerce.number().int().positive().nullable().optional(),
          height: z.coerce.number().int().positive().nullable().optional(),
        })
        .safeParse(body);
      return result.success
        ? { data: { ...result.data, uploaderId: userId } }
        : { error: result.error.flatten() };
    }
    case 'contacts': {
      const result = z.object({ status: contactStatus }).safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    case 'subscribers': {
      const result = z
        .object({
          email: z.string().trim().toLowerCase().email(),
          isActive: z.boolean().default(true),
        })
        .safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    case 'settings': {
      const result = z
        .object({ key: z.string().trim().min(1).max(120), value: jsonContent })
        .safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    // Dedicated routes handle these:
    case 'news':
    case 'videos':
      return { error: 'این بخش از API اختصاصی خودش استفاده می‌کند.' };
    // Comments are never created via the admin panel:
    case 'comments':
      return { error: 'دیدگاه‌ها از طریق پنل ساخته نمی‌شوند.' };
  }
}

// ---------- GET (list) ----------
export async function GET(req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  const { resource: rawResource } = await params;
  if (!isResource(rawResource))
    return NextResponse.json({ error: 'بخش پیدا نشد' }, { status: 404 });
  const resource = rawResource;
  if (!canAccessResource(session.role, resource))
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20) || 20));
  const skip = (page - 1) * limit;

  let items: unknown[] = [];
  let total = 0;
  switch (resource) {
    case 'categories': {
      const where = q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { slug: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {};
      [items, total] = await Promise.all([
        prisma.category.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
        prisma.category.count({ where }),
      ]);
      break;
    }
    case 'media': {
      const where = q
        ? {
            OR: [
              { url: { contains: q, mode: 'insensitive' as const } },
              { alt: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {};
      [items, total] = await Promise.all([
        prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.media.count({ where }),
      ]);
      break;
    }
    case 'comments': {
      const statusParam = searchParams.get('status');
      const where = {
        ...(statusParam === 'PENDING' || statusParam === 'APPROVED' || statusParam === 'REJECTED'
          ? { status: statusParam }
          : {}),
        ...(q
          ? {
              OR: [
                { body: { contains: q, mode: 'insensitive' as const } },
                { author: { name: { contains: q, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      };
      [items, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          include: {
            author: { select: { name: true, email: true } },
            news: { select: { title: true, slug: true } },
            video: { select: { title: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.comment.count({ where }),
      ]);
      break;
    }
    case 'contacts': {
      const where = q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { subject: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {};
      [items, total] = await Promise.all([
        prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.contact.count({ where }),
      ]);
      break;
    }
    case 'subscribers': {
      const where = q ? { email: { contains: q, mode: 'insensitive' as const } } : {};
      [items, total] = await Promise.all([
        prisma.subscriber.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.subscriber.count({ where }),
      ]);
      break;
    }
    case 'settings': {
      const where = q ? { key: { contains: q, mode: 'insensitive' as const } } : {};
      [items, total] = await Promise.all([
        prisma.setting.findMany({ where, orderBy: { key: 'asc' }, skip, take: limit }),
        prisma.setting.count({ where }),
      ]);
      break;
    }
    // news & videos are served by their dedicated routes
    default:
      return NextResponse.json(
        { error: 'این بخش از API اختصاصی خودش استفاده می‌کند.' },
        { status: 410 }
      );
  }

  const [categories, options] = await Promise.all([
    resource === 'categories'
      ? Promise.resolve([]) // the list itself is already here — no dropdown needed
      : Promise.resolve([]),
    resource === 'settings'
      ? prisma.setting.findMany({ select: { key: true } })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    categories,
    options,
  });
}

// ---------- POST (create) — simple resources only ----------
export async function POST(req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  const { resource: rawResource } = await params;
  if (!isResource(rawResource))
    return NextResponse.json({ error: 'بخش پیدا نشد' }, { status: 404 });
  const resource = rawResource;
  if (!canAccessResource(session.role, resource))
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  if (resource === 'news' || resource === 'videos') {
    return NextResponse.json(
      { error: 'این بخش از API اختصاصی خودش استفاده می‌کند.' },
      { status: 410 }
    );
  }

  const parsed = parseInput(resource, await req.json().catch(() => null), session.id);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    let item: unknown;
    switch (resource) {
      case 'categories':
        item = await prisma.category.create({ data: parsed.data as never });
        break;
      case 'media':
        item = await prisma.media.create({ data: parsed.data as never });
        break;
      case 'subscribers':
        item = await prisma.subscriber.create({ data: parsed.data as never });
        break;
      case 'settings':
        item = await prisma.setting.create({ data: parsed.data as never });
        break;
      default:
        return NextResponse.json({ error: 'ثبت در این بخش پشتیبانی نمی‌شود' }, { status: 400 });
    }
    revalidateContent();
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002')
      return NextResponse.json(
        { error: 'این نامک یا کلید قبلاً ثبت شده است؛ مقدار دیگری وارد کن.' },
        { status: 400 }
      );
    return NextResponse.json(
      { error: 'ثبت انجام نشد؛ احتمالاً ارجاع نامعتبر است (مثلاً دسته‌بندی).' },
      { status: 400 }
    );
  }
}
