import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, isAdmin } from '@/lib/auth';

const createSchema = z
  .object({
    body: z.string().trim().min(2).max(2000),
    newsId: z.string().min(1).optional(),
    videoId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.newsId) !== Boolean(value.videoId), {
    message: 'یکی از خبر یا ویدیو را مشخص کنید',
  });

function serialize(sessionId: string | undefined, isStaff: boolean) {
  return (comment: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    author: { id: string; name: string; avatarUrl: string | null };
  }) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      comment.createdAt
    ),
    author: comment.author,
    canDelete: isStaff || comment.authorId === sessionId,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const newsId = searchParams.get('newsId') ?? undefined;
  const videoId = searchParams.get('videoId') ?? undefined;
  if (Boolean(newsId) === Boolean(videoId)) {
    return NextResponse.json({ error: 'یکی از خبر یا ویدیو را مشخص کنید' }, { status: 400 });
  }

  const session = await getSession();
  const comments = await prisma.comment.findMany({
    where: newsId ? { newsId } : { videoId },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  }).catch(() => []);

  return NextResponse.json({
    comments: comments.map(serialize(session?.id, isAdmin(session))),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'برای ثبت نظر وارد شوید' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'متن نظر نامعتبر است' }, { status: 400 });

  const { body, newsId, videoId } = parsed.data;
  if (newsId) {
    const news = await prisma.news.findFirst({
      where: { id: newsId, status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      select: { id: true },
    });
    if (!news) return NextResponse.json({ error: 'خبر پیدا نشد' }, { status: 404 });
  } else if (videoId) {
    const video = await prisma.video.findFirst({
      where: { id: videoId, status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      select: { id: true },
    });
    if (!video) return NextResponse.json({ error: 'ویدیو پیدا نشد' }, { status: 404 });
  }

  try {
    const comment = await prisma.comment.create({
      data: { body, authorId: session.id, newsId, videoId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return NextResponse.json({ comment: serialize(session.id, isAdmin(session))(comment) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'ثبت نظر ممکن نشد. روی محتوای پیش‌نمایش نمی‌توان نظر گذاشت.' }, { status: 400 });
  }
}
