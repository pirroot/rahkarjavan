import { canAccessResource, validAdminResource, type Resource } from '@/lib/admin-resources';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateContent } from '@/lib/revalidate';
import { removeUpload } from '@/lib/storage';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  const { resource: rawResource, id } = await params;
  if (!validAdminResource(rawResource))
    return NextResponse.json({ error: 'بخش پیدا نشد' }, { status: 404 });
  const resource = rawResource as Resource;
  if (!canAccessResource(session.role, resource))
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  // news/videos/comments have their own dedicated API routes
  if (resource === 'news' || resource === 'videos' || resource === 'comments')
    return NextResponse.json(
      { error: 'این بخش از API اختصاصی خودش استفاده می‌کند.' },
      { status: 410 }
    );

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    let item: unknown;

    switch (resource) {
      case 'categories':
        item = await prisma.category.update({
          where: { id },
          data: {
            name: typeof body.name === 'string' ? body.name : undefined,
            slug: typeof body.slug === 'string' ? body.slug.replace(/\s+/g, '-') : undefined,
            section:
              body.section === 'ARTICLE' || body.section === 'VIDEO' || body.section === 'BOTH'
                ? body.section
                : undefined,
          },
        });
        break;

      case 'media':
        item = await prisma.media.update({
          where: { id },
          data: {
            alt: typeof body.alt === 'string' ? body.alt : undefined,
            credit: typeof body.credit === 'string' ? body.credit : undefined,
          },
        });
        break;

      case 'contacts': {
        const status = body.status;
        if (status === 'NEW' || status === 'READ' || status === 'ARCHIVED') {
          item = await prisma.contact.update({ where: { id }, data: { status } });
          break;
        }
        return NextResponse.json({ error: 'وضعیت پیام نامعتبر است.' }, { status: 400 });
      }

      case 'subscribers': {
        if (typeof body.isActive === 'boolean') {
          item = await prisma.subscriber.update({
            where: { id },
            data: { isActive: body.isActive },
          });
          break;
        }
        return NextResponse.json({ error: 'فقط وضعیت فعال قابل تغییر است.' }, { status: 400 });
      }

      case 'settings':
        return NextResponse.json({ error: 'تنظیمات از این مسیر ویرایش نمی‌شود.' }, { status: 400 });
    }

    revalidateContent();
    return NextResponse.json({ item });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2002')
      return NextResponse.json({ error: 'این نامک یا کلید قبلاً ثبت شده است.' }, { status: 400 });
    if (code === 'P2025')
      return NextResponse.json(
        { error: 'رکورد پیدا نشد؛ شاید قبلاً حذف شده باشد.' },
        { status: 404 }
      );
    return NextResponse.json({ error: 'ذخیره تغییرات انجام نشد.' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  const { resource: rawResource, id } = await params;
  if (!validAdminResource(rawResource))
    return NextResponse.json({ error: 'بخش پیدا نشد' }, { status: 404 });
  const resource = rawResource as Resource;
  if (!canAccessResource(session.role, resource))
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  if (resource === 'news' || resource === 'videos' || resource === 'comments')
    return NextResponse.json(
      { error: 'این بخش از API اختصاصی خودش استفاده می‌کند.' },
      { status: 410 }
    );

  // Media in use must not be deleted
  if (resource === 'media') {
    const inUse = await prisma.$transaction([
      prisma.news.count({ where: { coverId: id } }),
      prisma.video.count({ where: { OR: [{ videoFileId: id }, { thumbnailId: id }] } }),
    ]);
    if (inUse[0] + inUse[1] > 0)
      return NextResponse.json(
        { error: 'این فایل در حال استفاده است؛ اول جای آن را در محتوا تغییر بده.' },
        { status: 400 }
      );
  }

  try {
    let mediaUrl: string | null = null;

    switch (resource) {
      case 'categories':
        await prisma.category.delete({ where: { id } });
        break;
      case 'media': {
        const deleted = await prisma.media.delete({ where: { id }, select: { url: true } });
        mediaUrl = deleted.url;
        break;
      }
      case 'contacts':
        await prisma.contact.delete({ where: { id } });
        break;
      case 'subscribers':
        await prisma.subscriber.delete({ where: { id } });
        break;
      case 'settings':
        await prisma.setting.delete({ where: { id } });
        break;
    }

    if (mediaUrl?.startsWith('/uploads/')) {
      await removeUpload(mediaUrl.replace('/uploads/', ''));
    }

    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2003')
      return NextResponse.json(
        { error: 'این مورد در محتوای دیگری استفاده شده است؛ اول وابسته‌ها را جابه‌جا کن.' },
        { status: 400 }
      );
    if (code === 'P2025') return NextResponse.json({ error: 'رکورد پیدا نشد.' }, { status: 404 });
    return NextResponse.json({ error: 'حذف انجام نشد.' }, { status: 400 });
  }
}
