"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioPlayer, ProgressBar } from "../common";
import { useLocalStorage } from "../../hooks";
import { getLocalDateString } from "../../lib/utils";
import { fetchJSON } from "../../lib/apiClient";
import { ProgressRing, QuickPanel, StatCard } from "./StudyComponents";
import type { Ayah, ReadingPlan, Surah, SurahData } from "../../lib/types";

type Reciter = { id: string; label: string; baseUrl: string };

type ArabicFont = { id: string; label: string; css: string };

type MemorizeConfig = {
  active: boolean;
  startAyah: number;
  endAyah: number;
  loops: number;
  remaining: number;
};

type Word = { arabic: string; translation?: string; audioUrl?: string };

type WordByAyah = Record<number, Word[]>;

type WordBySurah = Record<number, WordByAyah>;

type StudyModeViewProps = {
  selectedSurah: Surah | null;
  surahData: SurahData | null;
  filteredAyahs: Ayah[];
  reciters: Reciter[];
  reciterId: string;
  setReciterId: (value: string) => void;
  arabicFonts: ArabicFont[];
  arabicFontId: string;
  setArabicFontId: (value: string) => void;
  selectedTranslations?: string[] | string;
  bookmarks: string[];
  notes: Record<string, string>;
  sortedBookmarks: string[];
  sortedNotes: Array<{ key: string; surah: number; ayah: number; value: string }>;
  readingPlan: ReadingPlan;
  planSummary: any;
  focusedAyahKey: string | null;
  setFocusedAyahKey: (value: string | null) => void;
  fontScale: { arabic: number; translation: number };
  setFontScale: (value: { arabic: number; translation: number } | ((prev: { arabic: number; translation: number }) => { arabic: number; translation: number })) => void;
  nowPlaying: { surah: number; ayah: number } | null;
  isAutoPlaying: boolean;
  isAudioPaused: boolean;
  wordByAyah: WordBySurah;
  wordLoading: boolean;
  audioSrc: string | null;
  reciterLabel: string;
  onExit: () => void;
  onPlayAyah: (surah: number, ayah: number) => void;
  onTogglePlay: (surah: number, ayah: number) => void;
  onStopAutoPlay: () => void;
  onPlaySurah: (startFromAyah?: number) => void;
  onAudioEnded: () => void;
  memorizeConfig: MemorizeConfig;
  setMemorizeConfig: (value: MemorizeConfig | ((prev: MemorizeConfig) => MemorizeConfig)) => void;
  onStartMemorize: (config: { startAyah?: number; endAyah?: number; loops?: number }) => void;
  onStopMemorize: () => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
  onOpenNote: (surah: number, ayah: number) => void;
  onJumpToAyah: (surah: number, ayah: number) => void;
  surahByNumber: Map<number, Surah>;
  verseKey: (surah: number, ayah: number) => string;
  clamp: (value: number, min: number, max: number) => number;
};

