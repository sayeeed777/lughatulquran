import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EDITIONS = [
  "en.arberry",
  "en.pickthall",
  "en.yusufali",
  "en.sahih"
];

const EDITION_LABELS: Record<string, string> = {
  "en.arberry": "A.J. Arberry",
  "en.pickthall": "Pickthall",
  "en.yusufali": "Yusuf Ali",
  "en.sahih": "Sahih International"
};

// Quran.com V4 API Base URL
const QDC_BASE_URL = "https://api.quran.com/api/v4";

export const revalidate = 86400;

type QuranComVerse = {
  verse_number: number;
  text_uthmani: string;
  text_uthmani_tajweed?: string;
  text_uthmani_tajweed_html?: string;
  page_number?: number;
  page?: number;
  pageNumber?: number;
};

type QuranComResponse = {
  verses?: QuranComVerse[];
  pagination?: { next_page?: number };
};

type ArabicVerse = {
  number: number;
  text: string;
  tajweed: string | null;
  page: number | null;
};

type TranslationAyah = {
  numberInSurah: number;
  text: string;
};

type TranslationEdition = {
  edition: { identifier: string };
  ayahs?: TranslationAyah[];
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

type TranslationResponse = {
  data?: TranslationEdition[];
};

// Fetch Arabic Text (and optional Tajweed/Page data) from Quran.com V4
const fetchArabicText = async (chapterId: string | number): Promise<ArabicVerse[] | null> => {
  const verses: ArabicVerse[] = [];
  let page = 1;
  let hasNext = true;
  let safety = 0;

  while (hasNext && safety < 20) {
    safety += 1;
    const url = new URL(`${QDC_BASE_URL}/verses/by_chapter/${chapterId}`);
    url.searchParams.set("language", "en");
    url.searchParams.set("words", "false");
    url.searchParams.set("fields", "text_uthmani,text_uthmani_tajweed,page_number");
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "50");

    try {
      const response = await fetch(url.toString(), {
        next: { revalidate: 86400 }
      });

      if (!response.ok) {
        console.error(`Failed to fetch Arabic text for chapter ${chapterId} page ${page}`);
        return null; // Return null to fallback or error
      }

      const payload = (await response.json()) as QuranComResponse | null;
      const chunk = payload?.verses || [];

      for (const verse of chunk) {
        // V4 returns verse_key like "1:1"
        const verseNumber = verse.verse_number;
        const text = verse.text_uthmani;
        const tajweed = verse.text_uthmani_tajweed || verse.text_uthmani_tajweed_html || null;
        const pageNumber = verse.page_number || verse.page || verse.pageNumber || null;
        if (verseNumber && text) {
          verses.push({ number: verseNumber, text, tajweed, page: pageNumber });
        }
      }

      const pagination = payload?.pagination;
      if (pagination?.next_page) {
        page = pagination.next_page;
      } else {
        hasNext = false;
      }
    } catch (err) {
      console.error("Error fetching from Quran.com:", err);
      return null;
    }
  }

  return verses.length ? verses : null;
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await Promise.resolve(params);
  const surahNumber = Number(id);

  if (!id || Number.isNaN(surahNumber)) {
    return NextResponse.json({ error: "Invalid surah id." }, { status: 400 });
  }

  try {
    // 1. Fetch Translations from AlQuran.cloud (Reliable for translations)
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${id}/editions/${EDITIONS.join(",")}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch translation data.");
    }

    const payload = (await response.json()) as TranslationResponse | null;
    if (!payload?.data || !payload.data.length) {
      throw new Error("Unexpected response from Translation API.");
    }

    const editions = payload.data;
    const editionById = new Map(
      editions.map((edition) => [edition.edition.identifier, edition])
    );

    // 2. Fetch Arabic Text from Quran.com V4 (Cleaner, better Bismillah handling)
    const arabicVerses = await fetchArabicText(id);

    // 3. Construct reference metadata from the first translation (e.g., Sahih)
    // We can use the first available edition for metadata since they all share Surah structure
    const refEdition = editions[0];
    if (!refEdition) {
      throw new Error("Unexpected response from Translation API.");
    }
    const surahMeta = {
      number: refEdition.number,
      name: refEdition.name, // Note: AlQuran.cloud names might differ slightly, but usually fine
      englishName: refEdition.englishName,
      englishNameTranslation: refEdition.englishNameTranslation,
      numberOfAyahs: refEdition.numberOfAyahs,
      revelationType: refEdition.revelationType
    };

    // 4. Merge Data
    const ayahs: Array<{
      number: number;
      arabic: string;
      arabicTajweed: string | null;
      pageNumber: number | null;
      translations: Record<string, { label: string; text: string }>;
    }> = [];
    const totalAyahs = surahMeta.numberOfAyahs;

    // Use a Loop based on total verses to ensure missing translations/arabic don't break order
    for (let i = 1; i <= totalAyahs; i++) {
      const arabicEntry = arabicVerses?.find((v) => v.number === i);
      const arabicText = arabicEntry?.text || "Arabic text unavailable";
      const arabicTajweed = arabicEntry?.tajweed || null;
      const pageNumber = arabicEntry?.page || null;

      // Quran.com V4 usually provides clean text.
      // For Surah 1 (Fatiha), Verse 1 IS Bismillah.
      // For others, Verse 1 does NOT contain Bismillah.
      // So minimal processing is needed compared to AlQuran.cloud.

      const translations: Record<string, { label: string; text: string }> = {};
      for (const [identifier, label] of Object.entries(EDITION_LABELS)) {
        const edition = editionById.get(identifier);
        const ayah = edition?.ayahs?.find((a) => a.numberInSurah === i);
        if (ayah) {
          translations[identifier] = {
            label,
            text: ayah.text
          };
        }
      }

      ayahs.push({
        number: i,
        arabic: arabicText,
        arabicTajweed,
        pageNumber,
        translations
      });
    }

    return NextResponse.json({
      surah: surahMeta,
      ayahs,
      arabicScript: "uthmani", // Standard Quran.com V4 text
      translationOrder: ["en.sahih", "en.arberry", "en.pickthall", "en.yusufali"]
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Unable to load Surah data." },
      { status: 502 }
    );
  }
}
