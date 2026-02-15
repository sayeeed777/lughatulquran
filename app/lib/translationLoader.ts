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

// Parse the Python-like dict string: {'t': 'text', 'f': {...}}
const parseTranslationField = (raw: string): string => {
  if (!raw) return "";

  // Extract the 't' value from the dict-like string (handles both '...' and "...")
  const tMatch = raw.match(
    /'t'\s*:\s*(?:'((?:[^'\\]|\\.|'')*?)'|"((?:[^"\\]|\\.)*?)")\s*[,}]/s
  );
  if (!tMatch) return raw;

  let text = (tMatch[1] ?? tMatch[2] ?? "").toString();

  // Unescape common sequences from the source encoding.
  text = text
    .replace(/''/g, "'")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");

  // Remove HTML footnote markers like <sup foot_note="...">N</sup>
  text = text.replace(/<sup\s+foot_note="[^"]*">\d+<\/sup>/gi, "");

  return text.trim();
};

// Cache loaded translations in memory (they never change)
const cache = new Map<string, LocalTranslationFile>();

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
  const file = await loadTranslationFile(translationId);
  if (!file) return null;

  const surah = file.surahs.find((s) => s.id === surahNumber);
  if (!surah) return null;

  const verses = new Map<number, string>();
  for (const verse of surah.verses) {
    verses.set(verse.id, parseTranslationField(verse.translation));
  }
  return verses;
};

export const getAyahTranslation = async (
  translationId: string,
  surahNumber: number,
  ayahNumber: number
): Promise<string | null> => {
  const verses = await getTranslation(translationId, surahNumber);
  return verses?.get(ayahNumber) ?? null;
};
