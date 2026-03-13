/**
 * Re-export shared types from the central types module.
 * Study-specific types are declared locally below.
 */
export type {
  Reciter,
  ArabicFont,
  MemorizeConfig,
  Word,
  WordByAyah,
  WordBySurah
} from "../../lib/types";

import type { WordByAyah } from "../../lib/types";

export type SelectedWordDetails = {
  surah: number;
  ayah: number;
  position: number;
  arabic: string;
  translation?: string;
  audioUrl?: string;
  lemma?: string;
  root?: string;
  rootArabic?: string;
};

export type RootLexiconPayload = {
  root: string;
  rootArabic?: string;
  rootMeaning?: string | null;
  rootMeaningSource?: string;
  coreMeanings?: string[];
  definitions?: string[];
  lemmas?: string[];
  references?: string[];
  primaryRootMeaningsAvailable?: boolean;
  primaryRootMeaningsError?: string | null;
  laneAvailable?: boolean;
  morphologyAvailable?: boolean;
  morphologyError?: string | null;
  fullPayload?: boolean;
};

export type WordByWordPayload = {
  wordsByAyah?: WordByAyah;
};

export type StudyMarks = Record<string, true>;

export type MushafPageSegment = {
  type: "word" | "marker";
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  position: number | null;
  glyph?: string;
  text: string;
};

export type MushafPageLine = {
  lineNumber: number;
  segments: MushafPageSegment[];
};

export type MushafPageLayout = {
  pageNumber: number;
  mushaf: string;
  firstVerseKey: string;
  lastVerseKey: string;
  versesCount: number;
  surahs: number[];
  lines: MushafPageLine[];
};

export const TOTAL_MUSHAF_PAGES = 604;
