import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "./rateLimit";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;  // 60 per minute per IP

function getIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  return xff.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * Check API rate limit. Returns a 429 Response if limited, or null if allowed.
 */
export async function apiRateGuard(
  request: NextRequest,
  namespace = "api"
): Promise<NextResponse | null> {
  const ip = getIp(request);
  const { limited, retryAfterSeconds } = await checkRateLimit({
    namespace,
    key: ip,
    limit: MAX_REQUESTS,
    windowMs: WINDOW_MS,
  });

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  return null;
}