export default function StudyModeView({
  selectedSurah,
  surahData,
  filteredAyahs,
  reciters,
  reciterId,
  setReciterId,
  arabicFonts,
  arabicFontId,
  setArabicFontId,
  selectedTranslations = ["en.arberry"],
  bookmarks,
  notes,
  sortedBookmarks,
  sortedNotes,
  readingPlan,
  planSummary,
  focusedAyahKey,
  setFocusedAyahKey,
  fontScale,
  setFontScale,
  nowPlaying,
  isAutoPlaying,
  isAudioPaused,
  wordByAyah,
  wordLoading,
  audioSrc,
  reciterLabel,
  onExit,
  onPlayAyah,
  onTogglePlay,
  onStopAutoPlay,
  onPlaySurah,
  onAudioEnded,
  memorizeConfig,
  setMemorizeConfig,
  onStartMemorize,
  onStopMemorize,
  onToggleBookmark,
  onOpenNote,
  onJumpToAyah,
  surahByNumber,
  verseKey,
  clamp
}: StudyModeViewProps) {
  // Support both array and single string for backwards compatibility
  const translationIds = Array.isArray(selectedTranslations)
    ? selectedTranslations
    : [selectedTranslations];
  const primaryTranslation = translationIds[0] || "en.arberry";

  const [showControls, setShowControls] = useState(true);
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [quickPanelTab, setQuickPanelTab] = useState("study");
  const [readingTime, setReadingTime] = useState(0);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [showTajweed, setShowTajweed] = useState(false);
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [isMushafView, setIsMushafView] = useState(false);
  const [scriptStyle, setScriptStyle] = useState("uthmani");
  const [showTranslation, setShowTranslation] = useState(true);
  const [dimNonFocused, setDimNonFocused] = useState(false);
  const [autoScrollPlaying, setAutoScrollPlaying] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [studyGoal, setStudyGoal] = useLocalStorage("quran_study_goal", {
    perDay: 15,
    date: getLocalDateString()
  });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ayahs = filteredAyahs || surahData?.ayahs || [];
  const totalAyahs = ayahs.length;
  const progress = totalAyahs > 0 ? Math.round((currentAyahIndex / totalAyahs) * 100) : 0;
  const goalTarget = Math.max(1, Number(studyGoal?.perDay) || 1);
  const goalProgress = Math.min(currentAyahIndex, goalTarget);

  const railItems = [
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
      id: "memorize",
      label: "Memorize",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 1l4 4-4 4" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <path d="M7 23l-4-4 4-4" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      )
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 21v-7" />
          <path d="M4 10V3" />
          <path d="M12 21v-9" />
          <path d="M12 8V3" />
          <path d="M20 21v-5" />
          <path d="M20 12V3" />
          <path d="M2 14h4" />
          <path d="M10 8h4" />
          <path d="M18 16h4" />
        </svg>
      )
    },
    {
      id: "tools",
      label: "Tools",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3 1.8 3.6L17 8l-3.2 1.4L12 13l-1.8-3.6L7 8l3.2-1.4L12 3z" />
          <path d="m19 14 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
          <path d="m5 14 .8 1.6L7 16l-1.2.4L5 18l-.8-1.6L3 16l1.2-.4L5 14z" />
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
  ];

  // Reading time tracker
  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const today = getLocalDateString();
    if (!studyGoal?.date || studyGoal.date !== today) {
      setStudyGoal((prev: any) => ({ ...prev, date: today }));
    }
  }, [studyGoal?.date, setStudyGoal]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Track scroll position for current ayah
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const ayahElements = container.querySelectorAll(".study-ayah-card");
      if (!ayahElements.length) {
        setCurrentAyahIndex(0);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      let closestIndex = 0;
      let closestDistance = Infinity;

      ayahElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerRect.top);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentAyahIndex(closestIndex + 1);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [ayahs.length]);

  // Sync focused ayah in study mode
  useEffect(() => {
    if (!focusedAyahKey || !selectedSurah) return;
    const parts = focusedAyahKey.split(":");
    const ayahNumber = Number(parts[1]);
    if (!Number.isFinite(ayahNumber)) return;
    setCurrentAyahIndex(ayahNumber);
  }, [focusedAyahKey, selectedSurah]);

  const isBookmarked = (surah: number, ayah: number) => bookmarks?.includes(verseKey(surah, ayah));
  const hasNote = (surah: number, ayah: number) => notes?.[verseKey(surah, ayah)];

  const parseVerseKey = (key: string) => {
    const [surah, ayah] = key.split(":").map(Number);
    return { surah, ayah };
  };

  const selectedArabicFont = (arabicFonts || []).find((font) => font.id === arabicFontId);
  const containerStyle: React.CSSProperties & Record<string, string | number> = {
    "--font-arabic": selectedArabicFont?.css || ""
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const payload = await fetchJSON<{ results?: any[] }>(
        `/api/search?q=${encodeURIComponent(query)}`,
        { ttl: 2 * 60 * 1000, retries: 1, retryDelay: 250 }
      );
      setSearchResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed.";
      setSearchError(message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const planLabel = (() => {
    if (!planSummary) return "Loading plan...";
    if (planSummary.completed) return "Plan complete";
    if (planSummary.error) return planSummary.error;
    if (planSummary.startVerse && planSummary.endVerse) {
      const startName =
        surahByNumber.get(planSummary.startVerse.surah)?.englishName ||
        `Surah ${planSummary.startVerse.surah}`;
      const endName =
        surahByNumber.get(planSummary.endVerse.surah)?.englishName ||
        `Surah ${planSummary.endVerse.surah}`;
      if (planSummary.startVerse.surah === planSummary.endVerse.surah) {
        return `${startName} Ayah ${planSummary.startVerse.ayah} to ${planSummary.endVerse.ayah}`;
      }
      return `${startName} Ayah ${planSummary.startVerse.ayah} to ${endName} Ayah ${planSummary.endVerse.ayah}`;
    }
    return "Plan ready";
  })();

  const navigateToAyah = (surahNumber: number, ayahNumber: number) => {
    onJumpToAyah(surahNumber, ayahNumber);
    setShowQuickPanel(false);
  };

  const resolveWordAudioUrl = (audioUrl?: string) => {
    if (!audioUrl) return "";
    if (audioUrl.startsWith("http")) return audioUrl;
    return `https://audio.qurancdn.com/${audioUrl.replace(/^\//, "")}`;
  };

  const handleWordAudio = (audioUrl?: string) => {
    const resolvedUrl = resolveWordAudioUrl(audioUrl);
    if (!resolvedUrl) return;
    const audio = wordAudioRef.current;
    if (audio) {
      if (audio.src !== resolvedUrl) {
        audio.src = resolvedUrl;
        audio.load();
      }
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    setWordAudioUrl(resolvedUrl);
  };

  const currentReciter = reciters?.find((r) => r.id === reciterId) || reciters?.[0];

  return (
    <div
      className={`study-mode-container${isMushafView ? " mushaf-view" : ""}${
        scriptStyle === "naskh" ? " script-naskh" : ""
      }`}
      style={containerStyle}
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
                <h1 className="study-surah-name">{selectedSurah?.englishName}</h1>
                <span className="study-surah-meta">
                  {selectedSurah?.englishNameTranslation} · {totalAyahs} Ayahs
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
      <div className="study-reading-area" ref={scrollContainerRef}>
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

        <div className="study-ayah-list">
          {ayahs.map((ayah, index) => {
            const ayahNum = ayah.number;
            const key = verseKey(selectedSurah?.number || 0, ayahNum);
            const bookmarked = isBookmarked(selectedSurah?.number || 0, ayahNum);
            const noted = hasNote(selectedSurah?.number || 0, ayahNum);
            const isPlaying = nowPlaying?.surah === selectedSurah?.number && nowPlaying?.ayah === ayahNum;
            const isActivePlay = isPlaying && !isAudioPaused;
            const words = showWordByWord
              ? wordByAyah?.[selectedSurah?.number || 0]?.[ayahNum] || []
              : [];
            const arabicMarkup = showTajweed && ayah.arabicTajweed
              ? { __html: ayah.arabicTajweed }
              : null;
            const isFocused = focusedAyahKey === key;

            return (
              <motion.article
                key={key || `ayah-${index}`}
                id={`ayah-${ayahNum}`}
                className={`study-ayah-card${isActivePlay ? " playing" : ""}${dimNonFocused && focusedAyahKey && !isFocused ? " dimmed" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setFocusedAyahKey(key)}
              >
                <div className="study-ayah-number">
                  <span>{ayahNum}</span>
                </div>

                <div className="study-ayah-content">
                  <p
                    className="study-ayah-arabic"
                    lang="ar"
                    dir="rtl"
                    style={{ fontSize: `calc(2rem * ${fontScale?.arabic || 1})` }}
                  >
                    {arabicMarkup ? (
                      <span dangerouslySetInnerHTML={arabicMarkup} />
                    ) : (
                      ayah.arabic || ""
                    )}
                  </p>
                  {!isMushafView &&
                    showTranslation &&
                    (ayah.translations?.[primaryTranslation]?.text || "") && (
                      <p
                        className="study-ayah-translation"
                        style={{ fontSize: `calc(1rem * ${fontScale?.translation || 1})` }}
                      >
                        {ayah.translations?.[primaryTranslation]?.text || "Translation unavailable."}
                      </p>
                    )}
                  {showWordByWord && (
                    <div className="study-word-row">
                      {wordLoading && words.length === 0 && (
                        <span className="meta">Loading words…</span>
                      )}
                      {words.map((word, wordIndex) => {
                        const resolvedAudioUrl = resolveWordAudioUrl(word.audioUrl);
                        return (
                          <button
                            key={`${key}-${wordIndex}`}
                            className={`study-word-chip${resolvedAudioUrl && wordAudioUrl === resolvedAudioUrl ? " playing" : ""}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleWordAudio(word.audioUrl);
                            }}
                            type="button"
                          >
                            <span className="word-ar" lang="ar" dir="rtl">
                              {word.arabic}
                            </span>
                            {word.translation && <span className="word-en">{word.translation}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="study-ayah-actions">
                  <button
                    className={`study-ayah-action${bookmarked ? " active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleBookmark(selectedSurah?.number || 0, ayahNum);
                    }}
                    title={bookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </button>
                  <button
                    className={`study-ayah-action${noted ? " active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenNote(selectedSurah?.number || 0, ayahNum);
                    }}
                    title={noted ? "Edit note" : "Add note"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className={`study-ayah-action${isActivePlay ? " active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTogglePlay(selectedSurah?.number || 0, ayahNum);
                    }}
                    title={isActivePlay ? "Pause" : "Play"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isActivePlay ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      {isActivePlay ? (
                        <>
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </>
                      ) : (
                        <polygon points="5 3 19 12 5 21 5 3" />
                      )}
                    </svg>
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="study-surah-end">
          <div className="study-end-decoration">
            <span className="decoration-star">✦</span>
          </div>
          <p className="study-end-text">End of Surah</p>
        </div>
      </div>

      {/* Audio Player */}
      <AudioPlayer
        reciterLabel={reciterLabel}
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
        showPlayerBar={false}
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
        {quickPanelTab === "study" && (
          <div className="quick-panel-section">
            <div className="study-card">
              <h4>Overview</h4>
              <div className="quick-stats-grid">
                <StatCard
                  label="Reading Time"
                  value={formatTime(readingTime)}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  }
                  color="var(--accent)"
                />
                <StatCard
                  label="Progress"
                  value={`${progress}%`}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <path d="M22 4L12 14.01l-3-3" />
                    </svg>
                  }
                  color="var(--accent-2)"
                />
                <StatCard
                  label="Bookmarks"
                  value={sortedBookmarks?.length || 0}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  }
                  color="#f59e0b"
                />
                <StatCard
                  label="Notes"
                  value={sortedNotes?.length || 0}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  }
                  color="#8b5cf6"
                />
              </div>
            </div>

            <div className="study-card quick-goal">
              <h4>Daily Goal</h4>
              <div className="goal-controls">
                <label className="goal-label">Ayahs per day</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={goalTarget}
                  onChange={(event) =>
                    setStudyGoal((prev) => ({
                      ...prev,
                      perDay: Number(event.target.value) || 1
                    }))
                  }
                />
              </div>
              <ProgressBar
                current={goalProgress}
                total={goalTarget}
                label={`${goalProgress}/${goalTarget} ayahs`}
              />
            </div>

            {planSummary && !planSummary.completed && !planSummary.error && (
              <div className="study-card quick-plan-today">
                <h4>Today's Plan</h4>
                <p className="plan-range-text">
                  {planSummary.startVerse && planSummary.endVerse
                    ? `${surahByNumber?.get(planSummary.startVerse.surah)?.englishName || "Surah"} ${planSummary.startVerse.ayah} - ${surahByNumber?.get(planSummary.endVerse.surah)?.englishName || "Surah"} ${planSummary.endVerse.ayah}`
                    : "Set up your reading plan"}
                </p>
                {planSummary.startVerse && (
                  <button
                    className="plan-jump-btn"
                    onClick={() => {
                      onJumpToAyah(planSummary.startVerse.surah, planSummary.startVerse.ayah);
                      setShowQuickPanel(false);
                    }}
                  >
                    Start Reading
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {quickPanelTab === "settings" && (
          <div className="quick-panel-section study-settings-premium">
            <div className="study-settings-group study-card">
              <h4 className="study-settings-title">Display</h4>
              <div className="study-toggle-list">
                <label className="study-premium-toggle">
                  <div className="toggle-info">
                    <span className="toggle-icon">📖</span>
                    <span className="toggle-label">Show Translation</span>
                  </div>
                  <div className={`toggle-switch ${showTranslation ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={showTranslation}
                      onChange={(event) => setShowTranslation(event.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </div>
                </label>
                <label className="study-premium-toggle">
                  <div className="toggle-info">
                    <span className="toggle-icon">🌙</span>
                    <span className="toggle-label">Dim Other Ayahs</span>
                  </div>
                  <div className={`toggle-switch ${dimNonFocused ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={dimNonFocused}
                      onChange={(event) => setDimNonFocused(event.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </div>
                </label>
                <label className="study-premium-toggle">
                  <div className="toggle-info">
                    <span className="toggle-icon">⬇️</span>
                    <span className="toggle-label">Auto-scroll on Play</span>
                  </div>
                  <div className={`toggle-switch ${autoScrollPlaying ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={autoScrollPlaying}
                      onChange={(event) => setAutoScrollPlaying(event.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </div>
                </label>
              </div>
            </div>

            <div className="study-settings-group study-card">
              <h4 className="study-settings-title">Text Size</h4>
              <div className="study-premium-sliders">
                <div className="study-premium-slider">
                  <div className="slider-row">
                    <span className="slider-icon-box">ع</span>
                    <span className="slider-name">Arabic</span>
                    <span className="slider-val">{Math.round((fontScale?.arabic || 1) * 100)}%</span>
                  </div>
                  <div className="slider-track-wrap">
                    <div
                      className="slider-track-fill"
                      style={{ width: `${((fontScale?.arabic || 1) - 0.6) / 1.4 * 100}%` }}
                    />
                    <input
                      type="range"
                      min="0.6"
                      max="2"
                      step="0.05"
                      value={fontScale?.arabic || 1}
                      onChange={(event) =>
                        setFontScale((prev) => ({
                          ...prev,
                          arabic: clamp(Number(event.target.value), 0.6, 2)
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="study-premium-slider">
                  <div className="slider-row">
                    <span className="slider-icon-box">A</span>
                    <span className="slider-name">Translation</span>
                    <span className="slider-val">{Math.round((fontScale?.translation || 1) * 100)}%</span>
                  </div>
                  <div className="slider-track-wrap">
                    <div
                      className="slider-track-fill"
                      style={{ width: `${((fontScale?.translation || 1) - 0.7) / 0.9 * 100}%` }}
                    />
                    <input
                      type="range"
                      min="0.7"
                      max="1.6"
                      step="0.05"
                      value={fontScale?.translation || 1}
                      onChange={(event) =>
                        setFontScale((prev) => ({
                          ...prev,
                          translation: clamp(Number(event.target.value), 0.7, 1.6)
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="study-settings-group study-card">
              <h4 className="study-settings-title">Playback</h4>
              <div className="study-premium-slider">
                <div className="slider-row">
                  <span className="slider-icon-box">⏱</span>
                  <span className="slider-name">Speed</span>
                  <span className="slider-val">{playbackRate.toFixed(2)}x</span>
                </div>
                <div className="slider-track-wrap">
                  <div
                    className="slider-track-fill"
                    style={{ width: `${((playbackRate - 0.75) / 0.5) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0.75"
                    max="1.25"
                    step="0.05"
                    value={playbackRate}
                    onChange={(event) => setPlaybackRate(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="study-settings-group study-card">
              <h4 className="study-settings-title">Arabic Font</h4>
              <select
                className="study-select"
                value={arabicFontId}
                onChange={(event) => setArabicFontId(event.target.value)}
              >
                {(arabicFonts || []).map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="study-settings-group study-card">
              <h4 className="study-settings-title">Reciter</h4>
              <div className="study-reciter-grid">
                {(reciters || []).map((reciter) => (
                  <button
                    key={reciter.id}
                    className={`study-reciter-chip ${reciterId === reciter.id ? "selected" : ""}`}
                    onClick={() => setReciterId(reciter.id)}
                  >
                    <span className="reciter-avatar-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                      </svg>
                    </span>
                    <span className="reciter-chip-name">{reciter.label}</span>
                    {reciterId === reciter.id && (
                      <span className="reciter-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {quickPanelTab === "memorize" && (
          <div className="quick-panel-section">
            <div className="study-card memorize-card">
              <h4>Memorize Range</h4>
              <div className="memorize-grid">
                <label className="memorize-field">
                  <span>Start Ayah</span>
                  <input
                    type="number"
                    min={1}
                    max={selectedSurah?.numberOfAyahs || 1}
                    value={memorizeConfig?.startAyah || 1}
                    onChange={(event) =>
                      setMemorizeConfig((prev) => ({
                        ...prev,
                        startAyah: Number(event.target.value)
                      }))
                    }
                  />
                </label>
                <label className="memorize-field">
                  <span>End Ayah</span>
                  <input
                    type="number"
                    min={memorizeConfig?.startAyah || 1}
                    max={selectedSurah?.numberOfAyahs || 1}
                    value={memorizeConfig?.endAyah || 1}
                    onChange={(event) =>
                      setMemorizeConfig((prev) => ({
                        ...prev,
                        endAyah: Number(event.target.value)
                      }))
                    }
                  />
                </label>
                <label className="memorize-field">
                  <span>Loops (0 = ∞)</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={memorizeConfig?.loops ?? 0}
                    onChange={(event) =>
                      setMemorizeConfig((prev) => ({
                        ...prev,
                        loops: Number(event.target.value)
                      }))
                    }
                  />
                </label>
              </div>
              <div className="memorize-actions">
                {memorizeConfig?.active ? (
                  <button className="control-btn" onClick={onStopMemorize}>
                    Stop Memorize
                  </button>
                ) : (
                  <button
                    className="control-btn primary"
                    onClick={() =>
                      onStartMemorize({
                        startAyah: memorizeConfig.startAyah,
                        endAyah: memorizeConfig.endAyah,
                        loops: memorizeConfig.loops
                      })
                    }
                  >
                    Start Memorize
                  </button>
                )}
                {memorizeConfig?.active && (
                  <span className="memorize-status">
                    {memorizeConfig.loops === 0
                      ? "Looping ∞"
                      : `Loops left: ${memorizeConfig.remaining || 0}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {quickPanelTab === "tools" && (
          <div className="quick-panel-section">
            <div className="study-card tools-card">
              <h4>Study Tools</h4>
              <div className="tool-grid">
                <label className="tool-toggle">
                  <input
                    type="checkbox"
                    checked={showTajweed}
                    onChange={(event) => setShowTajweed(event.target.checked)}
                  />
                  <span>Tajweed Colors</span>
                </label>
                <label className="tool-toggle">
                  <input
                    type="checkbox"
                    checked={showWordByWord}
                    onChange={(event) => setShowWordByWord(event.target.checked)}
                  />
                  <span>Word by Word Audio</span>
                </label>
                <label className="tool-toggle">
                  <input
                    type="checkbox"
                    checked={isMushafView}
                    onChange={(event) => setIsMushafView(event.target.checked)}
                  />
                  <span>Mushaf View</span>
                </label>
              </div>
              <div className="tool-section">
                <span className="tool-label">Script</span>
                <div className="tool-buttons">
                  <button
                    className={`control-btn${scriptStyle === "uthmani" ? " primary" : ""}`}
                    onClick={() => setScriptStyle("uthmani")}
                  >
                    Uthmani
                  </button>
                  <button
                    className={`control-btn${scriptStyle === "naskh" ? " primary" : ""}`}
                    onClick={() => setScriptStyle("naskh")}
                  >
                    Naskh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {quickPanelTab === "search" && (
          <div className="quick-panel-section">
            <div className="study-card search-card">
              <h4>Search the Quran</h4>
              <div className="search-row">
                <input
                  type="text"
                  placeholder="Keyword or topic"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runSearch();
                  }}
                />
                <button className="control-btn primary" onClick={runSearch}>
                  Search
                </button>
              </div>
              {searchLoading && <p className="status">Searching…</p>}
              {searchError && <p className="status error">{searchError}</p>}
              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className="status">No results yet.</p>
              )}
              {searchResults.length > 0 && (
                <ul className="search-results">
                  {searchResults.map((result, index) => {
                    const name = result.surah
                      ? surahByNumber?.get(result.surah)?.englishName || `Surah ${result.surah}`
                      : "Surah";
                    const location = result.ayah ? `Ayah ${result.ayah}` : "";
                    return (
                      <li key={`${result.surah}-${result.ayah}-${index}`}>
                        <div className="search-result-main">
                          <span className="search-result-title">{name} {location}</span>
                          <span className="search-result-text">
                            {result.translation || result.text || "Result"}
                          </span>
                        </div>
                        {result.surah && result.ayah && (
                          <button
                            className="quick-item-action"
                            onClick={() => {
                              onJumpToAyah(result.surah, result.ayah);
                              setShowQuickPanel(false);
                            }}
                          >
                            Go
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {quickPanelTab === "notes" && (
          <div className="quick-panel-section">
            <div className="study-card notes-card">
              {sortedNotes?.length > 0 ? (
                <ul className="quick-list">
                  {sortedNotes.map((note) => {
                    const name = surahByNumber?.get(note.surah)?.englishName || `Surah ${note.surah}`;
                    const preview = note.value.length > 60 ? `${note.value.slice(0, 60)}...` : note.value;
                    return (
                      <li key={note.key} className="quick-list-item">
                        <div className="quick-item-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </div>
                        <div className="quick-item-content">
                          <span className="quick-item-title">{name} - Ayah {note.ayah}</span>
                          <span className="quick-item-sub">{preview}</span>
                        </div>
                        <button
                          className="quick-item-action"
                          onClick={() => {
                            onOpenNote(note.surah, note.ayah);
                            setShowQuickPanel(false);
                          }}
                        >
                          Edit
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="quick-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <p>No notes yet</p>
                  <span>Tap the note icon on any ayah to add thoughts</span>
                </div>
              )}
            </div>
          </div>
        )}
      </QuickPanel>

      {/* Hidden audio element for word audio */}
      <audio ref={wordAudioRef} hidden />
    </div>
  );
}
