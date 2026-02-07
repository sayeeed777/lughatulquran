import type { Ayah, AyahTranslation, ReadingPlan, Surah, SurahData } from "../../lib/types";

export type { Ayah, AyahTranslation, ReadingPlan, Surah, SurahData };

export type MemorizeConfig = {
  active: boolean;
  startAyah: number;
  endAyah: number;
  loops: number;
  remaining: number;
};

export type Reciter = {
  id: string;
  label: string;
  baseUrl: string;
};

export type ArabicFont = {
  id: string;
  label: string;
  css: string;
};

export type Word = {
  arabic: string;
  translation?: string;
  audioUrl?: string;
};

export type WordByAyah = Record<number, Word[]>;

export type WordBySurah = Record<number, WordByAyah>;

export type NowPlaying = {
  surah: number;
  ayah: number;
} | null;

export type LastRead = {
  surah: number;
  ayah: number;
  surahName: string;
  timestamp: number;
} | null;

export type Notes = Record<string, string>;

export type NoteTarget = {
  surah: number;
  ayah: number;
  key: string;
} | null;
