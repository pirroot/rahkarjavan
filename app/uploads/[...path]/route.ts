import { canManageContent, getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUpload, type UploadKind } from '@/lib/storage';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const KINDS: UploadKind[] = ['image', 'video', 'file'];

export async function POST(req: Request) {
  const session = await getSession();
  if (!canManageContent(session))
    return NextResponse.json({ error: 'دسترسی ندارید.' }, { status: 403 });

  const url = new URL(req.url);
  const kind = (url.searchParams.get('kind') ?? 'file') as UploadKind;
  if (!KINDS.includes(kind))
    return NextResponse.json({ error: 'نوع آپلود نامعتبر است.' }, { status: 400 });

  const filename = url.searchParams.get('filename') ?? 'file';
  const contentType = req.headers.get('content-type') ?? 'application/octet-stream';
  if (!req.body) return NextResponse.json({ error: 'فایلی ارسال نشد.' }, { status: 400 });

  // ⭐ The browser sends the exact file size — S3-compatible storage needs it
  const contentLength = Number(req.headers.get('content-length')) || undefined;

  try {
    const saved = await saveUpload(
      kind,
      decodeURIComponent(filename),
      contentType,
      req.body,
      contentLength
    );

    const media = await prisma.media.create({
      data: {
        url: saved.url,
        mimeType: contentType,
        fileSize: saved.size ?? null,
        uploaderId: session!.id,
      },
    });

    return NextResponse.json(
      { id: media.id, url: saved.url, mimeType: contentType, fileSize: saved.size },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'آپلود ناموفق بود.' },
      { status: 400 }
    );
  }
}
