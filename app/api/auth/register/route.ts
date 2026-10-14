import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession, hashPassword } from '@/lib/auth';
import { isEmailConfigured } from '@/lib/email';
import { sendUserVerificationEmail } from '@/lib/verification';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(254),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'داده‌ها نامعتبر است' }, { status: 400 });

  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده' }, { status: 409 });
  }

  if (!isEmailConfigured() && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'ارسال ایمیل تأیید در حال حاضر در دسترس نیست.' }, { status: 503 });
  }

  const isFirst = (await prisma.user.count()) === 0;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: isFirst ? 'ADMIN' : 'USER',
      emailVerifiedAt: isFirst ? new Date() : null,
    },
  });

  if (isFirst) {
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    await createSession(safeUser);
    return NextResponse.json({ user: safeUser, needsVerification: false }, { status: 201 });
  }

  try {
    await sendUserVerificationEmail(user);
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    console.error('[register] email failed:', error);
    return NextResponse.json({ error: 'ارسال ایمیل تأیید ممکن نشد. بعداً دوباره تلاش کنید.' }, { status: 503 });
  }

  return NextResponse.json({ needsVerification: true, email }, { status: 201 });
}
