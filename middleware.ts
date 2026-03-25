import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiter (per edge instance)
const rateMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 60; // requests per window
const WINDOW_MS = 60_000; // 1 minute

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip = getClientIP(req);
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count++;

  if (entry.count > RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT));
  res.headers.set('X-RateLimit-Remaining', String(RATE_LIMIT - entry.count));
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
