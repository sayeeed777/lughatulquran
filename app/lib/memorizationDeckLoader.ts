import "server-only";

import { readFile } from "fs/promises";
import { join } from "path";
import { SURAHS } from "../data/surahs";
import { AUDIO_RECITERS } from "./constants";
import { getJuzPayload, getPagePayload } from "./quranScopeLoader";
import { getTranslation } from "./translationLoader";
import { getAudioUrl } from "./utils";
import { getWordsByAyahForSurah } from "./wordByWordLoader";
import type {
  MemorizationCard,
  MemorizationCardMode,
  MemorizationDeckMeta,
  MemorizationDeckResponse,
  MemorizationScopeMode
} from "./types";

type AyahMetaEntry = {
  surah_number: number;
  ayah_number: number;
  verse_key: string;
  text: string;
};

type DeckAyah = {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number | null;
  arabic: string;
  englishMeaning: string;
  transliteration?: string;
};

const FIXED_TRANSLATION_ID = "en-haleem" as const;
const FIXED_WORD_TRANSLATION_ID = "wbw-quran-com" as const;
const DEFAULT_AUDIO_BASE_URL = AUDIO_RECITERS[0]?.baseUrl || "";

let ayahMetaCache: Record<string, AyahMetaEntry> | null = null;

const sanitizeArabicText = (value: string) =>
  String(value || "")
    .replace(/\s+[\u0660-\u0669\u06F0-\u06F9]+$/u, "")
    .trim();

const summarizeMeaning = (text: string) => {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 8).join(" ");
};

