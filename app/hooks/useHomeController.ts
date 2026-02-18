"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { verseKey, copyToClipboard } from "../lib/utils";
import { useLastRead, useStudySession, useLocalStorage } from "./common";
import { useAudioPlayback } from "./useAudioPlayback";
import { useBookmarks, useNoteEditor } from "./useBookmarks";
import { useMemorization } from "./useMemorization";
import {
  useSurahs,
  useSurahDetails,
  useWordByWord
} from "./useQuranData";
import { useHomePreferences } from "./home/useHomePreferences";
import { useHomeFilters } from "./home/useHomeFilters";
import { useHomePlan } from "./home/useHomePlan";
import { useHomeEffects } from "./home/useHomeEffects";
import { useHomeShortcuts } from "./home/useHomeShortcuts";
import { ALL_TRANSLATIONS, STORAGE_KEYS } from "../lib/constants";
import {
  defaultTranslationForLocale,
  localeFromPathname,
  localeFromTranslationIds,
  LOCALE_COOKIE
} from "../lib/locales";
import type {
  Ayah,
  LastRead,
  MemorizeConfig,
  NoteTarget,
  NextPrayerPreview,
  Notes,
  ReadingPlan,
  SettingsTabId,
  Surah,
  SurahData,
  WordBySurah
} from "./home/types";

