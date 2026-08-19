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
  transliteration?: string;
  audioUrl?: string;
  lemma?: string;
  root?: string;
  rootArabic?: string;
};

export type RootLexiconDerivative = {
  form: string;
  count: number;
  totalInQuran?: number;
};

export type RootLexiconSurahOccurrence = {
  surah: number;
  surahName: string;
  totalRootInSurah: number;
  derivatives: RootLexiconDerivative[];
};

export type RootLexiconAyahOccurrence = {
  surah: number;
  ayah: number;
  text: string;
  highlightedHtml?: string;
  derivedForms: string[];
};

export type RootLexiconLexEntry = {
  id: string;
  label: string;
  definitionHtml: string;
  isRoot?: boolean;
  isMain?: boolean;
};

export type RootLexiconLexSnapshot = {
  wordGrammar?: string | null;
  derivativeNote?: string | null;
  rootDefinitionHtml?: string | null;
  mainDefinitionHtml?: string | null;
  mainEntryId?: string | null;
  entries: RootLexiconLexEntry[];
  source?: {
    provider?: string;
    fetchedAt?: string | null;
    refword?: string | null;
    lexword?: string | null;
  } | null;
};

export type RootLexiconStats = {
  totalOccurrences: number;
  derivativeCount: number;
  surahCount: number;
  ayahCount: number;
};

export type RootLexiconSource = {
  provider?: string;
  fetchedAt?: string | null;
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
  rootExplorerAvailable?: boolean;
  rootExplorerError?: string | null;
  rootExplorerSource?: RootLexiconSource | null;
  stats?: RootLexiconStats | null;
  derivatives?: RootLexiconDerivative[];
  surahOccurrences?: RootLexiconSurahOccurrence[];
  ayahOccurrences?: RootLexiconAyahOccurrence[];
  lexSnapshot?: RootLexiconLexSnapshot | null;
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
