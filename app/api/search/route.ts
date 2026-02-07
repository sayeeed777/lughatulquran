import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  const q = query.trim();

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
        const [surah, ayah] = String(verseKey).split(":").map(Number);
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
  } catch (error) {
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
    const normalized: SearchResult[] = matches.map((match) => ({
      surah: match?.surah?.number || null,
      ayah: match?.numberInSurah || null,
      text: "",
      translation: match?.text || ""
    }));

    return NextResponse.json({ results: normalized });
  } catch (error) {
    return NextResponse.json({ error: "Search unavailable." }, { status: 502 });
  }
}
