"use client";

import { useCallback, useMemo, useState } from "react";
import { verseKey, parseVerseKey, copyToClipboard } from "../lib/utils";
import { useLastRead, useStudySession } from "./common";
import { useAudioPlayback } from "./useAudioPlayback";
import { useBookmarks, useNoteEditor } from "./useBookmarks";
import { useMemorization } from "./useMemorization";
import {
  useSurahs,
  useSurahDetails,
  useWordByWord,
  useTaqiTranslation
} from "./useQuranData";
import { useHomePreferences } from "./home/useHomePreferences";
import { useHomeFilters } from "./home/useHomeFilters";
import { useHomePlan } from "./home/useHomePlan";
import { useHomeEffects } from "./home/useHomeEffects";
import { useHomeShortcuts } from "./home/useHomeShortcuts";
import type {
  Ayah,
  LastRead,
  MemorizeConfig,
  NoteTarget,
  Notes,
  ReadingPlan,
  Surah,
  SurahData,
  WordBySurah
} from "./home/types";

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

  // Preferences
  const {
    readingPlan,
    setReadingPlan,
    fontScale,
    setFontScale,
    playbackRate,
    setPlaybackRate,
    reciterId,
    setReciterId,
    selectedReciter,
    arabicFontId,
    setArabicFontId,
    selectedArabicFont,
    theme,
    isLightTheme,
    toggleTheme
  } = useHomePreferences();

  // Last read
  const { lastRead, updateLastRead } = useLastRead();
  const { studySession, updateStudySession } = useStudySession();

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

  // UI State
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(["en.arberry"]);
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [goToAyahInput, setGoToAyahInput] = useState("");
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Filters
  const {
    query,
    setQuery,
    ayahQuery,
    setAyahQuery,
    filteredSurahs,
    filteredAyahs
  } = useHomeFilters(surahs, surahData as SurahData | null);

  // Advanced Data Hooks
  const {
    wordByAyah,
    loading: wordLoading,
    error: wordError,
    refetch: refetchWordByWord
  } = useWordByWord(selectedSurah?.number, showWordByWord || readingMode);
  const { cache: taqiCache, loading: taqiLoading, fetchTranslation: fetchTaqi } =
    useTaqiTranslation();

  // Plan Summary
  const { planSummary, formatRangeLabel } = useHomePlan(
    surahs,
    surahByNumber,
    readingPlan as ReadingPlan,
    setReadingPlan
  );

  // Effects
  useHomeEffects({
    surahs,
    selectedSurah,
    setSelectedSurah,
    focusedAyahKey,
    setFocusedAyahKey,
    pendingScroll,
    setPendingScroll,
    surahData: surahData as SurahData | null,
    updateLastRead,
    updateStudySession,
    reciterId,
    playbackRate,
    fontScale,
    readingMode,
    memorizeConfig,
    setMemorizeConfig,
    setIsAutoPlaying,
    setIsAudioPaused,
    nowPlaying,
    isAutoPlaying
  });

  // Sorted lists
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

  const nowPlayingLabel = nowPlaying
    ? `${surahByNumber.get(nowPlaying.surah)?.englishName || `Surah ${nowPlaying.surah}`} - Ayah ${nowPlaying.ayah}`
    : "Select an ayah to play.";

  // Actions
  const handleSelectSurah = (surah: Surah) => {
    stopMemorize();
    setSelectedSurah(surah);
    setSelectedAyah(null);
    setIsAutoPlaying(false);
    setNowPlaying(null);
    setIsAudioPaused(false);

    if (typeof window !== "undefined") {
      const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
      if (isMobileViewport) {
        // Mobile: avoid a second ayah-targeted scroll that conflicts with the panel smooth scroll.
        setPendingScroll(null);
      } else {
        const firstAyahKey = verseKey(surah.number, 1);
        setPendingScroll(1);
        setFocusedAyahKey(firstAyahKey);
      }
      window.requestAnimationFrame(() => {
        const readerPanel = document.querySelector(".reader-panel");
        if (readerPanel) {
          readerPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
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
      return;
    }

    window.prompt("Copy this ayah link:", url.toString());
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
  useHomeShortcuts({
    showShortcuts,
    setShowShortcuts,
    selectedAyah,
    setSelectedAyah,
    noteTarget: noteTarget as NoteTarget,
    closeNote,
    readingMode,
    setReadingMode,
    showWordByWord,
    setShowWordByWord,
    selectedSurah,
    surahData: surahData as SurahData | null,
    focusedAyahKey,
    setPendingScroll,
    setFocusedAyahKey,
    toggleBookmark,
    setNowPlaying
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
    playbackRate,
    setPlaybackRate,
    lastRead: lastRead as LastRead,
    studySession,
    updateLastRead,
    memorizeConfig,
    setMemorizeConfig,
    focusedAyahKey,
    setFocusedAyahKey,
    pendingScroll,
    setPendingScroll,
    nowPlaying,
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
