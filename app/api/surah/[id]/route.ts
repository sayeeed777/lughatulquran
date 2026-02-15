import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { SURAHS } from "../../../data/surahs";
import { ALL_TRANSLATIONS } from "../../../lib/constants";
import { getTranslation } from "../../../lib/translationLoader";

const EDITIONS = ALL_TRANSLATIONS;

// Quran.com V4 API Base URL (still needed for Arabic + Tajweed)
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
        return null;
      }

      const payload = (await response.json()) as QuranComResponse | null;
      const chunk = payload?.verses || [];

      for (const verse of chunk) {
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

// Local Arabic text fallback from quran-metadata-ayah.json
type AyahMetaEntry = {
  id: number;
  surah_number: number;
  ayah_number: number;
  verse_key: string;
  words_count: number;
  text: string;
};

let ayahMetaCache: Record<string, AyahMetaEntry> | null = null;

const loadAyahMeta = async (): Promise<Record<string, AyahMetaEntry>> => {
  if (ayahMetaCache) return ayahMetaCache;
  try {
    const filePath = join(process.cwd(), "app/data/quran-metadata-ayah.json");
    const content = await readFile(filePath, "utf-8");
    ayahMetaCache = JSON.parse(content) as Record<string, AyahMetaEntry>;
    return ayahMetaCache;
  } catch {
    return {};
  }
};

const getLocalArabicVerses = async (surahNumber: number): Promise<ArabicVerse[]> => {
  const meta = await loadAyahMeta();
  const verses: ArabicVerse[] = [];
  for (const entry of Object.values(meta)) {
    if (entry.surah_number === surahNumber) {
      // Remove verse number suffix (e.g., " ١" at end of text)
      const text = entry.text.replace(/\s+[\u0660-\u0669\u06F0-\u06F9]+$/u, "").trim();
      verses.push({
        number: entry.ayah_number,
        text,
        tajweed: null,
        page: null
      });
    }
  }
  return verses;
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await Promise.resolve(params);
  const surahNumber = Number(id);

  if (!id || !Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah id." }, { status: 400 });
  }

  try {
    const allowedTranslationIds = new Set(EDITIONS.map((e) => e.id));
    const translationsParam = request.nextUrl.searchParams.get("translations") || "";
    const requestedIds = translationsParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value) => allowedTranslationIds.has(value));

    const translationIds: string[] = [];
    const seen = new Set<string>();
    for (const translationId of (requestedIds.length ? requestedIds : ["en-arberry"])) {
      if (seen.has(translationId)) continue;
      if (!allowedTranslationIds.has(translationId)) continue;
      seen.add(translationId);
      translationIds.push(translationId);
    }

    // 1. Get surah metadata from local data
    const surahMeta = SURAHS.find((s) => s.number === surahNumber);
    if (!surahMeta) {
      return NextResponse.json({ error: "Surah not found." }, { status: 404 });
    }

    // 2. Load only requested translations from local files (in parallel)
    const translationResults = await Promise.all(
      translationIds.map(async (translationId) => ({
        id: translationId,
        verses: await getTranslation(translationId, surahNumber)
      }))
    );

    // 3. Fetch Arabic Text from Quran.com V4 (Tajweed markup), fallback to local
    let arabicVerses = await fetchArabicText(id);
    if (!arabicVerses) {
      arabicVerses = await getLocalArabicVerses(surahNumber);
    }

    // 4. Merge Data
    const ayahs: Array<{
      number: number;
      arabic: string;
      arabicTajweed: string | null;
      pageNumber: number | null;
      translations: Record<string, { text: string }>;
    }> = [];

    const totalAyahs = surahMeta.ayahCount;

    for (let i = 1; i <= totalAyahs; i++) {
      const arabicEntry = arabicVerses?.find((v) => v.number === i);
      const arabicText = arabicEntry?.text || "Arabic text unavailable";
      const arabicTajweed = arabicEntry?.tajweed || null;
      const pageNumber = arabicEntry?.page || null;

      const translations: Record<string, { text: string }> = {};
      for (const result of translationResults) {
        const text = result.verses?.get(i);
        if (text) {
          translations[result.id] = { text };
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
      surah: {
        number: surahMeta.number,
        name: surahMeta.arabicName,
        englishName: surahMeta.englishName,
        englishNameTranslation: surahMeta.translation,
        numberOfAyahs: surahMeta.ayahCount,
        revelationType: surahMeta.revelationType
      },
      ayahs,
      arabicScript: "uthmani",
      translationOrder: translationIds
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Unable to load Surah data." },
      { status: 502 }
    );
  }
}
