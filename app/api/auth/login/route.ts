import { createSession, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, 'login'), 5, 10 * 60_000)) {
    return NextResponse.json(
      { error: 'تلاش‌های ناموفق زیاد است. ۱۰ دقیقه بعد دوباره امتحان کن.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'ایمیل و گذرواژه الزامی است.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  const genericError = NextResponse.json(
    { error: 'ایمیل یا گذرواژه اشتباه است.' },
    { status: 401 }
  );

  if (!user) {
    await verifyPassword(password, '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpFqzCqzZpqZbPqZbPqZbPqZbPqZbP');
    return genericError;
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return genericError;

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'ADMIN' | 'AUTHOR',
  });

  return NextResponse.json({ ok: true });
}
