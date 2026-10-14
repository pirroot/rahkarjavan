import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendUserVerificationEmail } from '@/lib/verification';

const schema = z.object({ email: z.string().email().max(254) });
const hits = new Map<string, number>();

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ایمیل نامعتبر است' }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const last = hits.get(email) ?? 0;
  if (Date.now() - last < 60_000) {
    return NextResponse.json({ ok: true });
  }
  hits.set(email, Date.now());

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerifiedAt) {
    try {
      await sendUserVerificationEmail(user);
    } catch (error) {
      console.error('[verify] resend failed:', error);
      return NextResponse.json({ error: 'ارسال ایمیل ممکن نشد. بعداً دوباره تلاش کنید.' }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: true });
}
