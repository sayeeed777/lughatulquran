"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioPlayer, ProgressBar } from "../common";
import { useLocalStorage } from "../../hooks";
import { getLocalDateString } from "../../lib/utils";
import { fetchJSON } from "../../lib/apiClient";
import { ProgressRing, FloatingButton, QuickPanel, StatCard } from "./StudyComponents";

type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
};

type AyahTranslation = { text?: string };

type Ayah = {
  number: number;
  arabic?: string;
  arabicTajweed?: string | null;
  pageNumber?: number | null;
  translations?: Record<string, AyahTranslation>;
};

type SurahData = {
  ayahs?: Ayah[];
};

type Reciter = { id: string; label: string; baseUrl: string };

type ArabicFont = { id: string; label: string; css: string };

type ReadingPlan = {
  startDate: string;
  perDay: number;
  startSurah: number;
  startAyah: number;
};

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

  const handleWordAudio = (word: Word) => {
    if (!word.audioUrl) return;
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      wordAudioRef.current.currentTime = 0;
    }
    setWordAudioUrl(word.audioUrl);
    setTimeout(() => {
      wordAudioRef.current?.play().catch(() => {});
    }, 100);
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
              <button className="study-settings-btn" onClick={() => setShowQuickPanel(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 2.09V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09A1.65 1.65 0 0 0 21.91 11H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Study Content */}
      <div className="study-content" ref={scrollContainerRef}>
        <div className="study-ayah-list">
          {ayahs.map((ayah, index) => {
            const key = verseKey(selectedSurah?.number || 0, ayah.number);
            const isFocused = focusedAyahKey === key;
            const isCurrentlyPlaying = nowPlaying?.surah === selectedSurah?.number && nowPlaying?.ayah === ayah.number;
            const words = wordByAyah[selectedSurah?.number || 0]?.[ayah.number] || [];
            const isSaved = isBookmarked(selectedSurah?.number || 0, ayah.number);
            const note = hasNote(selectedSurah?.number || 0, ayah.number);

            return (
              <div
                key={key}
                id={`ayah-${ayah.number}`}
                className={`study-ayah-card${isFocused ? " focused" : ""}${
                  dimNonFocused && !isFocused ? " dimmed" : ""
                }${isCurrentlyPlaying ? " playing" : ""}`}
                onClick={() => {
                  setFocusedAyahKey(key);
                  onPlayAyah(selectedSurah?.number || 0, ayah.number);
                }}
              >
                <div className="study-ayah-header">
                  <span className="study-ayah-number">Ayah {ayah.number}</span>
                  <div className="study-ayah-actions">
                    <button
                      className={`action-icon-btn play-icon${isCurrentlyPlaying && !isAudioPaused ? " playing" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlay(selectedSurah?.number || 0, ayah.number);
                      }}
                      aria-label={isCurrentlyPlaying && !isAudioPaused ? "Pause ayah" : "Play ayah"}
                    >
                      {isCurrentlyPlaying && !isAudioPaused ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                          <rect x="14" y="5" width="4" height="14" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <polygon points="6,4 20,12 6,20" fill="currentColor" />
                        </svg>
                      )}
                    </button>
                    <button
                      className={`action-icon-btn${isSaved ? " saved" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(selectedSurah?.number || 0, ayah.number);
                      }}
                      aria-label={isSaved ? "Remove bookmark" : "Save bookmark"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M6 3h12a2 2 0 0 1 2 2v16l-8-5-8 5V5a2 2 0 0 1 2-2z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      className={`action-icon-btn${note ? " saved" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNote(selectedSurah?.number || 0, ayah.number);
                      }}
                      aria-label={note ? "Edit note" : "Add note"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 20h9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="study-ayah-body">
                  <p className="study-ayah-arabic" lang="ar" dir="rtl">
                    {showTajweed ? ayah.arabicTajweed || ayah.arabic : ayah.arabic}
                  </p>
                  {showTranslation && (
                    <p className="study-ayah-translation">
                      {ayah.translations?.[primaryTranslation]?.text || "Translation unavailable."}
                    </p>
                  )}
                </div>

                {showWordByWord && (
                  <div className="study-words">
                    {wordLoading && !words.length ? (
                      <p className="meta">Loading word-by-word...</p>
                    ) : words.length ? (
                      words.map((word, wordIndex) => (
                        <button
                          key={`${key}-${wordIndex}`}
                          className="word-chip"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWordAudio(word);
                          }}
                        >
                          <span className="word-ar" lang="ar" dir="rtl">
                            {word.arabic}
                          </span>
                          {word.translation && <span className="word-en">{word.translation}</span>}
                        </button>
                      ))
                    ) : (
                      <p className="meta">No word-by-word data available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio Player */}
      <AudioPlayer
        reciterLabel={reciterLabel}
        nowPlayingLabel={
          nowPlaying
            ? `${selectedSurah?.englishName || "Surah"} - Ayah ${nowPlaying.ayah}`
            : "Select an ayah to play."
        }
        audioSrc={audioSrc}
        isAutoPlaying={isAutoPlaying}
        isAudioPaused={isAudioPaused}
        onPlaySurah={onPlaySurah}
        onStopAutoPlay={onStopAutoPlay}
        onAudioEnded={onAudioEnded}
        selectedSurah={selectedSurah}
        nowPlaying={nowPlaying}
        showPlayerBar
      />

      {/* Floating Controls */}
      <FloatingButton onClick={() => setShowQuickPanel(true)} />

      {/* Quick Panel */}
      <QuickPanel isOpen={showQuickPanel} onClose={() => setShowQuickPanel(false)} title="Controls">
        <div className="quick-panel-tabs">
          {railItems.map((item) => (
            <button
              key={item.id}
              className={`quick-tab${quickPanelTab === item.id ? " active" : ""}`}
              onClick={() => setQuickPanelTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="quick-panel-body">
          {quickPanelTab === "study" && (
            <div className="quick-panel-section">
              <StatCard label="Progress" value={`${progress}%`} icon="📈" color="var(--accent)" />
              <StatCard label="Today" value={`${goalProgress}/${goalTarget}`} icon="🎯" color="var(--accent-2)" />
              <StatCard label="Plan" value={planLabel} icon="🗓" color="var(--accent)" />

              <div className="quick-toggle">
                <span>Auto-scroll</span>
                <button
                  className={`toggle-btn${autoScrollPlaying ? " active" : ""}`}
                  onClick={() => setAutoScrollPlaying((prev) => !prev)}
                >
                  {autoScrollPlaying ? "On" : "Off"}
                </button>
              </div>

              <div className="quick-toggle">
                <span>Dim non-focused</span>
                <button
                  className={`toggle-btn${dimNonFocused ? " active" : ""}`}
                  onClick={() => setDimNonFocused((prev) => !prev)}
                >
                  {dimNonFocused ? "On" : "Off"}
                </button>
              </div>

              <div className="quick-toggle">
                <span>Show Tajweed</span>
                <button
                  className={`toggle-btn${showTajweed ? " active" : ""}`}
                  onClick={() => setShowTajweed((prev) => !prev)}
                >
                  {showTajweed ? "On" : "Off"}
                </button>
              </div>

              <div className="quick-toggle">
                <span>Word-by-word</span>
                <button
                  className={`toggle-btn${showWordByWord ? " active" : ""}`}
                  onClick={() => setShowWordByWord((prev) => !prev)}
                >
                  {showWordByWord ? "On" : "Off"}
                </button>
              </div>
            </div>
          )}

          {quickPanelTab === "memorize" && (
            <div className="quick-panel-section">
              <div className="quick-field">
                <label>Start Ayah</label>
                <input
                  type="number"
                  min={1}
                  max={selectedSurah?.numberOfAyahs || 1}
                  value={memorizeConfig.startAyah}
                  onChange={(event) =>
                    setMemorizeConfig((prev) => ({
                      ...prev,
                      startAyah: clamp(Number(event.target.value), 1, selectedSurah?.numberOfAyahs || 1)
                    }))
                  }
                />
              </div>
              <div className="quick-field">
                <label>End Ayah</label>
                <input
                  type="number"
                  min={memorizeConfig.startAyah}
                  max={selectedSurah?.numberOfAyahs || 1}
                  value={memorizeConfig.endAyah}
                  onChange={(event) =>
                    setMemorizeConfig((prev) => ({
                      ...prev,
                      endAyah: clamp(
                        Number(event.target.value),
                        memorizeConfig.startAyah,
                        selectedSurah?.numberOfAyahs || 1
                      )
                    }))
                  }
                />
              </div>
              <div className="quick-field">
                <label>Loops</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={memorizeConfig.loops}
                  onChange={(event) =>
                    setMemorizeConfig((prev) => ({
                      ...prev,
                      loops: Math.max(0, Number(event.target.value))
                    }))
                  }
                />
              </div>
              <div className="quick-actions">
                <button
                  className="action-btn"
                  onClick={() => onStartMemorize({
                    startAyah: memorizeConfig.startAyah,
                    endAyah: memorizeConfig.endAyah,
                    loops: memorizeConfig.loops
                  })}
                >
                  Start Memorize
                </button>
                <button className="action-btn" onClick={onStopMemorize}>
                  Stop
                </button>
              </div>
            </div>
          )}

          {quickPanelTab === "settings" && (
            <div className="quick-panel-section">
              <div className="quick-field">
                <label>Arabic Font</label>
                <select value={arabicFontId} onChange={(event) => setArabicFontId(event.target.value)}>
                  {arabicFonts.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="quick-field">
                <label>Reciter</label>
                <select value={reciterId} onChange={(event) => setReciterId(event.target.value)}>
                  {reciters.map((reciter) => (
                    <option key={reciter.id} value={reciter.id}>
                      {reciter.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="quick-field">
                <label>Playback speed</label>
                <select
                  value={playbackRate}
                  onChange={(event) => setPlaybackRate(Number(event.target.value))}
                >
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}x
                    </option>
                  ))}
                </select>
              </div>

              <div className="quick-field">
                <label>Arabic size</label>
                <input
                  type="range"
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  value={fontScale.arabic}
                  onChange={(event) =>
                    setFontScale((prev) => ({
                      ...prev,
                      arabic: clamp(Number(event.target.value), 0.8, 1.6)
                    }))
                  }
                />
              </div>

              <div className="quick-field">
                <label>Translation size</label>
                <input
                  type="range"
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  value={fontScale.translation}
                  onChange={(event) =>
                    setFontScale((prev) => ({
                      ...prev,
                      translation: clamp(Number(event.target.value), 0.8, 1.6)
                    }))
                  }
                />
              </div>
            </div>
          )}

          {quickPanelTab === "tools" && (
            <div className="quick-panel-section">
              <button
                className="action-btn"
                onClick={() => {
                  if (!selectedSurah) return;
                  onPlaySurah(focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : 1);
                }}
              >
                Play from focused
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  if (!selectedSurah) return;
                  const randomAyah = Math.floor(Math.random() * selectedSurah.numberOfAyahs) + 1;
                  onJumpToAyah(selectedSurah.number, randomAyah);
                }}
              >
                Random ayah
              </button>
            </div>
          )}

          {quickPanelTab === "search" && (
            <div className="quick-panel-section">
              <div className="quick-field">
                <label>Search Ayahs</label>
                <input
                  type="text"
                  placeholder="Search translations"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <button className="action-btn" onClick={runSearch}>
                Search
              </button>
              {searchLoading && <p className="meta">Searching...</p>}
              {searchError && <p className="meta error">{searchError}</p>}
              {!!searchResults.length && (
                <div className="search-results">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      className="search-result"
                      onClick={() => navigateToAyah(result.surah, result.ayah)}
                    >
                      <span>
                        {surahByNumber.get(result.surah)?.englishName || `Surah ${result.surah}`} - Ayah {result.ayah}
                      </span>
                      <span className="result-text">{result.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {quickPanelTab === "notes" && (
            <div className="quick-panel-section">
              {sortedNotes.length ? (
                <div className="quick-notes">
                  {sortedNotes.map((note) => (
                    <button
                      key={note.key}
                      className="note-item"
                      onClick={() => navigateToAyah(note.surah, note.ayah)}
                    >
                      <strong>
                        {surahByNumber.get(note.surah)?.englishName || `Surah ${note.surah}`} - Ayah {note.ayah}
                      </strong>
                      <span>{note.value}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="meta">No notes yet.</p>
              )}
            </div>
          )}
        </div>
      </QuickPanel>

      {/* Floating Controls */}
      <FloatingButton onClick={() => setShowControls((prev) => !prev)} />

      {/* Hidden audio element for word audio */}
      <audio ref={wordAudioRef} src={wordAudioUrl || undefined} />
    </div>
  );
}