type PrayerTimePayload = {
  nextPrayer?: {
    name?: string;
    display?: string;
    time?: string;
  };
};

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

  const availableTranslationIds = useMemo(
    () => new Set(ALL_TRANSLATIONS.map((t) => t.id)),
    []
  );

  const [storedTranslations, setStoredTranslations, areTranslationsLoaded] = useLocalStorage(
    STORAGE_KEYS.translations,
    ["en-arberry"]
  );
  const [hasStoredTranslations, setHasStoredTranslations] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasStoredTranslations(window.localStorage.getItem(STORAGE_KEYS.translations) !== null);
  }, []);

  // First visit on locale-prefixed routes should start with a matching translation.
  useEffect(() => {
    if (!areTranslationsLoaded) return;
    if (hasStoredTranslations !== false) return;
    if (typeof window === "undefined") return;

    const routeLocale = localeFromPathname(window.location.pathname) || "en";
    setStoredTranslations([defaultTranslationForLocale(routeLocale)]);
    setHasStoredTranslations(true);
  }, [areTranslationsLoaded, hasStoredTranslations, setStoredTranslations]);

  const selectedTranslations = useMemo(() => {
    const input = Array.isArray(storedTranslations) ? storedTranslations : ["en-arberry"];
    const unique: string[] = [];
    const seen = new Set<string>();

    for (const id of input) {
      if (typeof id !== "string") continue;
      if (!availableTranslationIds.has(id)) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(id);
    }

    return unique.length ? unique : ["en-arberry"];
  }, [availableTranslationIds, storedTranslations]);

  // Keep localStorage tidy if older/invalid IDs were stored.
  useEffect(() => {
    if (!areTranslationsLoaded) return;
    const stored = Array.isArray(storedTranslations) ? storedTranslations : [];
    if (stored.length === selectedTranslations.length && stored.every((v, i) => v === selectedTranslations[i])) {
      return;
    }
    setStoredTranslations(selectedTranslations);
  }, [areTranslationsLoaded, selectedTranslations, setStoredTranslations, storedTranslations]);

  // Persist preferred locale for root redirects (/, legacy links).
  useEffect(() => {
    if (!areTranslationsLoaded) return;
    if (typeof document === "undefined") return;
    const locale = localeFromTranslationIds(selectedTranslations);
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [areTranslationsLoaded, selectedTranslations]);

  const setSelectedTranslations = setStoredTranslations;
  const {
    surahData,
    loading: loadingSurahData,
    error: surahDataError,
    refetch: refetchSurahDetails
  } = useSurahDetails(selectedSurah?.number, selectedTranslations);

  // Bookmarks & Notes
  const { bookmarks, notes, setNotes, toggleBookmark, sortedBookmarks, sortedNotes } = useBookmarks();
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
    prayerSettings,
    setPrayerSettings,
    theme,
    isLightTheme,
    setTheme
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
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [goToAyahInput, setGoToAyahInput] = useState("");
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>("display");
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [nextPrayerPreview, setNextPrayerPreview] = useState<NextPrayerPreview | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = window.setInterval(() => setClockTick(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const hasPrayerLocation = Boolean(
    String(prayerSettings.countryCode || "").trim()
      && String(prayerSettings.city || "").trim()
  );

  useEffect(() => {
    if (!hasPrayerLocation) {
      setNextPrayerPreview(null);
      return;
    }

    const abortController = new AbortController();
    const params = new URLSearchParams({
      countryCode: String(prayerSettings.countryCode || "").trim(),
      city: String(prayerSettings.city || "").trim(),
      timezone: String(prayerSettings.timezone || "").trim(),
      method: String(prayerSettings.method || "MWL"),
      madhab: String(prayerSettings.madhab || "SHAFI")
    });

    if (Number.isFinite(prayerSettings.latitude) && Number.isFinite(prayerSettings.longitude)) {
      params.set("latitude", String(prayerSettings.latitude));
      params.set("longitude", String(prayerSettings.longitude));
    }

    const loadNextPrayer = async () => {
      try {
        const response = await fetch(`/api/prayer-times?${params.toString()}`, {
          signal: abortController.signal,
          cache: "no-store"
        });
        if (!response.ok) {
          setNextPrayerPreview(null);
          return;
        }
        const payload = (await response.json()) as PrayerTimePayload;
        const name = String(payload?.nextPrayer?.name || "").trim();
        const display = String(payload?.nextPrayer?.display || payload?.nextPrayer?.time || "").trim();
        if (!name || !display) {
          setNextPrayerPreview(null);
          return;
        }
        setNextPrayerPreview({ name, time: display });
      } catch {
        if (abortController.signal.aborted) return;
        setNextPrayerPreview(null);
      }
    };

    loadNextPrayer();

    return () => {
      abortController.abort();
    };
  }, [
    clockTick,
    hasPrayerLocation,
    prayerSettings.city,
    prayerSettings.countryCode,
    prayerSettings.latitude,
    prayerSettings.longitude,
    prayerSettings.madhab,
    prayerSettings.method,
    prayerSettings.timezone
  ]);

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
        setPendingScroll(null);
        setFocusedAyahKey(firstAyahKey);
      }
      window.requestAnimationFrame(() => {
        const readerPanel = document.querySelector<HTMLElement>(".reader-panel");
        if (!readerPanel) return;
        readerPanel.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
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
    data: {
      surahs,
      loadingSurahs,
      surahsError,
      surahByNumber,
      selectedSurah,
      surahData: surahData as SurahData | null,
      loadingSurahData,
      surahDataError,
      filteredSurahs,
      filteredAyahs,
      wordByAyah: wordByAyah as WordBySurah,
      wordLoading,
      wordError
    },
    audio: {
      nowPlaying,
      isAutoPlaying,
      isAudioPaused,
      nowPlayingLabel,
      handlePlaySurah,
      handleStopAutoPlay,
      handleAudioEnded,
      handlePlayAyah,
      handleToggleAyah,
      reciterId,
      setReciterId,
      selectedReciter,
      playbackRate,
      setPlaybackRate
    },
    bookmarks: {
      bookmarks,
      notes,
      toggleBookmark,
      openNote,
      saveNote,
      closeNote,
      sortedBookmarks,
      sortedNotes,
      noteTarget: noteTarget as NoteTarget,
      noteDraft,
      setNoteDraft
    },
    preferences: {
      readingPlan: readingPlan as ReadingPlan,
      setReadingPlan,
      fontScale,
      setFontScale,
      arabicFontId,
      setArabicFontId,
      selectedTranslations,
      setSelectedTranslations,
      showWordByWord,
      setShowWordByWord,
      prayerSettings,
      setPrayerSettings,
      nextPrayerPreview,
      hasPrayerLocation,
      theme,
      isLightTheme,
      setTheme,
      memorizeConfig,
      setMemorizeConfig,
      startMemorize,
      stopMemorize,
      lastRead: lastRead as LastRead,
      studySession
    },
    ui: {
      query,
      setQuery,
      ayahQuery,
      setAyahQuery,
      goToAyahInput,
      setGoToAyahInput,
      readingMode,
      setReadingMode,
      showShortcuts,
      setShowShortcuts,
      showMobileSettings,
      setShowMobileSettings,
      showMobileSearch,
      setShowMobileSearch,
      settingsTab,
      setSettingsTab,
      selectedAyah,
      setSelectedAyah,
      focusedAyahKey,
      setFocusedAyahKey,
      copiedKey
    },
    actions: {
      handleSelectSurah,
      handleGoToAyah,
      jumpToAyah,
      copyAyahLink,
      handleCompare,
      retryData,
      planSummary,
      formatRangeLabel
    }
  };
}
