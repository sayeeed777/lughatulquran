import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "../../lib/rateLimit";
import { searchLocalQuran } from "../../lib/localQuranSearch";

const MAX_QUERY_LENGTH = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

type SearchResult = {
  surah: number | null;
  ayah: number | null;
  text: string;
  translation: string;
  matchType?: string;
  matchLabel?: string;
  page?: number | null;
  juz?: number | null;
};

/** Simple string hash to avoid storing full user-agent strings in memory. */
const simpleHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
};

const getClientIdentifier = (request: NextRequest) => {
  const xForwardedFor = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  const ip = xForwardedFor.split(",")[0]?.trim() || realIp || "unknown";
  const userAgent = request.headers.get("user-agent") || "";
  return `${ip}:${simpleHash(userAgent)}`;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  const q = query.trim().replace(/\s+/g, " ");

  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Search query is too long. Max ${MAX_QUERY_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const clientKey = getClientIdentifier(request);
  const { limited, retryAfterSeconds } = await checkRateLimit({
    namespace: "api-search",
    key: clientKey,
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS
  });
  if (limited) {
    return NextResponse.json(
      {
        error: "Too many search requests. Please wait and try again.",
        retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds)
        }
      }
    );
  }

  return NextResponse.json({ results: searchLocalQuran(q) as SearchResult[] });
}
