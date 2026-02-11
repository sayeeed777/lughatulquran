// =============================================
// Domain types — single source of truth
// =============================================

export type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type AyahTranslation = {
  text?: string;
};

export type Ayah = {
  number: number;
  arabic?: string;
  arabicTajweed?: string | null;
  pageNumber?: number | null;
  translations?: Record<string, AyahTranslation>;
};

export type Bookmark = string;

export type ReadingPlan = {
  startDate: string;
  perDay: number;
  startSurah: number;
  startAyah: number;
};

export type SurahData = {
  surah?: Surah;
  ayahs?: Ayah[];
};

// =============================================
// Audio & playback
// =============================================

export type Reciter = {
  id: string;
  label: string;
  baseUrl: string;
};

export type NowPlaying = {
  surah: number;
  ayah: number;
};

export type MemorizeConfig = {
  active: boolean;
  startAyah: number;
  endAyah: number;
  loops: number;
  remaining: number;
};

// =============================================
// Bookmarks, notes, last read
// =============================================

export type Notes = Record<string, string>;

export type NoteTarget = {
  surah: number;
  ayah: number;
  key: string;
};

export type LastRead = {
  surah: number;
  ayah: number;
  surahName: string;
  timestamp: number;
};

// =============================================
// Font & display
// =============================================

export type ArabicFont = {
  id: string;
  label: string;
  css: string;
};

export type FontScale = {
  arabic: number;
  translation: number;
};

// =============================================
// Prayer
// =============================================

export type PrayerSettings = {
  countryCode: string;
  countryName: string;
  city: string;
  timezone: string;
  method: string;
  madhab: string;
  latitude: number | null;
  longitude: number | null;
  geonameId: number | null;
};

export type NextPrayerPreview = {
  name: string;
  time: string;
};

export type PrayerLocationOption = {
  countryCode: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  geonameId: number | null;
};

export type SettingsTabId = "display" | "audio" | "prayer";

// =============================================
// Word-by-word
// =============================================

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

// =============================================
// Study session
// =============================================

export type StudySession = {
  surah: number;
  ayah: number;
  surahName: string;
  reciterId: string;
  playbackRate: number;
  fontScale: FontScale;
  updatedAt: number;
};

// =============================================
// Utilities
// =============================================

export type SetState<T> = (value: T | ((prev: T) => T)) => void;

export type ShortcutHandler = {
  keys: string[];
  handler: (event: KeyboardEvent) => void;
};

export type ShortcutConfig = Record<string, ShortcutHandler | string[]>;
