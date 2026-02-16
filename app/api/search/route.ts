import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "../../lib/rateLimit";

const MAX_QUERY_LENGTH = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

type SearchResult = {
  surah: number | null;
  ayah: number | null;
  text: string;
  translation: string;
};

type QuranComResult = {
  verse_key?: string;
  verseKey?: string;
  text?: string;
  text_uthmani?: string;
  arabic?: string;
  translations?: Array<{ text?: string }>;
  translation?: { text?: string } | string;
};

type QuranComPayload = {
  search?: { results?: QuranComResult[] };
  results?: QuranComResult[];
};

type AlQuranMatch = {
  surah?: { number?: number };
  numberInSurah?: number;
  text?: string;
};

type AlQuranPayload = {
  data?: { matches?: AlQuranMatch[] };
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

  // Try Quran.com search first (rich results)
  try {
    const response = await fetch(
      `https://api.quran.com/api/v4/search?q=${encodeURIComponent(q)}&size=20&page=1&language=en`,
      { next: { revalidate: 0 } }
    );

    if (response.ok) {
      const payload = (await response.json()) as QuranComPayload | null;
      const results = payload?.search?.results || payload?.results || [];

      const normalized: SearchResult[] = results.map((result) => {
        const verseKey = result?.verse_key || result?.verseKey || "";
        const parts = String(verseKey).split(":");
        const surah = Number(parts[0] ?? "");
        const ayah = Number(parts[1] ?? "");
        return {
          surah: Number.isFinite(surah) ? surah : null,
          ayah: Number.isFinite(ayah) ? ayah : null,
          text: result?.text || result?.text_uthmani || result?.arabic || "",
          translation:
            result?.translations?.[0]?.text ||
            (typeof result?.translation === "string"
              ? result.translation
              : result?.translation?.text) ||
            ""
        };
      });

      return NextResponse.json({ results: normalized });
    }
  } catch {
    // Fall through to secondary provider
  }

  // Fallback: AlQuran.cloud search
  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/en`,
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Search unavailable." }, { status: 502 });
    }

    const payload = (await response.json()) as AlQuranPayload | null;
    const matches = payload?.data?.matches || [];
    const normalized: SearchResult[] = matches.map((match) => {
      const surahNumber = Number(match?.surah?.number);
      const ayahNumber = Number(match?.numberInSurah);
      return {
        surah: Number.isFinite(surahNumber) ? surahNumber : null,
        ayah: Number.isFinite(ayahNumber) ? ayahNumber : null,
        text: "",
        translation: match?.text || ""
      };
    });

    return NextResponse.json({ results: normalized });
  } catch {
    return NextResponse.json({ error: "Search unavailable." }, { status: 502 });
  }
}
