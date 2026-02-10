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
};

export type WordByWordPayload = {
  wordsByAyah?: WordByAyah;
};

export type StudyMarks = Record<string, true>;

