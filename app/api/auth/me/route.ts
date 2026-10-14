import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json(
    { user: { id: user.id, name: user.name, role: user.role } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
