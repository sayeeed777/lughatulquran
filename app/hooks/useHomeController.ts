"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AUDIO_RECITERS, ARABIC_FONTS, STORAGE_KEYS } from "../lib/constants";
import {
  getLocalDateString,
  parseLocalDate,
  verseKey,
  parseVerseKey,
  copyToClipboard
} from "../lib/utils";
import { useLocalStorage, useLastRead, useKeyboardShortcuts } from "./common";
import { useAudioPlayback } from "./useAudioPlayback";
import { useBookmarks, useNoteEditor } from "./useBookmarks";
import { useMemorization } from "./useMemorization";
import {
  useSurahs,
  useSurahDetails,
  useWordByWord,
  useTaqiTranslation
} from "./useQuranData";
import { useReadingPlan, useFontScale } from "./useAppSettings";

type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

type AyahTranslation = {
  label?: string;
  text?: string;
};

type Ayah = {
  number: number;
  arabic?: string;
  translations?: Record<string, AyahTranslation>;
};

type SurahData = {
  surah?: Surah;
  ayahs?: Ayah[];
};

type MemorizeConfig = {
  active: boolean;
  startAyah: number;
  endAyah: number;
  loops: number;
  remaining: number;
};

type Reciter = {
  id: string;
  label: string;
  baseUrl: string;
};

type ArabicFont = {
  id: string;
  label: string;
  css: string;
};

type ReadingPlan = {
  startDate: string;
  perDay: number;
  startSurah: number;
  startAyah: number;
};

type Word = {
  arabic: string;
  translation?: string;
  audioUrl?: string;
};

type WordByAyah = Record<number, Word[]>;

type WordBySurah = Record<number, WordByAyah>;

type NowPlaying = {
  surah: number;
  ayah: number;
} | null;

type LastRead = {
  surah: number;
  ayah: number;
  surahName: string;
  timestamp: number;
} | null;

type Notes = Record<string, string>;

type NoteTarget = {
  surah: number;
  ayah: number;
  key: string;
} | null;

