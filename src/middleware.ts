import { NextRequest, NextResponse } from 'next/server';

// Simple CSRF protection using double submit cookie
function validateCsrf(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
  const cookie = req.cookies.get('csrf_token')?.value;
  const header = req.headers.get('x-csrf-token');
  return !!cookie && !!header && cookie === header;
}

// Token bucket rate limiter in Redis via edge-compatible fetch to our own API is out of scope;
// use a lightweight in-memory limiter per IP for now (best-effort in single instance)
const ipBuckets = new Map<string, { tokens: number; updatedAt: number }>();
const RATE_LIMIT_TOKENS = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || { tokens: RATE_LIMIT_TOKENS, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  const refill = Math.floor((elapsed / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_TOKENS);
  bucket.tokens = Math.min(RATE_LIMIT_TOKENS, bucket.tokens + Math.max(0, refill));
  bucket.updatedAt = now;
  if (bucket.tokens <= 0) {
    ipBuckets.set(ip, bucket);
    return false;
  }
  bucket.tokens -= 1;
  ipBuckets.set(ip, bucket);
  return true;
}

export function middleware(req: NextRequest) {
  const reqId = crypto.randomUUID();
  // attach request id via header
  const resHeaders = new Headers(req.headers);
  resHeaders.set('x-request-id', reqId);
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(String(ip))) {
    return new NextResponse('Too Many Requests', { status: 429, headers: resHeaders });
  }
  if (!validateCsrf(req)) {
    return new NextResponse('Invalid CSRF token', { status: 403, headers: resHeaders });
  }
  const next = NextResponse.next({ request: { headers: resHeaders } });
  next.headers.set('x-request-id', reqId);
  return next;
}

export const config = {
  matcher: ['/api/:path*'],
};


