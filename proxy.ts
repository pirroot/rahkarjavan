import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

const COOKIE = 'session';

async function readSession(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const token = req.cookies.get(COOKIE)?.value;
  if (!secret || !token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = String(payload.role ?? '');
    if (!['ADMIN', 'AUTHOR'].includes(role)) return null;
    return { id: String(payload.id), role };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  if (pathname.startsWith('/api/admin')) {
    if (!session) return NextResponse.json({ error: 'ابتدا وارد شوید.' }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin/login')) {
    if (session) return NextResponse.redirect(new URL('/admin', req.url));
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL('/admin/login', req.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