export function useHomeController() {
  // Data hooks
  const {
    surahs,
    loading: loadingSurahs,
    error: surahsError,
    surahByNumber,
    refetch: refetchSurahs
  } = useSurahs();
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const {
    surahData,
    loading: loadingSurahData,
    error: surahDataError,
    refetch: refetchSurahDetails
  } = useSurahDetails(selectedSurah?.number);

  // Bookmarks & Notes
  const { bookmarks, notes, setNotes, toggleBookmark } = useBookmarks();
  const {
    noteTarget,
    noteDraft,
    setNoteDraft,
    openNote,
    saveNote,
    closeNote
  } = useNoteEditor(notes as Notes, setNotes);

  // Reading plan + font scale + last read
  const [readingPlan, setReadingPlan] = useReadingPlan();
  const [fontScale, setFontScale] = useFontScale();
  const { lastRead, updateLastRead } = useLastRead();

  // Memorization state (shared by audio + memorize flows)
  const [memorizeConfig, setMemorizeConfig] = useState<MemorizeConfig>({
    active: false,
    startAyah: 1,
    endAyah: 5,
    loops: 0,
    remaining: 0
  });

  // Focus + audio state (used by audio hook)
  const [focusedAyahKey, setFocusedAyahKey] = useState<string | null>(null);
  const [pendingScroll, setPendingScroll] = useState<number | null>(null);

  // Audio Logic
  const {
    nowPlaying,
    isAutoPlaying,
    isAudioPaused,
    handlePlaySurah,
    handleStopAutoPlay,
    handleAudioEnded,
    handlePlayAyah,
    handleToggleAyah,
    setNowPlaying,
    setIsAutoPlaying,
    setIsAudioPaused
  } = useAudioPlayback({
    selectedSurah,
    memorizeConfig,
    setMemorizeConfig,
    setFocusedAyahKey,
    setPendingScroll
  });

  // Memorization Logic (depends on audio setters)
  const { startMemorize, stopMemorize } = useMemorization({
    selectedSurah,
    setMemorizeConfig,
    setNowPlaying,
    setIsAutoPlaying,
    setIsAudioPaused,
    setFocusedAyahKey,
    setPendingScroll
  });

  // Reciter State (Store ID, derive Object)
  const [reciterId, setReciterId] = useLocalStorage(
    STORAGE_KEYS.reciter,
    AUDIO_RECITERS[0].id
  ) as [string, (value: string | ((prev: string) => string)) => void, boolean];
  const selectedReciter = useMemo<Reciter>(
    () => AUDIO_RECITERS.find((r) => r.id === reciterId) || AUDIO_RECITERS[0],
    [reciterId]
  );
  const [arabicFontId, setArabicFontId] = useLocalStorage(
    STORAGE_KEYS.arabicFont,
    ARABIC_FONTS[0].id
  ) as [string, (value: string | ((prev: string) => string)) => void, boolean];
  const selectedArabicFont = useMemo<ArabicFont>(
    () => ARABIC_FONTS.find((font) => font.id === arabicFontId) || ARABIC_FONTS[0],
    [arabicFontId]
  );

  // UI State
  const [query, setQuery] = useState("");
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(["en.arberry"]);
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [ayahQuery, setAyahQuery] = useState("");
  const [goToAyahInput, setGoToAyahInput] = useState("");
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isLightTheme = theme === "light";

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      if (storedTheme) {
        setTheme(JSON.parse(storedTheme));
      } else {
        const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
        setTheme(prefersLight ? "light" : "dark");
      }
    } catch {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  // Advanced Data Hooks
  const {
    wordByAyah,
    loading: wordLoading,
    error: wordError,
    refetch: refetchWordByWord
  } = useWordByWord(selectedSurah?.number, showWordByWord || readingMode);
  const { cache: taqiCache, loading: taqiLoading, fetchTranslation: fetchTaqi } =
    useTaqiTranslation();

  // Initial Surah Selection & URL handling
  useEffect(() => {
    if (!surahs.length || selectedSurah) return;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const surahParam = Number(params.get("surah"));
      const ayahParam = Number(params.get("ayah"));
      const hashMatch = window.location.hash.match(/ayah-(\d+)/);
      const hashAyah = hashMatch ? Number(hashMatch[1]) : null;

      const targetSurah = surahs.find((surah) => surah.number === surahParam);
      if (targetSurah) {
        setSelectedSurah(targetSurah);
        const targetAyah = ayahParam || hashAyah;
        if (targetAyah) {
          setPendingScroll(targetAyah);
          setFocusedAyahKey(verseKey(targetSurah.number, targetAyah));
        }
        return;
      }
    }
    setSelectedSurah(surahs[0] || null);
  }, [surahs, selectedSurah]);

  // Sync URL with selection
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSurah) return;
    const url = new URL(window.location.href);
    url.searchParams.set("surah", String(selectedSurah.number));
    if (focusedAyahKey) {
      const { ayah } = parseVerseKey(focusedAyahKey);
      url.searchParams.set("ayah", String(ayah));
    } else {
      url.searchParams.delete("ayah");
    }
    window.history.replaceState({}, "", url);
  }, [selectedSurah, focusedAyahKey]);

  // Update Last Read
  useEffect(() => {
    if (!selectedSurah || !focusedAyahKey) return;
    const { surah, ayah } = parseVerseKey(focusedAyahKey);
    updateLastRead(surah, ayah, selectedSurah.englishName);
  }, [focusedAyahKey, selectedSurah, updateLastRead]);

  // Stop memorize when exiting study mode
  useEffect(() => {
    if (readingMode) return;
    if (!memorizeConfig.active) return;
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
  }, [readingMode, memorizeConfig.active, setIsAutoPlaying, setIsAudioPaused]);

  // Pending Scroll Logic
  useEffect(() => {
    if (!pendingScroll || !surahData?.surah || !selectedSurah) return;
    if (surahData.surah.number !== selectedSurah.number) return;

    const timer = setTimeout(() => {
      const target = document.getElementById(`ayah-${pendingScroll}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setFocusedAyahKey(verseKey(selectedSurah.number, pendingScroll));
      }
    }, 100);
    setPendingScroll(null);
    return () => clearTimeout(timer);
  }, [pendingScroll, surahData, selectedSurah]);

  // Auto-scroll to currently playing ayah during auto-play
  useEffect(() => {
    if (!isAutoPlaying || !nowPlaying || !selectedSurah) return;
    if (nowPlaying.surah !== selectedSurah.number) return;

    const timer = setTimeout(() => {
      const target = document.getElementById(`ayah-${nowPlaying.ayah}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nowPlaying, isAutoPlaying, selectedSurah]);

  // Validate Reading Plan Start
  useEffect(() => {
    if (!readingPlan.startSurah) return;
    const info = surahByNumber.get(Number(readingPlan.startSurah));
    if (!info) return;
    if (readingPlan.startAyah > info.numberOfAyahs) {
      setReadingPlan((prev) => ({ ...prev, startAyah: info.numberOfAyahs }));
    }
  }, [readingPlan.startSurah, readingPlan.startAyah, surahByNumber, setReadingPlan]);

  // Surah Indexing for Plan
  const surahIndex = useMemo(() => {
    let offset = 0;
    return surahs.map((surah) => {
      const start = offset + 1;
      const end = offset + surah.numberOfAyahs;
      offset = end;
      return { number: surah.number, start, end };
    });
  }, [surahs]);

  const totalAyahs = surahIndex.length ? surahIndex[surahIndex.length - 1].end : 0;

  const getGlobalIndex = (surahNumber: number, ayahNumber: number) => {
    const entry = surahIndex.find((item) => item.number === surahNumber);
    if (!entry) return null;
    return entry.start + ayahNumber - 1;
  };

  const indexToVerse = (globalIndex: number) => {
    const entry = surahIndex.find(
      (item) => globalIndex >= item.start && globalIndex <= item.end
    );
    if (!entry) return null;
    return { surah: entry.number, ayah: globalIndex - entry.start + 1 };
  };

  // Plan Summary
  const planSummary = useMemo(() => {
    if (!surahIndex.length) return null;
    const perDay = Math.max(1, Number(readingPlan.perDay));
    const startSurah = Number(readingPlan.startSurah);
    const startAyah = Math.max(1, Number(readingPlan.startAyah));

    const startIndex = getGlobalIndex(startSurah, startAyah);
    if (!startIndex) return { error: "Start position is not available." };

    let startDateValue = parseLocalDate(readingPlan.startDate || getLocalDateString());
    if (Number.isNaN(startDateValue.getTime())) {
      startDateValue = parseLocalDate(getLocalDateString());
    }

    const todayValue = parseLocalDate(getLocalDateString());
    const dayIndex = Math.max(
      0,
      Math.floor((todayValue.getTime() - startDateValue.getTime()) / 86400000)
    );

    const todayStartIndex = startIndex + dayIndex * perDay;
    if (todayStartIndex > totalAyahs) {
      return { completed: true, dayIndex };
    }

    const todayEndIndex = Math.min(todayStartIndex + perDay - 1, totalAyahs);
    const startVerse = indexToVerse(todayStartIndex);
    const endVerse = indexToVerse(todayEndIndex);

    return { dayIndex, startVerse, endVerse, todayStartIndex, todayEndIndex };
  }, [readingPlan, surahIndex, totalAyahs]);

  // Filtered Data
  const filteredSurahs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return surahs;
    return surahs.filter(
      (surah) =>
        surah.englishName.toLowerCase().includes(trimmed) ||
        surah.englishNameTranslation.toLowerCase().includes(trimmed) ||
        String(surah.number).includes(trimmed)
    );
  }, [query, surahs]);

  const filteredAyahs = useMemo(() => {
    if (!surahData?.ayahs) return [];
    const trimmed = ayahQuery.trim().toLowerCase();
    if (!trimmed) return surahData.ayahs;
    if (/^\d+$/.test(trimmed)) {
      return surahData.ayahs.filter((ayah) => ayah.number === Number(trimmed));
    }
    return surahData.ayahs.filter((ayah) => {
      const combined = Object.values(ayah.translations || {})
        .map((t) => t.text || "")
        .join(" ")
        .toLowerCase();
      return combined.includes(trimmed);
    });
  }, [ayahQuery, surahData]);

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      const first = parseVerseKey(a);
      const second = parseVerseKey(b);
      if (first.surah !== second.surah) return first.surah - second.surah;
      return first.ayah - second.ayah;
    });
  }, [bookmarks]);

  const sortedNotes = useMemo(() => {
    return Object.entries(notes as Notes)
      .map(([key, value]) => ({ key, value, ...parseVerseKey(key) }))
      .sort((a, b) => {
        if (a.surah !== b.surah) return a.surah - b.surah;
        return a.ayah - b.ayah;
      });
  }, [notes]);

  // Labels
  const formatVerseLabel = (verse: { surah: number; ayah: number } | null) => {
    if (!verse) return "";
    const surah = surahByNumber.get(verse.surah);
    return `${surah ? surah.englishName : `Surah ${verse.surah}`} Ayah ${verse.ayah}`;
  };

  const formatRangeLabel = (
    startVerse: { surah: number; ayah: number } | null,
    endVerse: { surah: number; ayah: number } | null
  ) => {
    if (!startVerse || !endVerse) return "";
    if (startVerse.surah === endVerse.surah) {
      const surah = surahByNumber.get(startVerse.surah);
      return `${surah ? surah.englishName : `Surah ${startVerse.surah}`} Ayah ${
        startVerse.ayah
      } to ${endVerse.ayah}`;
    }
    return `${formatVerseLabel(startVerse)} to ${formatVerseLabel(endVerse)}`;
  };

  const nowPlayingLabel = nowPlaying
    ? `${surahByNumber.get(nowPlaying.surah)?.englishName || `Surah ${nowPlaying.surah}`} - Ayah ${nowPlaying.ayah}`
    : "Select an ayah to play.";

  // Actions
  const handleSelectSurah = (surah: Surah) => {
    stopMemorize();
    setSelectedSurah(surah);
    setSelectedAyah(null);
    setFocusedAyahKey(null);
    setIsAutoPlaying(false);
    setNowPlaying(null);
    setIsAudioPaused(false);

    if (typeof window !== "undefined" && window.innerWidth <= 1100) {
      setTimeout(() => {
        const readerPanel = document.querySelector(".reader-panel");
        if (readerPanel) {
          readerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handleGoToAyah = () => {
    if (!selectedSurah) return;
    const number = Number(goToAyahInput);
    if (!number || number < 1 || number > selectedSurah.numberOfAyahs) return;
    setPendingScroll(number);
    setFocusedAyahKey(verseKey(selectedSurah.number, number));
  };

  const jumpToAyah = (surahNumber: number, ayahNumber: number) => {
    const targetSurah = surahByNumber.get(surahNumber);
    if (!targetSurah) return;
    setSelectedSurah(targetSurah as Surah);
    setPendingScroll(ayahNumber);
    setFocusedAyahKey(verseKey(surahNumber, ayahNumber));
  };

  const copyAyahLink = useCallback(async (surahNumber: number, ayahNumber: number) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("surah", String(surahNumber));
    url.searchParams.set("ayah", String(ayahNumber));
    url.hash = `ayah-${ayahNumber}`;

    if (await copyToClipboard(url.toString())) {
      const key = verseKey(surahNumber, ayahNumber);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1600);
    }
  }, []);

  const handleCompare = (ayah: Ayah) => {
    if (!selectedSurah) return;
    setSelectedAyah(ayah);
    setFocusedAyahKey(verseKey(selectedSurah.number, ayah.number));
    fetchTaqi(selectedSurah.number, ayah.number);
  };

  const retryData = useCallback(() => {
    refetchSurahs();
    if (selectedSurah?.number) {
      refetchSurahDetails();
      if (showWordByWord || readingMode) {
        refetchWordByWord(selectedSurah.number);
      }
    }
  }, [
    refetchSurahs,
    refetchSurahDetails,
    refetchWordByWord,
    selectedSurah?.number,
    showWordByWord,
    readingMode
  ]);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    "Show Shortcuts": { keys: ["?"], handler: () => setShowShortcuts((p) => !p) },
    "Close Modal": {
      keys: ["Escape"],
      handler: () => {
        if (showShortcuts) setShowShortcuts(false);
        else if (selectedAyah) setSelectedAyah(null);
        else if (noteTarget) closeNote();
        else if (readingMode) setReadingMode(false);
      }
    },
    "Study Mode": { keys: ["f"], handler: () => setReadingMode((p) => !p) },
    "Word by Word": { keys: ["w"], handler: () => setShowWordByWord((p) => !p) },
    "Next Ayah": {
      keys: ["ArrowDown", "j"],
      handler: () => {
        if (!selectedSurah || !surahData) return;
        const current = focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : 1;
        const next = Math.min(current + 1, selectedSurah.numberOfAyahs);
        setPendingScroll(next);
        setFocusedAyahKey(verseKey(selectedSurah.number, next));
      }
    },
    "Prev Ayah": {
      keys: ["ArrowUp", "k"],
      handler: () => {
        if (!selectedSurah || !surahData) return;
        const current = focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : 1;
        const prev = Math.max(current - 1, 1);
        setPendingScroll(prev);
        setFocusedAyahKey(verseKey(selectedSurah.number, prev));
      }
    },
    "Toggle Bookmark": {
      keys: ["b"],
      handler: () => {
        if (focusedAyahKey) {
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          toggleBookmark(surah, ayah);
        }
      }
    },
    "Play Audio": {
      keys: ["p"],
      handler: () => {
        if (focusedAyahKey) {
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          setNowPlaying({ surah, ayah });
        }
      }
    }
  });

  return {
    surahs,
    loadingSurahs,
    surahsError,
    surahByNumber,
    selectedSurah,
    setSelectedSurah,
    surahData: surahData as SurahData | null,
    loadingSurahData,
    surahDataError,
    bookmarks,
    notes,
    toggleBookmark,
    openNote,
    saveNote,
    setNotes,
    readingPlan: readingPlan as ReadingPlan,
    setReadingPlan,
    fontScale,
    setFontScale,
    lastRead: lastRead as LastRead,
    updateLastRead,
    memorizeConfig,
    setMemorizeConfig,
    focusedAyahKey,
    setFocusedAyahKey,
    pendingScroll,
    setPendingScroll,
    nowPlaying: nowPlaying as NowPlaying,
    isAutoPlaying,
    isAudioPaused,
    handlePlaySurah,
    handleStopAutoPlay,
    handleAudioEnded,
    handlePlayAyah,
    handleToggleAyah,
    startMemorize,
    stopMemorize,
    reciterId,
    setReciterId,
    selectedReciter,
    arabicFontId,
    setArabicFontId,
    selectedArabicFont,
    query,
    setQuery,
    selectedTranslations,
    setSelectedTranslations,
    selectedAyah,
    setSelectedAyah,
    ayahQuery,
    setAyahQuery,
    goToAyahInput,
    setGoToAyahInput,
    showWordByWord,
    setShowWordByWord,
    copiedKey,
    setCopiedKey,
    noteTarget: noteTarget as NoteTarget,
    noteDraft,
    setNoteDraft,
    closeNote,
    readingMode,
    setReadingMode,
    showShortcuts,
    setShowShortcuts,
    showMobileSettings,
    setShowMobileSettings,
    showMobileSearch,
    setShowMobileSearch,
    theme,
    isLightTheme,
    toggleTheme,
    wordByAyah: wordByAyah as WordBySurah,
    wordLoading,
    wordError,
    taqiCache,
    taqiLoading,
    fetchTaqi,
    retryData,
    filteredSurahs,
    filteredAyahs,
    sortedBookmarks,
    sortedNotes,
    planSummary,
    formatRangeLabel,
    nowPlayingLabel,
    handleSelectSurah,
    handleGoToAyah,
    jumpToAyah,
    copyAyahLink,
    handleCompare
  };
}
