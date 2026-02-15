import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ALL_TRANSLATIONS } from "../../../lib/constants";
import { SURAHS } from "../../../data/surahs";
import { getAyahTranslation } from "../../../lib/translationLoader";

export const revalidate = 2592000; // 30 days (static data)

export async function GET(request: NextRequest) {
  const surahNumber = Number(request.nextUrl.searchParams.get("surah"));
  const ayahNumber = Number(request.nextUrl.searchParams.get("ayah"));

  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah." }, { status: 400 });
  }

  const surahMeta = SURAHS.find((s) => s.number === surahNumber);
  if (!surahMeta) {
    return NextResponse.json({ error: "Surah not found." }, { status: 404 });
  }

  if (!Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > surahMeta.ayahCount) {
    return NextResponse.json({ error: "Invalid ayah." }, { status: 400 });
  }

  try {
    const translations: Record<string, { text: string }> = {};
    await Promise.all(
      ALL_TRANSLATIONS.map(async (translation) => {
        const text = await getAyahTranslation(translation.id, surahNumber, ayahNumber);
        if (text) {
          translations[translation.id] = { text };
        }
      })
    );

    return NextResponse.json({
      surahNumber,
      ayahNumber,
      translations,
      translationOrder: ALL_TRANSLATIONS.map((t) => t.id)
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Unable to load translations." },
      { status: 502 }
    );
  }
}
