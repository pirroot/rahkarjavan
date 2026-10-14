import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateContent } from '@/lib/revalidate';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  shortName: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500),
  logoUrl: z.string().trim().max(300).optional().default(''),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().default(''),
  telegram: z.string().trim().max(200).optional().default(''),
  instagram: z.string().trim().max(200).optional().default(''),
  eitaa: z.string().trim().max(200).optional().default(''),
  youtube: z.string().trim().max(200).optional().default(''),
  footerText: z.string().trim().max(300).optional().default(''),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  const row = await prisma.setting.findUnique({ where: { key: 'site' } });
  return NextResponse.json({ settings: row?.value ?? null });
}

/** Upsert — one record, whole form at once */
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  if (session.role !== 'ADMIN')
    return NextResponse.json({ error: 'فقط مدیر می‌تواند تنظیمات را تغییر دهد.' }, { status: 403 });

  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const value = parsed.data;

  await prisma.setting.upsert({
    where: { key: 'site' },
    update: { value },
    create: { key: 'site', value },
  });

  revalidateContent(); // public pages pick it up instantly
  return NextResponse.json({ ok: true, settings: value });
}
