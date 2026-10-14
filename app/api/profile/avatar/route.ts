import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUpload } from '@/lib/storage';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Upload a new avatar for the signed-in user (any role) */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید.' }, { status: 401 });

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/'))
    return NextResponse.json({ error: 'فقط فایل تصویر مجاز است.' }, { status: 400 });
  if (!req.body) return NextResponse.json({ error: 'فایلی ارسال نشد.' }, { status: 400 });

  const filename = new URL(req.url).searchParams.get('filename') ?? 'avatar';
  // Browser sends the exact file size — S3-compatible storage needs it for streamed PUTs
  const contentLength = Number(req.headers.get('content-length')) || undefined;

  try {
    // Streams to local disk or Liara S3 — memory-safe even for big photos
    const saved = await saveUpload(
      'image',
      decodeURIComponent(filename),
      contentType,
      req.body,
      contentLength
    );

    const user = await prisma.user.update({
      where: { id: session.id },
      data: { avatarUrl: saved.url },
      select: { avatarUrl: true },
    });

    return NextResponse.json({ url: user.avatarUrl }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'آپلود ناموفق بود.' },
      { status: 400 }
    );
  }
}

/** Remove the current avatar */
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید.' }, { status: 401 });

  await prisma.user.update({
    where: { id: session.id },
    data: { avatarUrl: null },
  });
  return NextResponse.json({ ok: true });
}
