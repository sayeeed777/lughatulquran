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
  transliteration?: string;
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

export type ReaderRepeatMode = 1 | 2 | 3 | 0;

export type ReaderRepeatState = {
  surah: number;
  ayah: number;
  mode: ReaderRepeatMode | null;
};

export type ChapterWordTiming = {
  position: number;
  fromMs: number;
  toMs: number;
};

export type ChapterVerseTiming = {
  ayah: number;
  fromMs: number;
  toMs: number;
  words: ChapterWordTiming[];
};

export type ChapterAudioTimingSnapshot = {
  reciterId: string;
  reciterApiId: number;
  surah: number;
  audioUrl: string;
  timings: ChapterVerseTiming[];
  source?: {
    provider?: string;
    fetchedAt?: string | null;
  };
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

export type AudioNoteMeta = {
  id: string;
  title: string;
  durationMs: number;
  mimeType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
};

export type AudioNote = AudioNoteMeta & {
  audioUrl: string;
};

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
// Reading stats & history
// =============================================

export type DailyReading = {
  date: string;
  versesRead: number;
  minutesRead: number;
  surahsVisited: number[];
};

export type ReadingStats = {
  history: DailyReading[];
  currentStreak: number;
  longestStreak: number;
  totalVersesRead: number;
  surahProgress: Record<number, number[]>;
};

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
// Reader scope (juz / page navigation)
// =============================================

export type ReaderScopeMode = "surah" | "juz" | "page";

export type ScopeAyah = {
  surahNumber: number;
  number: number;
  verseKey: string;
  arabic?: string;
  arabicTajweed?: string | null;
  transliteration?: string;
  pageNumber?: number | null;
  translations?: Record<string, AyahTranslation>;
};

export type ScopeMeta = {
  type: string;
  id: number;
  label: string;
  versesCount: number;
  firstVerseKey: string;
  lastVerseKey: string;
};

// =============================================
// Memorization / SRS
// =============================================

export type MemorizationScopeMode = "surah" | "juz" | "page";

export type MemorizationCardMode =
  | "arabic-to-meaning"
  | "meaning-to-arabic"
  | "first-words"
  | "word-by-word-meaning";

export type MemorizationRating = "again" | "hard" | "good" | "easy";

export type MemorizationCard = {
  id: string;
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number | null;
  scopeMode: MemorizationScopeMode;
  scopeId: number;
  scopeLabel: string;
  translationId: "en-haleem" | "wbw-quran-com";
  cardMode: MemorizationCardMode;
  arabic: string;
  englishMeaning: string;
  transliteration?: string;
  firstWords: string;
  hint: string;
  audioUrl: string;
  wordArabic?: string;
  wordMeaning?: string;
  wordPosition?: number;
  contextArabic?: string;
  contextMeaning?: string;
};

export type MemorizationCardStatus = "new" | "learning" | "review" | "relearning";

export type MemorizationCardState = {
  status: MemorizationCardStatus;
  dueAt: number;
  lastReviewedAt: number | null;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  learningStep: number;
  suspended: boolean;
};

export type MemorizationProgressStore = Record<string, MemorizationCardState>;

export type MemorizationSettings = {
  newCardsPerDay: number;
  maxReviewsPerDay: number;
  learningStepsMinutes: number[];
  graduatingIntervalDays: number;
  easyIntervalDays: number;
  maxIntervalDays: number;
  leechThreshold: number;
  autoSuspendLeeches: boolean;
};

export type MemorizationDeckMeta = {
  scopeMode: MemorizationScopeMode;
  scopeId: number;
  scopeLabel: string;
  cardMode: MemorizationCardMode;
  translationId: "en-haleem" | "wbw-quran-com";
  totalCards: number;
};

export type MemorizationDeckResponse = {
  deck: MemorizationDeckMeta;
  cards: MemorizationCard[];
};

// =============================================
// Mushaf page layout
// =============================================

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

// =============================================
// Utilities
// =============================================

export type SetState<T> = (value: T | ((prev: T) => T)) => void;

export type ShortcutHandler = {
  keys: string[];
  handler: (event: KeyboardEvent) => void;
};

export type ShortcutConfig = Record<string, ShortcutHandler | string[]>;
