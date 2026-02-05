import { NextResponse } from "next/server";

export const revalidate = 86400;

const WORDS_BASE_URL = "https://api.quran.com/api/v4/verses/by_chapter";

const normalizeWord = (word) => {
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
    word?.translation?.text ||
    word?.translation?.translation_text ||
    word?.translation ||
    word?.transliteration?.text ||
    "";
  const audioUrl =
    word?.audio_url ||
    word?.audio?.url ||
    word?.audio?.mp3 ||
    word?.audio ||
    "";
  return {
    arabic,
    translation,
    audioUrl
  };
};

const verseNumberFromKey = (key) => {
  if (!key) {
    return null;
  }
  const parts = String(key).split(":");
  return Number(parts[1] || parts[0]);
};

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing surah id." }, { status: 400 });
  }

  try {
    const wordsByAyah = {};
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

      const payload = await response.json();
      const verses = payload?.verses ?? payload?.data ?? [];

      for (const verse of verses) {
        const verseNumber =
          verse?.verse_number || verseNumberFromKey(verse?.verse_key);
        if (!verseNumber || !Array.isArray(verse?.words)) {
          continue;
        }
        const normalized = verse.words
          .map(normalizeWord)
          .filter((item) => item && item.arabic);
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
