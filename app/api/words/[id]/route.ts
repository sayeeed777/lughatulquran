import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiRateGuard } from "../../../lib/apiRateLimit";
import { getWordsByAyahForSurah } from "../../../lib/wordByWordLoader";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const blocked = await apiRateGuard(_request, "api-words");
  if (blocked) return blocked;

  const { id } = await Promise.resolve(params);
  if (!id) {
    return NextResponse.json({ error: "Missing surah id." }, { status: 400 });
  }
  const surahNumber = Number(id);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah id." }, { status: 400 });
  }

  try {
    const wordsByAyah = await getWordsByAyahForSurah(surahNumber);
    return NextResponse.json({ wordsByAyah }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach word-by-word API." },
      { status: 502 }
    );
  }
}
