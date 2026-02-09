export type Reciter = { id: string; label: string; baseUrl: string };

export type ArabicFont = { id: string; label: string; css: string };

export type MemorizeConfig = {
  active: boolean;
  startAyah: number;
  endAyah: number;
  loops: number;
  remaining: number;
};

export type Word = {
  arabic: string;
  translation?: string;
  audioUrl?: string;
  position?: number;
  lemma?: string;
  root?: string;
  rootArabic?: string;
};

export type WordByAyah = Record<number, Word[]>;

export type WordBySurah = Record<number, WordByAyah>;

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
