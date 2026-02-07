import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const revalidate = 86400;

const WORDS_BASE_URL = "https://api.quran.com/api/v4/verses/by_chapter";

type QuranComWord = {
  text_uthmani?: string;
  text?: string;
  text_imlaei?: string;
  text_uthmani_simple?: string;
  text_indopak?: string;
  text_qpc_hafs?: string;
  translation?: { text?: string; translation_text?: string } | string;
  transliteration?: { text?: string };
  audio_url?: string;
  audio?: { url?: string; mp3?: string } | string;
};

type QuranComVerse = {
  verse_number?: number;
  verse_key?: string;
  words?: QuranComWord[];
};

type QuranComResponse = {
  verses?: QuranComVerse[];
  data?: QuranComVerse[];
  pagination?: { next_page?: number; current_page?: number; total_pages?: number };
  meta?: { pagination?: { next_page?: number; current_page?: number; total_pages?: number } };
};

type NormalizedWord = {
  arabic: string;
  translation: string;
  audioUrl: string;
};

const normalizeWord = (word: QuranComWord): NormalizedWord | null => {
  const arabic =
    word?.text_uthmani ||
    word?.text ||
    word?.text_imlaei ||
    word?.text_uthmani_simple ||
    word?.text_indopak ||
    word?.text_qpc_hafs ||
    "";
  if (!arabic) {
    return null;
  }
  const translation =
    (typeof word?.translation === "string"
      ? word.translation
      : word?.translation?.text || word?.translation?.translation_text) ||
    word?.transliteration?.text ||
    "";
  const audioUrl =
    word?.audio_url ||
    (typeof word?.audio === "string" ? word.audio : word?.audio?.url || word?.audio?.mp3) ||
    "";
  return {
    arabic,
    translation,
    audioUrl
  };
};

const verseNumberFromKey = (key?: string | number | null): number | null => {
  if (!key) {
    return null;
  }
  const parts = String(key).split(":");
  return Number(parts[1] || parts[0]);
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await Promise.resolve(params);
  if (!id) {
    return NextResponse.json({ error: "Missing surah id." }, { status: 400 });
  }

  try {
    const wordsByAyah: Record<number, NormalizedWord[]> = {};
    let page = 1;
    let safety = 0;
    let hasNext = true;

    while (hasNext && safety < 20) {
      safety += 1;
      const url = new URL(`${WORDS_BASE_URL}/${id}`);
      url.searchParams.set("words", "true");
      url.searchParams.set("word_fields", "text_uthmani,audio_url");
      url.searchParams.set("translation_fields", "text");
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", "50");

      const response = await fetch(url, { next: { revalidate: 86400 } });
      if (!response.ok) {
        return NextResponse.json(
          { error: "Unable to load word-by-word data." },
          { status: 502 }
        );
      }

      const payload = (await response.json()) as QuranComResponse | null;
      const verses = payload?.verses ?? payload?.data ?? [];

      for (const verse of verses) {
        const verseNumber =
          verse?.verse_number || verseNumberFromKey(verse?.verse_key);
        if (!verseNumber || !Array.isArray(verse?.words)) {
          continue;
        }
        const normalized = verse.words
          .map(normalizeWord)
          .filter((item): item is NormalizedWord => Boolean(item?.arabic));
        if (normalized.length) {
          wordsByAyah[verseNumber] = normalized;
        }
      }

      const pagination = payload?.pagination ?? payload?.meta?.pagination;
      if (pagination?.next_page) {
        page = pagination.next_page;
        continue;
      }

      if (
        pagination?.current_page &&
        pagination?.total_pages &&
        pagination.current_page < pagination.total_pages
      ) {
        page += 1;
        continue;
      }

      hasNext = verses.length === 50;
      if (hasNext) {
        page += 1;
      }
    }

    return NextResponse.json({ wordsByAyah });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach word-by-word API." },
      { status: 502 }
    );
  }
}
