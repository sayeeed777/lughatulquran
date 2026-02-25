import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "../../lib/rateLimit";
import quranText from "../../data/quran-text.json";

const MAX_QUERY_LENGTH = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const LOCAL_MAX_RESULTS = 40;

const TAG_RE = /<[^>]*>/g;
const MULTISPACE_RE = /\s+/g;
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;
const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

type SearchResult = {
  surah: number | null;
  ayah: number | null;
  text: string;
  translation: string;
};

type LocalVerse = {
  ar?: string;
  en?: string;
};

type LocalQuran = Record<string, Record<string, LocalVerse>>;

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

const cleanText = (value: string | null | undefined): string =>
  String(value || "")
    .replace(TAG_RE, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(MULTISPACE_RE, " ")
    .trim();

const normalizeForSearch = (value: string): string =>
  cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS_RE, "")
    .replace(ARABIC_DIACRITICS_RE, "")
    .replace(MULTISPACE_RE, " ")
    .trim();

const localQuran = quranText as LocalQuran;

const localFallbackSearch = (query: string): SearchResult[] => {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const hits: Array<SearchResult & { score: number }> = [];

  for (const [surahKey, ayahMap] of Object.entries(localQuran)) {
    const surah = Number(surahKey);
    if (!Number.isInteger(surah)) continue;

    for (const [ayahKey, verse] of Object.entries(ayahMap || {})) {
      const ayah = Number(ayahKey);
      if (!Number.isInteger(ayah)) continue;

      const ar = cleanText(verse?.ar);
      const en = cleanText(verse?.en);
      const arNorm = normalizeForSearch(ar);
      const enNorm = normalizeForSearch(en);

      const inArabic = arNorm.includes(normalizedQuery);
      const inEnglish = enNorm.includes(normalizedQuery);
      if (!inArabic && !inEnglish) continue;

      let score = 1;
      if (arNorm === normalizedQuery || enNorm === normalizedQuery) score += 4;
      if (arNorm.startsWith(normalizedQuery) || enNorm.startsWith(normalizedQuery)) score += 2;

      hits.push({
        surah,
        ayah,
        text: ar,
        translation: en,
        score
      });
    }
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.surah || 0) !== (b.surah || 0)) return (a.surah || 0) - (b.surah || 0);
    return (a.ayah || 0) - (b.ayah || 0);
  });

  return hits.slice(0, LOCAL_MAX_RESULTS).map((hit) => ({
    surah: hit.surah,
    ayah: hit.ayah,
    text: hit.text,
    translation: hit.translation
  }));
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
          text: cleanText(result?.text || result?.text_uthmani || result?.arabic || ""),
          translation: cleanText(
            result?.translations?.[0]?.text ||
            (typeof result?.translation === "string"
              ? result.translation
              : result?.translation?.text) ||
            ""
          )
        };
      });

      if (normalized.length > 0) {
        return NextResponse.json({ results: normalized });
      }
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

    if (response.ok) {
      const payload = (await response.json()) as AlQuranPayload | null;
      const matches = payload?.data?.matches || [];
      const normalized: SearchResult[] = matches.map((match) => {
        const surahNumber = Number(match?.surah?.number);
        const ayahNumber = Number(match?.numberInSurah);
        return {
          surah: Number.isFinite(surahNumber) ? surahNumber : null,
          ayah: Number.isFinite(ayahNumber) ? ayahNumber : null,
          text: "",
          translation: cleanText(match?.text || "")
        };
      });

      if (normalized.length > 0) {
        return NextResponse.json({ results: normalized });
      }
    }
  } catch {
    // Fall through to local fallback.
  }

  return NextResponse.json({ results: localFallbackSearch(q) });
}
