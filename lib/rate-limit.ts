// Simple in-memory rate limiter — per server instance (sufficient for a single Node host)
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

/** Returns false when the limit is exceeded */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now, windowMs);

  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt > now) {
    bucket.count += 1;
    return bucket.count <= limit;
  }
  buckets.set(key, { count: 1, resetAt: now + windowMs });
  return true;
}

export function ipFromHeaders(headers: Headers): string {
  return (
    headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  );
}

/** For API routes that receive a Request */
export function clientKey(req: Request, scope: string): string {
  return `${scope}:${ipFromHeaders(req.headers)}`;
}
