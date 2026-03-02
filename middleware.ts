import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * In-memory rate limiter for API routes.
 * Limits per-IP requests to prevent scraping/abuse.
 * Normal browsing: ~2-5 API calls per page load.
 * Scraper pattern: 100+ sequential calls in seconds.
 */

type Bucket = { count: number; start: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;  // 60 requests per minute per IP (generous for normal use)
const MAX_BUCKETS = 10_000;

function getIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  return xff.split(",")[0]?.trim() || realIp || "unknown";
}

function prune(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.start > WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

function isRateLimited(ip: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const key = `${windowStart}:${ip}`;

  const bucket = buckets.get(key);
  const count = (bucket?.count || 0) + 1;
  buckets.set(key, { count, start: windowStart });
  prune(now);

  if (count > MAX_REQUESTS) {
    const msLeft = WINDOW_MS - (now - windowStart);
    return { limited: true, retryAfter: Math.max(1, Math.ceil(msLeft / 1000)) };
  }
  return { limited: false, retryAfter: 0 };
}

export function middleware(request: NextRequest) {
  const ip = getIp(request);
  const { limited, retryAfter } = isRateLimited(ip);

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
        },
      }
    );
  }

  return NextResponse.next();
}

// Only apply to API routes — won't affect pages, static assets, or SEO crawlers
export const config = {
  matcher: "/api/:path*",
};
