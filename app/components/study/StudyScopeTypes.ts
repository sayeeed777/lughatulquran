import type { MushafPageLayout } from "./StudyModeTypes";

export type StudyScopeMode = "surah" | "juz" | "page";

export type StudyScopeAyah = {
  surahNumber: number;
  number: number;
  verseKey: string;
  arabic?: string;
  arabicTajweed?: string | null;
  transliteration?: string;
  pageNumber?: number | null;
  translations?: Record<string, { text?: string }>;
};

export type StudyScopeSection = {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
};

export type StudyScopeMeta = {
  type: StudyScopeMode;
  id: number;
  label: string;
  versesCount: number;
  firstVerseKey: string;
  lastVerseKey: string;
};

export type StudyScopeResponse = {
  scope?: StudyScopeMeta;
  sections?: StudyScopeSection[];
  ayahs?: StudyScopeAyah[];
  layout?: MushafPageLayout | null;
};
