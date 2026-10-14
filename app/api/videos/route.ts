import { getLatestVideosPage } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(24, Math.max(1, Number(searchParams.get('limit') ?? 12) || 12));

  const data = await getLatestVideosPage(page, limit);
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