const getFirstWords = (arabic: string, count = 3) => {
  const words = String(arabic || "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, count).join(" ");
};

const loadAyahMeta = async (): Promise<Record<string, AyahMetaEntry>> => {
  if (ayahMetaCache) return ayahMetaCache;
  const filePath = join(process.cwd(), "app/data/quran-metadata-ayah.json");
  const content = await readFile(filePath, "utf-8");
  const raw = JSON.parse(content) as Record<string, AyahMetaEntry>;
  ayahMetaCache = Object.values(raw).reduce<Record<string, AyahMetaEntry>>((acc, entry) => {
    if (entry?.verse_key) {
      acc[entry.verse_key] = entry;
    }
    return acc;
  }, {});
  return ayahMetaCache;
};

const buildCard = (
  ayah: DeckAyah,
  deck: MemorizationDeckMeta,
  cardMode: MemorizationCardMode
): MemorizationCard => ({
  id: `${cardMode}:${ayah.verseKey}`,
  verseKey: ayah.verseKey,
  surahNumber: ayah.surahNumber,
  ayahNumber: ayah.ayahNumber,
  pageNumber: ayah.pageNumber,
  scopeMode: deck.scopeMode,
  scopeId: deck.scopeId,
  scopeLabel: deck.scopeLabel,
  translationId: FIXED_TRANSLATION_ID,
  cardMode,
  arabic: ayah.arabic,
  englishMeaning: ayah.englishMeaning,
  transliteration: ayah.transliteration,
  firstWords: getFirstWords(ayah.arabic),
  hint: summarizeMeaning(ayah.englishMeaning),
  audioUrl: getAudioUrl(DEFAULT_AUDIO_BASE_URL, ayah.surahNumber, ayah.ayahNumber)
});

const buildWordCards = async (
  ayahs: DeckAyah[],
  deck: MemorizationDeckMeta
): Promise<MemorizationCard[]> => {
  const uniqueSurahs = [...new Set(ayahs.map((ayah) => ayah.surahNumber))];
  const wordsBySurah = new Map(
    await Promise.all(
      uniqueSurahs.map(async (surahNumber) => [surahNumber, await getWordsByAyahForSurah(surahNumber)] as const)
    )
  );

  const cards: MemorizationCard[] = [];

  for (const ayah of ayahs) {
    const words = wordsBySurah.get(ayah.surahNumber)?.[ayah.ayahNumber] || [];

    for (const word of words) {
      const wordMeaning = String(word.meaning || "").trim();
      const wordArabic = String(word.arabic || "").trim();
      if (!wordArabic || !wordMeaning) {
        continue;
      }

      cards.push({
        id: `word-by-word-meaning:${ayah.verseKey}:${word.position ?? wordArabic}`,
        verseKey: ayah.verseKey,
        surahNumber: ayah.surahNumber,
        ayahNumber: ayah.ayahNumber,
        pageNumber: ayah.pageNumber,
        scopeMode: deck.scopeMode,
        scopeId: deck.scopeId,
        scopeLabel: deck.scopeLabel,
        translationId: FIXED_WORD_TRANSLATION_ID,
        cardMode: "word-by-word-meaning",
        arabic: ayah.arabic,
        englishMeaning: ayah.englishMeaning,
        transliteration: ayah.transliteration,
        firstWords: getFirstWords(ayah.arabic),
        hint: `${ayah.verseKey}${word.position ? ` · word ${word.position}` : ""}`,
        audioUrl: word.audioUrl || getAudioUrl(DEFAULT_AUDIO_BASE_URL, ayah.surahNumber, ayah.ayahNumber),
        wordArabic,
        wordMeaning,
        wordPosition: word.position,
        contextArabic: ayah.arabic,
        contextMeaning: ayah.englishMeaning
      });
    }
  }

  return cards;
};

const getSurahDeckAyahs = async (surahNumber: number): Promise<DeckAyah[] | null> => {
  const surah = SURAHS.find((item) => item.number === surahNumber);
  if (!surah) return null;

  const [ayahMeta, translationMap, transliterationMap] = await Promise.all([
    loadAyahMeta(),
    getTranslation(FIXED_TRANSLATION_ID, surahNumber),
    getTranslation("en-transliteration", surahNumber)
  ]);

  return Array.from({ length: surah.ayahCount }, (_, index) => {
    const ayahNumber = index + 1;
    const verseKey = `${surahNumber}:${ayahNumber}`;
    const meta = ayahMeta[verseKey];
    return {
      verseKey,
      surahNumber,
      ayahNumber,
      pageNumber: null,
      arabic: sanitizeArabicText(meta?.text || "Arabic text unavailable"),
      englishMeaning: translationMap?.get(ayahNumber) || "Meaning unavailable.",
      transliteration: transliterationMap?.get(ayahNumber) || undefined
    };
  });
};

export const getMemorizationDeck = async (
  scopeMode: MemorizationScopeMode,
  scopeId: number,
  cardMode: MemorizationCardMode
): Promise<MemorizationDeckResponse | null> => {
  if (scopeMode === "surah") {
    const surah = SURAHS.find((item) => item.number === scopeId);
    const ayahs = await getSurahDeckAyahs(scopeId);
    if (!surah || !ayahs) return null;
    const deck: MemorizationDeckMeta = {
      scopeMode,
      scopeId,
      scopeLabel: surah.englishName,
      cardMode,
      translationId: cardMode === "word-by-word-meaning" ? FIXED_WORD_TRANSLATION_ID : FIXED_TRANSLATION_ID,
      totalCards: 0
    };
    const cards = cardMode === "word-by-word-meaning"
      ? await buildWordCards(ayahs, deck)
      : ayahs.map((ayah) => buildCard(ayah, deck, cardMode));
    deck.totalCards = cards.length;
    return { deck, cards };
  }

  const payload = scopeMode === "juz"
    ? await getJuzPayload(scopeId, [FIXED_TRANSLATION_ID], true)
    : await getPagePayload(scopeId, [FIXED_TRANSLATION_ID], true);

  if (!payload) return null;

  const deck: MemorizationDeckMeta = {
    scopeMode,
    scopeId,
    scopeLabel: `${scopeMode === "juz" ? "Juz" : "Page"} ${scopeId}`,
    cardMode,
    translationId: cardMode === "word-by-word-meaning" ? FIXED_WORD_TRANSLATION_ID : FIXED_TRANSLATION_ID,
    totalCards: 0
  };

  const ayahs = payload.ayahs.map((ayah) => ({
    verseKey: ayah.verseKey,
    surahNumber: ayah.surahNumber,
    ayahNumber: ayah.number,
    pageNumber: ayah.pageNumber || null,
    arabic: ayah.arabic,
    englishMeaning: ayah.translations[FIXED_TRANSLATION_ID]?.text || "Meaning unavailable.",
    transliteration: ayah.transliteration
  }));

  const cards = cardMode === "word-by-word-meaning"
    ? await buildWordCards(ayahs, deck)
    : ayahs.map((ayah) => buildCard(ayah, deck, cardMode));
  deck.totalCards = cards.length;

  return {
    deck,
    cards
  };
};
