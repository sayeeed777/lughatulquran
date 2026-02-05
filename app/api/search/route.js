import { NextResponse } from "next/server";

export async function GET(request) {
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
      const payload = await response.json();
      const results = payload?.search?.results || payload?.results || [];

      const normalized = results.map((result) => {
        const verseKey = result?.verse_key || result?.verseKey || "";
        const [surah, ayah] = String(verseKey).split(":").map(Number);
        return {
          surah: Number.isFinite(surah) ? surah : null,
          ayah: Number.isFinite(ayah) ? ayah : null,
          text: result?.text || result?.text_uthmani || result?.arabic || "",
          translation:
            result?.translations?.[0]?.text ||
            result?.translation?.text ||
            result?.translation ||
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

    const payload = await response.json();
    const matches = payload?.data?.matches || [];
    const normalized = matches.map((match) => ({
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
