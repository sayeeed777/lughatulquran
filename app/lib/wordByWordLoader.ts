import "server-only";

import quranWords from "../data/quran-words.json";
import { buckwalterToArabic } from "./lexicon/buckwalter";
import { getMorphologyIndex, getMorphologyWord } from "./lexicon/morphology";
import type { Word } from "./types";

const WORD_AUDIO_BASE_URL = "https://audio.qurancdn.com/";

const pad3 = (value: number) => String(value).padStart(3, "0");

const buildWordAudioUrl = (surah: number, ayah: number, position: number) =>
  `${WORD_AUDIO_BASE_URL}wbw/${pad3(surah)}_${pad3(ayah)}_${pad3(position)}.mp3`;

// Shape of entries baked into app/data/quran-words.json by scripts/fetch-quran-data.mjs.
// Keys are short to keep the static JSON small (~10 MB instead of ~20 MB).
type BakedWord = {
  a: string;   // text_uthmani (Arabic)
  t?: string;  // translation.text (English word meaning)
  tr?: string; // transliteration.text
  p: number;   // position within the ayah (1-indexed)
};

type BakedSurah = Record<string, BakedWord[]>;
type BakedWordsByChapter = Record<string, BakedSurah>;

const bakedWords = quranWords as unknown as BakedWordsByChapter;

export type WordMeaning = Word & {
  meaning?: string;
  transliteration?: string;
};

export type WordsByAyah = Record<number, WordMeaning[]>;

const surahWordCache = new Map<number, Promise<WordsByAyah>>();

const loadWordsByAyah = async (surahNumber: number): Promise<WordsByAyah> => {
  const surahData = bakedWords[String(surahNumber)];
  if (!surahData) {
    return {};
  }

  const morphologyIndex = await getMorphologyIndex();
  const wordsByAyah: WordsByAyah = {};

  for (const [ayahKey, rawWords] of Object.entries(surahData)) {
    const ayahNumber = Number(ayahKey);
    if (!Number.isFinite(ayahNumber) || !Array.isArray(rawWords)) {
      continue;
    }

    const enriched: WordMeaning[] = rawWords.map((w) => {
      const position = w.p;
      const meaning = w.t || "";
      const transliteration = w.tr || "";
      const morphology = getMorphologyWord(morphologyIndex, surahNumber, ayahNumber, position);

      return {
        arabic: w.a,
        translation: meaning || transliteration || "",
        meaning: meaning || undefined,
        transliteration: transliteration || undefined,
        audioUrl: buildWordAudioUrl(surahNumber, ayahNumber, position),
        position,
        lemma: morphology?.lemma,
        root: morphology?.root,
        rootArabic: morphology?.root ? buckwalterToArabic(morphology.root) : undefined
      };
    });

    if (enriched.length) {
      wordsByAyah[ayahNumber] = enriched;
    }
  }

  return wordsByAyah;
};

export const getWordsByAyahForSurah = async (surahNumber: number): Promise<WordsByAyah> => {
  const cached = surahWordCache.get(surahNumber);
  if (cached) {
    return cached;
  }

  const promise = loadWordsByAyah(surahNumber).catch((error) => {
    surahWordCache.delete(surahNumber);
    throw error;
  });

  surahWordCache.set(surahNumber, promise);
  return promise;
};
