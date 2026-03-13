import "server-only";

import { readFile } from "fs/promises";
import { join } from "path";
import { getTranslation } from "./translationLoader";

type AyahMetaEntry = {
  id: number;
  surah_number: number;
  ayah_number: number;
  verse_key: string;
  words_count: number;
  text: string;
};

type ScopeEntry = {
  verses_count: number;
  first_verse_key: string;
  last_verse_key: string;
  verse_mapping: Record<string, string>;
};

type ScopeFile = Record<string, ScopeEntry>;

type ScopeVerseRef = {
  surahNumber: number;
  ayahNumber: number;
  verseKey: string;
};

type ScopeSection = {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
};

export type ScopedAyahPayload = {
  surahNumber: number;
  number: number;
  verseKey: string;
  arabic: string;
  arabicTajweed: null;
  transliteration?: string;
  pageNumber: number | null;
  translations: Record<string, { text: string }>;
};

export type ScopePayload = {
  entry: ScopeEntry;
  sections: ScopeSection[];
  ayahs: ScopedAyahPayload[];
};

let ayahMetaCache: Record<string, AyahMetaEntry> | null = null;
let pageMetaCache: ScopeFile | null = null;
let juzMetaCache: ScopeFile | null = null;
let pageByVerseKeyCache: Map<string, number> | null = null;

const loadJsonFile = async <T>(fileName: string): Promise<T> => {
  const filePath = join(process.cwd(), "app/data", fileName);
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
};

const loadAyahMeta = async (): Promise<Record<string, AyahMetaEntry>> => {
  if (ayahMetaCache) return ayahMetaCache;
  const rawMeta = await loadJsonFile<Record<string, AyahMetaEntry>>("quran-metadata-ayah.json");
  ayahMetaCache = Object.values(rawMeta).reduce<Record<string, AyahMetaEntry>>((acc, entry) => {
    if (!entry?.verse_key) return acc;
    acc[entry.verse_key] = entry;
    return acc;
  }, {});
  return ayahMetaCache;
};

const loadPageMeta = async (): Promise<ScopeFile> => {
  if (pageMetaCache) return pageMetaCache;
  pageMetaCache = await loadJsonFile<ScopeFile>("quran-metadata-page.json");
  return pageMetaCache;
};

const loadJuzMeta = async (): Promise<ScopeFile> => {
  if (juzMetaCache) return juzMetaCache;
  juzMetaCache = await loadJsonFile<ScopeFile>("quran-metadata-juz.json");
  return juzMetaCache;
};

const parseVerseRange = (value: string): [number, number] | null => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  const [startRaw, endRaw] = trimmed.split("-");
  const start = Number(startRaw);
  const end = Number(endRaw ?? startRaw);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  return [Math.min(start, end), Math.max(start, end)];
};

const buildSections = (entry: ScopeEntry): ScopeSection[] =>
  Object.entries(entry.verse_mapping || {})
    .map(([surahKey, rawRange]) => {
      const surahNumber = Number(surahKey);
      const parsedRange = parseVerseRange(rawRange);
      if (!Number.isInteger(surahNumber) || !parsedRange) return null;
      const [startAyah, endAyah] = parsedRange;
      return { surahNumber, startAyah, endAyah };
    })
    .filter((value): value is ScopeSection => value !== null)
    .sort((a, b) => a.surahNumber - b.surahNumber || a.startAyah - b.startAyah);

const buildVerseRefs = (entry: ScopeEntry): ScopeVerseRef[] => {
  const sections = buildSections(entry);
  const refs: ScopeVerseRef[] = [];

  for (const section of sections) {
    for (let ayahNumber = section.startAyah; ayahNumber <= section.endAyah; ayahNumber += 1) {
      refs.push({
        surahNumber: section.surahNumber,
        ayahNumber,
        verseKey: `${section.surahNumber}:${ayahNumber}`
      });
    }
  }

  return refs;
};

const sanitizeArabicText = (value: string): string =>
  String(value || "")
    .replace(/\s+[\u0660-\u0669\u06F0-\u06F9]+$/u, "")
    .trim();

