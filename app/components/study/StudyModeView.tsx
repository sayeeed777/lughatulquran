"use client";

import { useMemo, useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioPlayer } from "../common";
import { ProgressRing, QuickPanel } from "./StudyComponents";
import StudyMemorizeModal from "./StudyMemorizeModal";
import StudyLexiconModals from "./StudyLexiconModals";
import { TAJWEED_LEGEND, TAFSIR_EDITIONS } from "./StudyModeHelpers";
import type { MushafPageLayout } from "./StudyModeTypes";
import type { QuickPanelTab } from "./StudyQuickPanelContent";
import StudyQuickPanelContent from "./StudyQuickPanelContent";
import StudyAyahList from "./StudyAyahList";
import StudyMushafPage from "./StudyMushafPage";
import useStudyControls from "./useStudyControls";
import useWordLexicon from "./useWordLexicon";
import { AUDIO_RECITERS, ARABIC_FONTS } from "../../lib/constants";
import { useLocalStorage, useReadingStats } from "../../hooks";
import { useDiscoveryTips } from "../../hooks/useDiscoveryTips";
import { verseKey, clamp } from "../../lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "../../lib/styleClasses";
import { fetchJSON } from "../../lib/apiClient";
import { useAudio, useBookmarkContext, useQuranData, useUIState, usePreferences, useActions } from "../../contexts";

type RailItem = {
  id: QuickPanelTab;
  label: string;
  icon: ReactNode;
};

type StudyModeViewProps = {
  onExit: () => void;
};

type StudyScopeMode = "surah" | "juz" | "page";

type StudyScopeAyah = {
  surahNumber: number;
  number: number;
  verseKey: string;
  arabic?: string;
  arabicTajweed?: string | null;
  transliteration?: string;
  pageNumber?: number | null;
  translations?: Record<string, { text?: string }>;
};

type StudyScopeSection = {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
};

type StudyScopeResponse = {
  scope?: {
    type: StudyScopeMode;
    id: number;
    label: string;
    versesCount: number;
    firstVerseKey: string;
    lastVerseKey: string;
  };
  sections?: StudyScopeSection[];
  ayahs?: StudyScopeAyah[];
  layout?: MushafPageLayout | null;
};

