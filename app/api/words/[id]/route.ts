import { NextResponse } from "next/server";
import { getWordsByAyahForSurah } from "../../../lib/wordByWordLoader";

export const dynamic = "force-static";
export const revalidate = false;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ id: String(i + 1) }));
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await Promise.resolve(params);
  const surahNumber = Number(id);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah id." }, { status: 400 });
  }

  try {
    const wordsByAyah = await getWordsByAyahForSurah(surahNumber);
    return NextResponse.json({ wordsByAyah }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Unable to load word-by-word data." },
      { status: 502 }
    );
  }
}
