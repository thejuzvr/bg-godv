import { NextRequest, NextResponse } from 'next/server';

// Allowed origins for CORS (for SvelteKit frontend)
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // SvelteKit dev server
  'http://localhost:5000', // Next.js (temporary during migration)
];

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
  const origin = req.headers.get('origin');
  const ip = (req as any).ip || req.headers.get('x-forwarded-for') || (req as any).socket?.remoteAddress || 'unknown';

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, x-request-id');
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set('Access-Control-Max-Age', '86400');
    }
    return res;
  }

  // attach request id via header
  const resHeaders = new Headers(req.headers);
  resHeaders.set('x-request-id', reqId);

  // Prepare response early so we can set cookies regardless
  const res = NextResponse.next({ request: { headers: resHeaders } });
  res.headers.set('x-request-id', reqId);

  // Add CORS headers if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, x-request-id');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Ensure CSRF cookie exists (double-submit cookie pattern)
  const existingCsrf = req.cookies.get('csrf_token')?.value;
  if (!existingCsrf) {
    const csrfToken = crypto.randomUUID();
    res.cookies.set('csrf_token', csrfToken, { 
      httpOnly: false, 
      sameSite: origin && ALLOWED_ORIGINS.includes(origin) ? 'none' : 'lax',
      secure: origin && ALLOWED_ORIGINS.includes(origin) ? true : false,
      path: '/' 
    });
  }

  if (!checkRateLimit(String(ip))) {
    return new NextResponse('Too Many Requests', { status: 429, headers: resHeaders });
  }
  if (!validateCsrf(req)) {
    return new NextResponse('Invalid CSRF token', { status: 403, headers: resHeaders });
  }
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};


