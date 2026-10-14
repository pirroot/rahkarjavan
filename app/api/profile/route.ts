import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession, getSession } from '@/lib/auth';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.union([z.literal(''), z.url()]).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'وارد شوید' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'وارد شوید' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'داده‌ها نامعتبر است' }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio?.trim() || null,
      avatarUrl: parsed.data.avatarUrl?.trim() || null,
    },
    select: { id: true, name: true, email: true, role: true, bio: true, avatarUrl: true },
  });

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({ user });
}
