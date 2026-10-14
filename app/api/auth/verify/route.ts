import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, hashToken, siteUrl } from '@/lib/auth';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  const login = new URL('/login', siteUrl());

  if (!token) {
    login.searchParams.set('error', 'verify');
    return NextResponse.redirect(login);
  }

  const user = await prisma.user.findUnique({
    where: { emailVerificationTokenHash: await hashToken(token) },
  });

  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    login.searchParams.set('error', 'verify');
    return NextResponse.redirect(login);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    },
  });

  await createSession({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });

  return NextResponse.redirect(new URL('/profile?verified=1', siteUrl()));
}
