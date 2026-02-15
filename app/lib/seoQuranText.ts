import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type VerseSeoText = {
  ar: string;
  en: string;
};

export type SurahSeoText = Record<string, VerseSeoText>;

const DATA_DIR = join(process.cwd(), "app", "data", "quran-seo");
const surahCache = new Map<number, Promise<SurahSeoText>>();

const fileNameForSurah = (surahNumber: number) =>
  `surah-${String(surahNumber).padStart(3, "0")}.json`;

const isVerseSeoText = (value: unknown): value is VerseSeoText =>
  Boolean(
    value
      && typeof value === "object"
      && typeof (value as { ar?: unknown }).ar === "string"
      && typeof (value as { en?: unknown }).en === "string"
  );

const normalizeSurahPayload = (payload: unknown): SurahSeoText => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  const record = payload as Record<string, unknown>;
  const out: SurahSeoText = {};
  for (const [ayahKey, verse] of Object.entries(record)) {
    const ayahNumber = Number(ayahKey);
    if (!Number.isInteger(ayahNumber) || ayahNumber < 1) continue;
    if (!isVerseSeoText(verse)) continue;
    out[String(ayahNumber)] = { ar: verse.ar, en: verse.en };
  }
  return out;
};

const loadSurahSeoTextInternal = async (surahNumber: number): Promise<SurahSeoText> => {
  const path = join(DATA_DIR, fileNameForSurah(surahNumber));
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return normalizeSurahPayload(parsed);
};

export const loadSurahSeoText = async (surahNumber: number): Promise<SurahSeoText> => {
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return {};
  }
  const cached = surahCache.get(surahNumber);
  if (cached) {
    return cached;
  }

  const pending = loadSurahSeoTextInternal(surahNumber).catch((error) => {
    surahCache.delete(surahNumber);
    throw error;
  });
  surahCache.set(surahNumber, pending);
  return pending;
};

export const loadVerseSeoText = async (surahNumber: number, ayahNumber: number) => {
  const surah = await loadSurahSeoText(surahNumber);
  return surah[String(ayahNumber)] || null;
};

export const loadFirstVerseSeoText = async (surahNumber: number) => {
  const surah = await loadSurahSeoText(surahNumber);
  return surah["1"] || null;
};
