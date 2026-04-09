import type { DailyReading } from "../../lib/types";
import type { ArabicFont, Reciter } from "./StudyModeTypes";
import type { TafsirEdition, TajweedLegendItem } from "./StudyModeHelpers";
import type { StudyScopeMode } from "./StudyScopeTypes";

export type QuickPanelTab = "study" | "tool" | "tafsir" | "search" | "notes" | "memorization";

type VerseRef = {
  surah: number;
  ayah: number;
};

export type PlanSummary =
  | null
  | { completed: true; dayIndex: number }
  | { error: string }
  | {
      dayIndex: number;
      startVerse: VerseRef | null;
      endVerse: VerseRef | null;
      todayStartIndex: number;
      todayEndIndex: number;
    };

export type FontScale = {
  arabic: number;
  translation: number;
};

export type SortedNote = {
  key: string;
  surah: number;
  ayah: number;
  value: string;
};

export type SearchResult = {
  surah?: number;
  ayah?: number;
  text?: string;
  translation?: string;
  matchType?: string;
  matchLabel?: string;
  page?: number | null;
  juz?: number | null;
  matchedRoot?: string | null;
};

export type StudyQuickPanelContentProps = {
  tab: QuickPanelTab;
  readingTime: number;
  progress: number;
  sortedBookmarks: string[];
  sortedNotes: SortedNote[];
  goalTarget: number;
  goalProgress: number;
  setGoalPerDay: (value: number) => void;
  planSummary: PlanSummary;
  surahByNumber: Map<number, { englishName: string }>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onClosePanel: () => void;
  formatTime: (seconds: number) => string;
  showTranslation: boolean;
  setShowTranslation: (value: boolean) => void;
  studyScopeMode: StudyScopeMode;
  setStudyScopeMode: (value: StudyScopeMode) => void;
  studyJuzNumber: number;
  setStudyJuzNumber: (value: number) => void;
  studyPageNumber: number;
  setStudyPageNumber: (value: number) => void;
  showStudyTransliteration: boolean;
  setShowStudyTransliteration: (value: boolean) => void;
  dimNonFocused: boolean;
  setDimNonFocused: (value: boolean) => void;
  autoScrollPlaying: boolean;
  setAutoScrollPlaying: (value: boolean) => void;
  fontScale: FontScale;
  setFontScale: (value: FontScale | ((prev: FontScale) => FontScale)) => void;
  clamp: (value: number, min: number, max: number) => number;
  playbackRate: number;
  setPlaybackRate: (value: number) => void;
  arabicFonts: ArabicFont[];
  arabicFontId: string;
  setArabicFontId: (value: string) => void;
  reciters: Reciter[];
  reciterId: string;
  setReciterId: (value: string) => void;
  showTajweed: boolean;
  setShowTajweed: (value: boolean) => void;
  showTajweedLegend: boolean;
  setShowTajweedLegend: (value: boolean | ((prev: boolean) => boolean)) => void;
  showHifzMode: boolean;
  setShowHifzMode: (value: boolean) => void;
  showWordByWord: boolean;
  setShowWordByWord: (value: boolean) => void;
  isMushafView: boolean;
  setIsMushafView: (value: boolean) => void;
  scriptStyle: "uthmani" | "naskh";
  setScriptStyle: (value: "uthmani" | "naskh") => void;
  tajweedLegend: TajweedLegendItem[];
  tafsirEdition: string;
  tafsirEditions: readonly TafsirEdition[];
  onChangeTafsirEdition: (edition: string) => void;
  selectedSurahNumber: number;
  selectedSurahName: string;
  focusedAyahNumber: number;
  currentAyahIndex: number;
  onUseCurrentAyah: () => void;
  tafsirLoading: boolean;
  tafsirError: string | null;
  tafsirText: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  runSearch: () => void;
  searchLoading: boolean;
  searchError: string | null;
  searchHasRun: boolean;
  searchResults: SearchResult[];
  onOpenRootDetails: (root: string) => void;
  onOpenNote: (surah: number, ayah: number) => void;
  todayVersesRead: number;
  weekTotal: number;
  currentStreak: number;
  weeklyData: DailyReading[];
  surahProgress: Record<number, number[]>;
  hifzMarks: Record<string, true>;
  totalAyahs: number;
  markHifzRange: (surahNumber: number, startAyah: number, endAyah: number) => void;
  clearHifzSurah: (surahNumber: number, totalAyahs: number) => void;
};