export default function StudyModeView({
  onExit
}: StudyModeViewProps) {
  // Consume from contexts
  const {
    surahs,
    selectedSurah,
    surahData,
    filteredAyahs,
    wordByAyah,
    wordLoading,
    surahByNumber
  } = useQuranData();
  const { focusedAyahKey, setFocusedAyahKey } = useUIState();
  const {
    arabicFontId,
    setArabicFontId,
    selectedTranslations,
    showStudyTransliteration,
    setShowStudyTransliteration,
    fontScale,
    setFontScale,
    memorizeConfig,
    startMemorize: onStartMemorize,
    stopMemorize: onStopMemorize
  } = usePreferences();
  const {
    nowPlaying,
    isAutoPlaying,
    isAudioPaused,
    audioSrc,
    reciterLabel,
    reciterBaseUrl,
    nowPlayingPage,
    reciterId,
    surahPageStart,
    surahPageEnd,
    setReciterId,
    playbackRate,
    setPlaybackRate,
    handleStopAutoPlay: onStopAutoPlay,
    handlePlaySurah: onPlaySurah,
    handlePlayAyah: onPlayAyah,
    handleAudioEnded: onAudioEnded,
    handleToggleAyah: onTogglePlay
  } = useAudio();
  const { planSummary, jumpToAyah: onJumpToAyah } = useActions();
  const {
    bookmarks,
    notes,
    sortedBookmarks,
    sortedNotes,
    toggleBookmark: onToggleBookmark,
    openNote: onOpenNote
  } = useBookmarkContext();
  const { todayStats, weeklyData, weekTotal, stats, surahProgress, recordVerseRead } = useReadingStats();

  // Discovery tips
  const [hasOpenedTools, setHasOpenedTools] = useState(false);
  const surahCount = Object.keys(surahProgress || {}).length;
  const { activeTip, dismiss: dismissTip } = useDiscoveryTips({
    toolsOpened: hasOpenedTools,
    surahCount,
  });

  // Support both array and single string for backwards compatibility
  const translationIds = Array.isArray(selectedTranslations)
    ? selectedTranslations
    : [selectedTranslations];
  const primaryTranslation = translationIds[0] || "en-arberry";
  const translationKey = translationIds.join(",");

  const [studyScopeMode, setStudyScopeMode] = useLocalStorage<StudyScopeMode>(
    "quran_study_scope_mode",
    "surah"
  );
  const [studyJuzNumber, setStudyJuzNumber] = useLocalStorage<number>("quran_study_juz_number", 1);
  const [studyPageNumber, setStudyPageNumber] = useLocalStorage<number>("quran_study_page_number", 1);
  const [scopedAyahs, setScopedAyahs] = useState<StudyScopeAyah[]>([]);
  const [scopeMeta, setScopeMeta] = useState<StudyScopeResponse["scope"] | null>(null);
  const [scopeLayout, setScopeLayout] = useState<MushafPageLayout | null>(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);

  // Swipe navigation for page/juz scope on mobile
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);
  const handleSwipeStart = useCallback((e: ReactTouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = { startX: t.clientX, startY: t.clientY };
  }, []);
  const handleSwipeEnd = useCallback((e: ReactTouchEvent) => {
    if (!swipeRef.current || studyScopeMode === "surah") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.current.startX;
    const dy = t.clientY - swipeRef.current.startY;
    swipeRef.current = null;
    // Only trigger if horizontal swipe is dominant and long enough
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    if (studyScopeMode === "page") {
      // RTL: swipe left = next page, swipe right = prev page
      if (dx < 0) setStudyPageNumber(Math.min(604, studyPageNumber + 1));
      else setStudyPageNumber(Math.max(1, studyPageNumber - 1));
    } else {
      if (dx < 0) setStudyJuzNumber(Math.min(30, studyJuzNumber + 1));
      else setStudyJuzNumber(Math.max(1, studyJuzNumber - 1));
    }
  }, [studyScopeMode, studyPageNumber, studyJuzNumber, setStudyPageNumber, setStudyJuzNumber]);

  const selectedSurahNumber = selectedSurah?.number || 0;
  const surahAyahs = useMemo<StudyScopeAyah[]>(
    () =>
      (filteredAyahs || surahData?.ayahs || []).map((ayah) => ({
        ...ayah,
        surahNumber: selectedSurahNumber,
        verseKey: verseKey(selectedSurahNumber, ayah.number)
      })),
    [filteredAyahs, selectedSurahNumber, surahData?.ayahs]
  );

  const activeScopeValue = studyScopeMode === "page" ? studyPageNumber : studyJuzNumber;

  useEffect(() => {
    if (studyScopeMode === "surah") {
      setScopeLoading(false);
      setScopeError(null);
      setScopeMeta(null);
      setScopeLayout(null);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (translationKey) {
      params.set("translations", translationKey);
    }
    if (showStudyTransliteration && studyScopeMode === "juz") {
      params.set("transliteration", "1");
    }

    const url = `/api/${studyScopeMode}/${activeScopeValue}${params.toString() ? `?${params.toString()}` : ""}`;
    const cacheKey = `study-scope:v3:${studyScopeMode}:${activeScopeValue}:${translationKey}:${showStudyTransliteration ? 1 : 0}`;

    setScopeLoading(true);
    setScopeError(null);

    fetchJSON<StudyScopeResponse>(url, {
      ttl: 30 * 60 * 1000,
      retries: 1,
      retryDelay: 300,
      persist: true,
      staleWhileRevalidate: true,
      cacheKey,
      signal: controller.signal
    })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setScopedAyahs(Array.isArray(payload?.ayahs) ? payload.ayahs : []);
        setScopeMeta(payload?.scope || null);
        setScopeLayout(payload?.layout || null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Failed to load study scope.";
        setScopeError(message);
        setScopedAyahs([]);
        setScopeMeta(null);
        setScopeLayout(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setScopeLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    activeScopeValue,
    showStudyTransliteration,
    studyScopeMode,
    translationKey
  ]);

  const displayAyahs = studyScopeMode === "surah" ? surahAyahs : scopedAyahs;
  const totalAyahs = displayAyahs.length;
  const isPageScope = studyScopeMode === "page";
  const isSurahScope = studyScopeMode === "surah";
  const hasMushafLayout = Boolean(isPageScope && scopeLayout?.lines?.length);

  const {
    showControls,
    showQuickPanel,
    setShowQuickPanel,
    quickPanelTab,
    setQuickPanelTab,
    readingTime,
    currentAyahIndex,
    progress,
    goalTarget,
    goalProgress,
    setGoalPerDay,
    showTajweed,
    setShowTajweed,
    showTajweedLegend,
    setShowTajweedLegend,
    showHifzMode,
    setShowHifzMode,
    showWordByWord,
    setShowWordByWord,
    isMushafView,
    setIsMushafView,
    scriptStyle,
    setScriptStyle,
    showTranslation,
    setShowTranslation,
    dimNonFocused,
    setDimNonFocused,
    autoScrollPlaying,
    setAutoScrollPlaying,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    searchHasRun,
    runSearch,
    tafsirEdition,
    tafsirText,
    tafsirLoading,
    tafsirError,
    handleChangeTafsirEdition,
    focusedAyahNumber,
    showMemorizeModal,
    memorizeMode,
    memorizeDraft,
    openMemorizeModal,
    closeMemorizeModal,
    applyMemorizeMode,
    updateMemorizeStart,
    updateMemorizeEnd,
    updateMemorizeLoops,
    studyMarks,
    toggleStudyMark,
    hifzMarks,
    toggleHifzMark,
    markHifzRange,
    clearHifzSurah,
    scrollContainerRef
  } = useStudyControls({
    ayahsLength: totalAyahs,
    selectedSurah,
    focusedAyahKey,
    clamp,
    memorizeConfig
  });

  const {
    wordAudioRef,
    wordAudioUrl,
    selectedWordDetails,
    isRootModalOpen,
    rootLexicon,
    rootLexiconLoading,
    rootLexiconError,
    wordsByAyahForStudy,
    effectiveWordLoading,
    resolveWordAudioUrl,
    handleWordAudio,
    handleWordSelect,
    closeWordDetails,
    openRootDetails,
    closeRootModal,
    selectedRoot,
    selectedRootArabic,
    rootMeaningSummary,
    laneActionLabel
  } = useWordLexicon({
    selectedSurahNumber,
    wordByAyah,
    wordLoading
  });

  useEffect(() => {
    if (!displayAyahs.length) return;
    const hasFocusedAyah = focusedAyahKey
      ? displayAyahs.some((ayah) => ayah.verseKey === focusedAyahKey)
      : false;
    if (hasFocusedAyah) return;
    setFocusedAyahKey(displayAyahs[0].verseKey);
  }, [displayAyahs, focusedAyahKey, setFocusedAyahKey]);

  const railItems = useMemo<RailItem[]>(
    () => [
      {
        id: "study",
        label: "Study",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4h14a2 2 0 0 1 2 2v13" />
            <path d="M4 4v13a2 2 0 0 0 2 2h14" />
          </svg>
        )
      },
      {
        id: "tool",
        label: "Tool",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 6.5 17.5 3.5a2.121 2.121 0 1 1 3 3l-3.01 3.01" />
            <path d="M12.5 8.5 4 17v3h3l8.5-8.5" />
            <path d="M7 12H3" />
            <path d="M21 21h-4" />
            <path d="M14 14h-2" />
          </svg>
        )
      },
      {
        id: "tafsir",
        label: "Tafsir",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4h14a2 2 0 0 1 2 2v13" />
            <path d="M4 4v13a2 2 0 0 0 2 2h14" />
            <path d="M8 7h8" />
            <path d="M8 11h6" />
          </svg>
        )
      },
      {
        id: "search",
        label: "Search",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )
      },
      {
        id: "notes",
        label: "Notes",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        )
      }
    ],
    []
  );

  const isBookmarked = useCallback(
    (surah: number, ayah: number) => bookmarks?.includes(verseKey(surah, ayah)),
    [bookmarks]
  );
  const hasNote = useCallback(
    (surah: number, ayah: number) => notes?.[verseKey(surah, ayah)],
    [notes]
  );

  const studyTypographyClasses = `${getArabicScaleClass(fontScale.arabic)} ${getTranslationScaleClass(
    fontScale.translation
  )} ${getArabicFontClass(arabicFontId)}`;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Track verse reading when currentAyahIndex changes
  const lastTrackedAyahRef = useRef(0);
  useEffect(() => {
    if (!isSurahScope) return;
    if (currentAyahIndex > 0 && selectedSurahNumber > 0 && currentAyahIndex !== lastTrackedAyahRef.current) {
      lastTrackedAyahRef.current = currentAyahIndex;
      recordVerseRead(selectedSurahNumber, currentAyahIndex);
    }
  }, [currentAyahIndex, isSurahScope, selectedSurahNumber, recordVerseRead]);

  const onOpenTafsirFromAyah = useCallback(
    (key: string) => {
      setFocusedAyahKey(key);
      setQuickPanelTab("tafsir");
      setShowQuickPanel(true);
    },
    [setFocusedAyahKey, setQuickPanelTab, setShowQuickPanel]
  );

  const jumpToStudyAyah = useCallback(
    (surah: number, ayah: number) => {
      if (!isSurahScope) {
        setStudyScopeMode("surah");
      }
      onJumpToAyah(surah, ayah);
    },
    [isSurahScope, onJumpToAyah, setStudyScopeMode]
  );

  const handleStudyAyahPlay = useCallback(
    (surah: number, ayah: number) => {
      if (studyScopeMode === "surah") {
        onTogglePlay(surah, ayah);
        return;
      }

      if (nowPlaying?.surah === surah && nowPlaying?.ayah === ayah) {
        onStopAutoPlay();
        return;
      }

      onPlayAyah(surah, ayah);
    },
    [nowPlaying?.ayah, nowPlaying?.surah, onPlayAyah, onStopAutoPlay, onTogglePlay, studyScopeMode]
  );

  const activeScopeLabel = isSurahScope
    ? selectedSurah?.englishName || "Surah"
    : scopeMeta?.label || (isPageScope ? `Page ${studyPageNumber}` : `Juz ${studyJuzNumber}`);
  const activeScopeMeta = isSurahScope
    ? `${selectedSurah?.englishNameTranslation || ""} · ${totalAyahs} Ayahs`
    : `${totalAyahs} ayahs · ${scopeMeta?.firstVerseKey || ""}${scopeMeta?.lastVerseKey ? ` - ${scopeMeta.lastVerseKey}` : ""}`;
  const currentScopeAyah = displayAyahs[Math.max(0, currentAyahIndex - 1)] || null;

  return (
    <div
      className={`study-mode-container${(isMushafView || isPageScope) ? " mushaf-view" : ""}${isPageScope ? " page-scope" : ""}${scriptStyle === "naskh" ? " script-naskh" : ""
        } ${studyTypographyClasses}`}
    >
      {/* Ambient Background */}
      <div className="study-ambient-bg" />

      {/* Top Header - Minimal */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            className="study-header"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="study-header-left">
              <button className="study-back-btn" onClick={onExit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="study-surah-info">
                {isSurahScope ? (
                  <div className="study-surah-picker">
                    <h1 className="study-surah-name">
                      {selectedSurah?.englishName}
                      <svg className="study-surah-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </h1>
                    <select
                      className="study-surah-picker-native"
                      value={selectedSurah?.number || 1}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        if (num && num !== selectedSurah?.number) {
                          jumpToStudyAyah(num, 1);
                        }
                      }}
                      aria-label="Choose surah"
                    >
                      {surahs.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.englishName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : isPageScope ? (
                  <div className="study-scope-nav">
                    <button
                      type="button"
                      className="study-scope-nav-btn"
                      onClick={() => setStudyPageNumber(Math.max(1, studyPageNumber - 1))}
                      disabled={studyPageNumber <= 1}
                      aria-label="Previous page"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <div className="study-scope-nav-select">
                      <h1 className="study-surah-name">
                        {activeScopeLabel}
                        <svg className="study-surah-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                      </h1>
                      <select
                        className="study-surah-picker-native"
                        value={studyPageNumber}
                        onChange={(e) => setStudyPageNumber(Number(e.target.value))}
                        aria-label="Choose page"
                      >
                        {Array.from({ length: 604 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>Page {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="study-scope-nav-btn"
                      onClick={() => setStudyPageNumber(Math.min(604, studyPageNumber + 1))}
                      disabled={studyPageNumber >= 604}
                      aria-label="Next page"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="study-scope-nav">
                    <button
                      type="button"
                      className="study-scope-nav-btn"
                      onClick={() => setStudyJuzNumber(Math.max(1, studyJuzNumber - 1))}
                      disabled={studyJuzNumber <= 1}
                      aria-label="Previous juz"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <div className="study-scope-nav-select">
                      <h1 className="study-surah-name">
                        {activeScopeLabel}
                        <svg className="study-surah-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                      </h1>
                      <select
                        className="study-surah-picker-native"
                        value={studyJuzNumber}
                        onChange={(e) => setStudyJuzNumber(Number(e.target.value))}
                        aria-label="Choose juz"
                      >
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>Juz {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="study-scope-nav-btn"
                      onClick={() => setStudyJuzNumber(Math.min(30, studyJuzNumber + 1))}
                      disabled={studyJuzNumber >= 30}
                      aria-label="Next juz"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                )}
                <span className="study-surah-meta">
                  {activeScopeMeta}
                </span>
              </div>
            </div>

            <div className="study-header-center">
              <div className="study-progress-indicator">
                <ProgressRing progress={progress} />
                <span className="progress-text">{progress}%</span>
              </div>
            </div>

            <div className="study-header-right">
              <div className="study-reading-time">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>{formatTime(readingTime)}</span>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}
      <div className="study-reading-area" ref={scrollContainerRef}
        onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
        {isSurahScope ? (
          <>
            <div className="study-surah-opening">
              <span className="study-arabic-name" lang="ar" dir="rtl">
                {selectedSurah?.name}
              </span>
              <div className="study-opening-decoration">
                <span className="decoration-line" />
                <span className="decoration-dot" />
                <span className="decoration-line" />
              </div>
            </div>

            {selectedSurah?.number !== 1 && selectedSurah?.number !== 9 && (
              <div className="study-bismillah" lang="ar" dir="rtl">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}
          </>
        ) : !isPageScope ? (
          <div className="study-surah-opening scope-opening">
            <span className="study-arabic-name">{activeScopeLabel}</span>
            <div className="study-opening-decoration">
              <span className="decoration-line" />
              <span className="decoration-dot" />
              <span className="decoration-line" />
            </div>
            <p className="study-scope-meta">{activeScopeMeta}</p>
          </div>
        ) : null}

        {!isSurahScope && scopeLoading && <p className="status">Loading {activeScopeLabel.toLowerCase()}...</p>}
        {!isSurahScope && scopeError && <p className="status error">{scopeError}</p>}

        {hasMushafLayout && scopeLayout ? (
          <StudyMushafPage
            layout={scopeLayout}
            ayahs={displayAyahs.map((ayah) => ({
              surahNumber: ayah.surahNumber || 0,
              number: ayah.number,
              verseKey: ayah.verseKey || verseKey(ayah.surahNumber || 0, ayah.number)
            }))}
            focusedAyahKey={focusedAyahKey}
            dimNonFocused={dimNonFocused}
            nowPlaying={nowPlaying}
            isAudioPaused={isAudioPaused}
            onFocusAyahKey={setFocusedAyahKey}
            onTogglePlay={handleStudyAyahPlay}
            onSelectPage={setStudyPageNumber}
          />
        ) : (
          <StudyAyahList
            ayahs={displayAyahs}
            selectedSurahNumber={selectedSurahNumber}
            surahByNumber={surahByNumber}
            verseKey={verseKey}
            viewMode={studyScopeMode}
            scopeLabel={activeScopeLabel}
            nowPlaying={nowPlaying}
            isAudioPaused={isAudioPaused}
            focusedAyahKey={focusedAyahKey}
            dimNonFocused={dimNonFocused}
            studyMarks={studyMarks}
            primaryTranslation={primaryTranslation}
            showTajweed={showTajweed}
            showTranslation={isPageScope ? false : showTranslation}
            showTransliteration={isPageScope ? false : showStudyTransliteration}
            isMushafView={isPageScope ? true : isMushafView}
            showWordByWord={isSurahScope ? showWordByWord : false}
            wordsByAyahForStudy={wordsByAyahForStudy}
            effectiveWordLoading={effectiveWordLoading}
            wordAudioUrl={wordAudioUrl}
            selectedWordDetails={selectedWordDetails}
            isBookmarked={isBookmarked}
            hasNote={hasNote}
            resolveWordAudioUrl={resolveWordAudioUrl}
            onFocusAyahKey={setFocusedAyahKey}
            onOpenMemorize={openMemorizeModal}
            onTogglePlay={handleStudyAyahPlay}
            onToggleBookmark={onToggleBookmark}
            onOpenTafsir={onOpenTafsirFromAyah}
            onOpenNote={onOpenNote}
            onWordSelect={handleWordSelect}
            onWordAudio={handleWordAudio}
            onToggleStudyMarkByKey={toggleStudyMark}
            hifzMarks={hifzMarks}
            onToggleHifzMark={toggleHifzMark}
            showHifzMode={isSurahScope && showHifzMode}
          />
        )}

        {!scopeLoading && !scopeError && displayAyahs.length > 0 && (
          <div className="study-surah-end">
            <div className="study-end-decoration">
              <span className="decoration-star">✦</span>
            </div>
            <p className="study-end-text">{isSurahScope ? "End of Surah" : `End of ${activeScopeLabel}`}</p>
          </div>
        )}
      </div>

      {/* Audio Player */}
      <AudioPlayer
        reciterId={reciterId}
        reciterLabel={reciterLabel}
        reciterBaseUrl={reciterBaseUrl}
        nowPlayingLabel={nowPlaying ? `Ayah ${nowPlaying.ayah}` : ""}
        audioSrc={audioSrc}
        isAutoPlaying={isAutoPlaying}
        isAudioPaused={isAudioPaused}
        playbackRate={playbackRate}
        onPlaySurah={onPlaySurah}
        onStopAutoPlay={onStopAutoPlay}
        onAudioEnded={onAudioEnded}
        selectedSurah={selectedSurah}
        nowPlaying={nowPlaying}
        nowPlayingPage={nowPlayingPage}
        surahPageStart={surahPageStart}
        surahPageEnd={surahPageEnd}
        showPlayerBar={false}
        memorizeActive={Boolean(memorizeConfig?.active)}
        memorizeStartAyah={memorizeConfig?.startAyah}
        memorizeEndAyah={memorizeConfig?.endAyah}
        memorizeLoops={memorizeConfig?.loops}
        memorizeRemaining={memorizeConfig?.remaining}
      />


      {/* Study Rail */}
      <div className="study-rail">
        {railItems.map((item) => (
          <button
            key={item.id}
            className={`study-rail-btn${quickPanelTab === item.id && showQuickPanel ? " active" : ""}`}
            onClick={() => {
              if (showQuickPanel && quickPanelTab === item.id) {
                setShowQuickPanel(false);
                return;
              }
              setQuickPanelTab(item.id);
              setShowQuickPanel(true);
              if (item.id === "tool") {
                setHasOpenedTools(true);
                dismissTip();
              }
            }}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>


      {/* Quick Panel */}
      <QuickPanel
        isOpen={showQuickPanel}
        onClose={() => setShowQuickPanel(false)}
        title={quickPanelTab.charAt(0).toUpperCase() + quickPanelTab.slice(1)}
      >
        <StudyQuickPanelContent
          tab={quickPanelTab}
          readingTime={readingTime}
          progress={progress}
          sortedBookmarks={sortedBookmarks}
          sortedNotes={sortedNotes}
          goalTarget={goalTarget}
          goalProgress={goalProgress}
          setGoalPerDay={setGoalPerDay}
          planSummary={planSummary}
          surahByNumber={surahByNumber}
          onJumpToAyah={jumpToStudyAyah}
          onClosePanel={() => setShowQuickPanel(false)}
          formatTime={formatTime}
          showTranslation={showTranslation}
          setShowTranslation={setShowTranslation}
          studyScopeMode={studyScopeMode}
          setStudyScopeMode={setStudyScopeMode}
          studyJuzNumber={studyJuzNumber}
          setStudyJuzNumber={setStudyJuzNumber}
          studyPageNumber={studyPageNumber}
          setStudyPageNumber={setStudyPageNumber}
          showStudyTransliteration={showStudyTransliteration}
          setShowStudyTransliteration={setShowStudyTransliteration}
          dimNonFocused={dimNonFocused}
          setDimNonFocused={setDimNonFocused}
          autoScrollPlaying={autoScrollPlaying}
          setAutoScrollPlaying={setAutoScrollPlaying}
          fontScale={fontScale}
          setFontScale={setFontScale}
          clamp={clamp}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          arabicFonts={ARABIC_FONTS}
          arabicFontId={arabicFontId}
          setArabicFontId={setArabicFontId}
          reciters={AUDIO_RECITERS}
          reciterId={reciterId}
          setReciterId={setReciterId}
          showTajweed={showTajweed}
          setShowTajweed={setShowTajweed}
          showTajweedLegend={showTajweedLegend}
          setShowTajweedLegend={setShowTajweedLegend}
          showHifzMode={showHifzMode}
          setShowHifzMode={setShowHifzMode}
          showWordByWord={showWordByWord}
          setShowWordByWord={setShowWordByWord}
          isMushafView={isMushafView}
          setIsMushafView={setIsMushafView}
          scriptStyle={scriptStyle}
          setScriptStyle={setScriptStyle}
          tajweedLegend={TAJWEED_LEGEND}
          tafsirEdition={String(tafsirEdition)}
          tafsirEditions={TAFSIR_EDITIONS}
          onChangeTafsirEdition={handleChangeTafsirEdition}
          selectedSurahNumber={selectedSurah?.number || 0}
          selectedSurahName={selectedSurah?.englishName || "Surah"}
          focusedAyahNumber={focusedAyahNumber}
          currentAyahIndex={currentAyahIndex}
          onUseCurrentAyah={() => currentScopeAyah?.verseKey && setFocusedAyahKey(currentScopeAyah.verseKey)}
          tafsirLoading={tafsirLoading}
          tafsirError={tafsirError}
          tafsirText={tafsirText}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          runSearch={runSearch}
          searchLoading={searchLoading}
          searchError={searchError}
          searchHasRun={searchHasRun}
          searchResults={searchResults}
          onOpenNote={onOpenNote}
          todayVersesRead={todayStats.versesRead}
          weekTotal={weekTotal}
          currentStreak={stats.currentStreak}
          weeklyData={weeklyData}
          surahProgress={surahProgress}
          hifzMarks={hifzMarks}
          totalAyahs={totalAyahs}
          markHifzRange={markHifzRange}
          clearHifzSurah={clearHifzSurah}
        />
      </QuickPanel>

      <StudyLexiconModals
        selectedWordDetails={selectedWordDetails}
        isRootModalOpen={isRootModalOpen}
        selectedRoot={selectedRoot}
        selectedRootArabic={selectedRootArabic}
        rootMeaningSummary={rootMeaningSummary}
        laneActionLabel={laneActionLabel}
        rootLexiconError={rootLexiconError}
        rootLexiconLoading={rootLexiconLoading}
        rootLexicon={rootLexicon}
        onCloseWordDetails={closeWordDetails}
        onCloseRootModal={closeRootModal}
        onOpenRootDetails={openRootDetails}
        onPlayWordAudio={handleWordAudio}
        onJumpToAyah={jumpToStudyAyah}
      />

      <StudyMemorizeModal
        isOpen={showMemorizeModal}
        selectedSurah={selectedSurah}
        memorizeMode={memorizeMode}
        memorizeDraft={memorizeDraft}
        memorizeActive={Boolean(memorizeConfig?.active)}
        onClose={closeMemorizeModal}
        onApplyMode={applyMemorizeMode}
        onUpdateStart={updateMemorizeStart}
        onUpdateEnd={updateMemorizeEnd}
        onUpdateLoops={updateMemorizeLoops}
        onStartMemorize={onStartMemorize}
        onStopMemorize={onStopMemorize}
      />

      {/* Hidden audio element for word audio */}
      <audio ref={wordAudioRef} hidden />

      <AnimatePresence>
        {activeTip && (
          <motion.div
            className="discovery-tip"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <span className="discovery-tip-text">{activeTip.message}</span>
            <button
              className="discovery-tip-dismiss"
              onClick={dismissTip}
              aria-label="Dismiss tip"
              type="button"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