const buildPageByVerseKey = async (): Promise<Map<string, number>> => {
  if (pageByVerseKeyCache) return pageByVerseKeyCache;

  const pageMeta = await loadPageMeta();
  const map = new Map<string, number>();

  for (const [pageKey, entry] of Object.entries(pageMeta)) {
    const pageNumber = Number(pageKey);
    if (!Number.isInteger(pageNumber)) continue;
    for (const ref of buildVerseRefs(entry)) {
      map.set(ref.verseKey, pageNumber);
    }
  }

  pageByVerseKeyCache = map;
  return map;
};

const loadTranslationsBySurah = async (
  surahNumbers: number[],
  translationIds: string[],
  includeTransliteration: boolean
) => {
  const uniqueSurahs = [...new Set(surahNumbers)].sort((a, b) => a - b);
  const translationsById = new Map<string, Map<number, Map<number, string>>>();

  await Promise.all(
    translationIds.map(async (translationId) => {
      const bySurah = new Map<number, Map<number, string>>();
      await Promise.all(
        uniqueSurahs.map(async (surahNumber) => {
          const verses = await getTranslation(translationId, surahNumber);
          bySurah.set(surahNumber, verses || new Map<number, string>());
        })
      );
      translationsById.set(translationId, bySurah);
    })
  );

  let transliterationBySurah: Map<number, Map<number, string>> | null = null;
  if (includeTransliteration) {
    transliterationBySurah = new Map<number, Map<number, string>>();
    await Promise.all(
      uniqueSurahs.map(async (surahNumber) => {
        const verses = await getTranslation("en-transliteration", surahNumber);
        transliterationBySurah!.set(surahNumber, verses || new Map<number, string>());
      })
    );
  }

  return { translationsById, transliterationBySurah };
};

const buildScopePayload = async (
  entry: ScopeEntry,
  translationIds: string[],
  includeTransliteration: boolean
): Promise<ScopePayload> => {
  const refs = buildVerseRefs(entry);
  const sections = buildSections(entry);
  const ayahMeta = await loadAyahMeta();
  const pageByVerseKey = await buildPageByVerseKey();
  const { translationsById, transliterationBySurah } = await loadTranslationsBySurah(
    refs.map((ref) => ref.surahNumber),
    translationIds,
    includeTransliteration
  );

  const ayahs = refs.map<ScopedAyahPayload>((ref) => {
    const metaEntry = ayahMeta[ref.verseKey];
    const translations: Record<string, { text: string }> = {};

    for (const translationId of translationIds) {
      const text = translationsById
        .get(translationId)
        ?.get(ref.surahNumber)
        ?.get(ref.ayahNumber);
      if (text) {
        translations[translationId] = { text };
      }
    }

    return {
      surahNumber: ref.surahNumber,
      number: ref.ayahNumber,
      verseKey: ref.verseKey,
      arabic: sanitizeArabicText(metaEntry?.text || "Arabic text unavailable"),
      arabicTajweed: null,
      transliteration:
        transliterationBySurah?.get(ref.surahNumber)?.get(ref.ayahNumber) || undefined,
      pageNumber: pageByVerseKey.get(ref.verseKey) || null,
      translations
    };
  });

  return { entry, sections, ayahs };
};

export const getPagePayload = async (
  pageNumber: number,
  translationIds: string[],
  includeTransliteration: boolean
): Promise<ScopePayload | null> => {
  const pageMeta = await loadPageMeta();
  const entry = pageMeta[String(pageNumber)];
  if (!entry) return null;
  return buildScopePayload(entry, translationIds, includeTransliteration);
};

export const getJuzPayload = async (
  juzNumber: number,
  translationIds: string[],
  includeTransliteration: boolean
): Promise<ScopePayload | null> => {
  const juzMeta = await loadJuzMeta();
  const entry = juzMeta[String(juzNumber)];
  if (!entry) return null;
  return buildScopePayload(entry, translationIds, includeTransliteration);
};
