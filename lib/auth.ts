import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 روز

export type Role = 'ADMIN' | 'AUTHOR' | 'USER';
export type SessionUser = { id: string; name: string; email: string; role: Role };

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET must be set to a value of at least 32 characters.');
  }
  return new TextEncoder().encode(value);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user, emailVerified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.emailVerified !== true ||
      typeof payload.id !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.email !== 'string' ||
      !['ADMIN', 'AUTHOR', 'USER'].includes(String(payload.role))
    ) {
      return null;
    }
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export function createOpaqueToken() {
  return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
}

export async function hashToken(token: string) {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(token).digest('hex');
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

// ---------- معادل access.ts خودت ----------
export const isAdmin = (u: SessionUser | null) => u?.role === 'ADMIN';
export const canManageContent = (u: SessionUser | null) =>
  u?.role === 'ADMIN' || u?.role === 'AUTHOR';
export const canEditOwnContent = (u: SessionUser | null, authorId?: string | null) =>
  isAdmin(u) || (!!u && !!authorId && u.id === authorId && canManageContent(u));
