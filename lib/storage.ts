import crypto from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export type UploadKind = 'image' | 'video' | 'file';

const RULES: Record<UploadKind, { mime: RegExp; maxMB: number; dir: string }> = {
  image: { mime: /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/i, maxMB: 10, dir: 'images' },
  video: { mime: /^video\/(mp4|webm|quicktime|x-matroska)$/i, maxMB: 1024, dir: 'videos' },
  file: { mime: /^(application|audio|video)\//i, maxMB: 50, dir: 'files' },
};

// Storage drivers: 'local' (dev/backup) | 's3' (Liara Object Storage — production)
export const driver = () => (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
export const mediaBase = () => (process.env.MEDIA_BASE_URL ?? '').replace(/\/+$/, '');

function newName(original: string) {
  const ext = (path.extname(original) || '').toLowerCase().slice(0, 10);
  return `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

export type SavedFile = { name: string; url: string; size: number | null };

/** Wraps the upload stream with a size-limit guard */
function limitStream(maxMB: number, onSize?: (bytes: number) => void) {
  const limit = maxMB * 1024 * 1024;
  let size = 0;
  return new Transform({
    transform(chunk, _enc, cb) {
      size += chunk.length;
      onSize?.(size);
      if (size > limit) {
        cb(new Error(`حجم فایل بیش از ${maxMB} مگابایت است.`));
        return;
      }
      cb(null, chunk);
    },
  });
}

export async function saveUpload(
  kind: UploadKind,
  originalName: string,
  contentType: string,
  body: ReadableStream<Uint8Array>,
  contentLength?: number // ⭐ NEW — from the incoming request's Content-Length header
): Promise<SavedFile> {
  const rule = RULES[kind];
  if (!rule.mime.test(contentType)) throw new Error('فرمت فایل مجاز نیست.');

  const name = newName(originalName);
  const rel = `${rule.dir}/${name}`;

  // ---------- Liara Object Storage (S3) ----------
  if (driver() === 's3') {
    const base = mediaBase();
    if (!base) throw new Error('برای STORAGE_DRIVER=s3 باید MEDIA_BASE_URL تنظیم شود.');

    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { s3, BUCKET } = await import('@/lib/s3');

    let size = 0;
    const limited = limitStream(rule.maxMB, (bytes) => (size = bytes));

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: rel,
          Body: Readable.fromWeb(body as never).pipe(limited),
          ContentType: contentType,
          // ⭐ THE FIX — S3-compatible storage rejects streamed PUTs without
          // a known length (411 MissingContentLength). The browser already
          // sent the exact length, so we pass it through.
          ContentLength: contentLength,
        })
      );
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.message?.includes('حجم فایل')) throw e; // our own size error

      // ⭐ Surface the REAL S3 error so failures are diagnosable
      throw new Error(
        `آپلود به فضای ابری ناموفق بود (${err.name ?? 'S3Error'}): ${err.message ?? 'unknown'}`
      );
    }

    return { name: rel, url: `${base}/${rel}`, size: size || null };
  }

  // ---------- Local server ----------
  const destDir = path.join(process.cwd(), 'storage', 'uploads', rule.dir);
  await mkdir(destDir, { recursive: true });

  let size = 0;
  const counter = limitStream(rule.maxMB, (bytes) => (size = bytes));

  await pipeline(
    Readable.fromWeb(body as never).pipe(counter),
    createWriteStream(path.join(destDir, name))
  );
  return { name: rel, url: `/uploads/${rel}`, size };
}

export async function removeUpload(rel: string) {
  if (!/^[\w-]+\/[\w.-]+$/.test(rel)) return; // internal paths only

  // ---------- S3 ----------
  if (driver() === 's3') {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const { s3, BUCKET } = await import('@/lib/s3');
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: rel }));
    } catch {}
    return;
  }

  // ---------- Local ----------
  try {
    await unlink(path.join(process.cwd(), 'storage', 'uploads', rel));
  } catch {}
}
