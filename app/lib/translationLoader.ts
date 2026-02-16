import "server-only";
import { readFile } from "fs/promises";
import { join } from "path";

type LocalVerse = {
  id: number;
  translation: string;
};

type LocalSurah = {
  id: number;
  total_verses: number;
  verses: LocalVerse[];
};

type LocalTranslationFile = {
  translator: string;
  source: string;
  surahs: LocalSurah[];
};

// Cache loaded translations in memory (they never change)
const cache = new Map<string, LocalTranslationFile>();
const surahVerseCache = new Map<string, Map<number, Map<number, string>>>();

const loadTranslationFile = async (
  translationId: string
): Promise<LocalTranslationFile | null> => {
  const cached = cache.get(translationId);
  if (cached) return cached;

  try {
    const filePath = join(
      process.cwd(),
      "app/data/translations",
      `${translationId}.json`
    );
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content) as LocalTranslationFile;
    cache.set(translationId, data);
    return data;
  } catch {
    return null;
  }
};

export const getTranslation = async (
  translationId: string,
  surahNumber: number
): Promise<Map<number, string> | null> => {
  const cachedBySurah = surahVerseCache.get(translationId);
  if (cachedBySurah) {
    return cachedBySurah.get(surahNumber) || null;
  }

  const file = await loadTranslationFile(translationId);
  if (!file) return null;

  const bySurah = new Map<number, Map<number, string>>();
  for (const surah of file.surahs) {
    const verses = new Map<number, string>();
    for (const verse of surah.verses) {
      verses.set(verse.id, String(verse.translation || "").trim());
    }
    bySurah.set(surah.id, verses);
  }
  surahVerseCache.set(translationId, bySurah);

  return bySurah.get(surahNumber) || null;
};

export const getAyahTranslation = async (
  translationId: string,
  surahNumber: number,
  ayahNumber: number
): Promise<string | null> => {
  const verses = await getTranslation(translationId, surahNumber);
  return verses?.get(ayahNumber) ?? null;
};
