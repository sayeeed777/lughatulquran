"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
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

type TajweedTagName = "tajweed" | "span";

type TajweedStackNode = {
  tag: TajweedTagName;
  className: string | null;
  children: ReactNode[];
};

const sanitizeClassName = (value: string) => value.replace(/[^a-zA-Z0-9 _-]/g, "").trim();

const extractClassName = (attrs: string) => {
  const match = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const raw = (match?.[1] || match?.[2] || match?.[3] || "").trim();
  return raw ? sanitizeClassName(raw) : "";
};

const renderTajweedMarkup = (markup: string): ReactNode[] => {
  if (!markup) return [""];

  // Quran.com returns a small custom markup subset (e.g. <tajweed class=madda_necessary>...</tajweed>).
  // We render only a safe allowlist of tags/attributes to avoid XSS.
  const root: ReactNode[] = [];
  const stack: TajweedStackNode[] = [];
  let keyCounter = 0;

  const append = (node: ReactNode) => {
    if (node === null || node === undefined || node === "") return;
    if (stack.length) {
      stack[stack.length - 1]?.children.push(node);
    } else {
      root.push(node);
    }
  };

  const appendText = (text: string) => {
    if (!text) return;
    append(text);
  };

  let cursor = 0;
  while (cursor < markup.length) {
    const lt = markup.indexOf("<", cursor);
    if (lt === -1) {
      appendText(markup.slice(cursor));
      break;
    }
    appendText(markup.slice(cursor, lt));

    const gt = markup.indexOf(">", lt + 1);
    if (gt === -1) {
      appendText(markup.slice(lt));
      break;
    }

    const rawTag = markup.slice(lt + 1, gt).trim();
    cursor = gt + 1;

    if (!rawTag) continue;

    // Closing tag
    if (rawTag.startsWith("/")) {
      const tagName = rawTag.slice(1).split(/\s+/, 1)[0] as TajweedTagName | string;
      const node = stack.pop();
      if (!node || node.tag !== tagName) {
        // Malformed markup; fall back to plain text.
        return [markup.replace(/<[^>]*>/g, "")];
      }
      const key = `${node.tag}-${keyCounter++}`;
      if (node.tag === "tajweed") {
        const className = node.className ? `tajweed ${node.className}` : "tajweed";
        append(
          <span key={key} className={className}>
            {node.children}
          </span>
        );
      } else if (node.tag === "span") {
        append(
          <span key={key} className={node.className || undefined}>
            {node.children}
          </span>
        );
      }
      continue;
    }

    // Opening tag
    const tagName = rawTag.split(/\s+/, 1)[0] as TajweedTagName | string;
    if (tagName !== "tajweed" && tagName !== "span") {
      // Ignore unknown tags but keep their inner text (handled by the main loop).
      continue;
    }

    const className = extractClassName(rawTag);
    stack.push({
      tag: tagName,
      className: className || null,
      children: []
    });
  }

  if (stack.length) {
    // Unbalanced tags; fall back to plain text.
    return [markup.replace(/<[^>]*>/g, "")];
  }

  return root;
};

const TAJWEED_LEGEND: Array<{ swatchClass: string; label: string; description: string }> = [
  {
    swatchClass: "ham_wasl",
    label: "Hamzat al-wasl",
    description: "Connecting hamza; usually dropped when linking from the previous word."
  },
  {
    swatchClass: "laam_shamsiyah",
    label: "Laam shamsiyah (sun letters)",
    description: "Lam is assimilated; the following letter is emphasized."
  },
  {
    swatchClass: "laam_qamariyah",
    label: "Laam qamariyah (moon letters)",
    description: "Lam is pronounced clearly before the following letter."
  },
  {
    swatchClass: "madda_normal",
    label: "Madd (natural)",
    description: "Elongate 2 counts (2 harakah)."
  },
  {
    swatchClass: "madda_permissible",
    label: "Madd (permissible)",
    description: "Elongate 2–4 counts (varies by recitation)."
  },
  {
    swatchClass: "madda_obligatory",
    label: "Madd (obligatory)",
    description: "Elongate 4–5 counts."
  },
  {
    swatchClass: "madda_necessary",
    label: "Madd (necessary)",
    description: "Elongate 6 counts."
  },
  {
    swatchClass: "qalqalah",
    label: "Qalqalah (echo)",
    description: "A slight echo/bounce sound on certain letters when they carry sukoon."
  },
  {
    swatchClass: "ikhafa",
    label: "Ikhfaa / Ikhafa",
    description: "Concealment with nasalization (ghunnah) for ~2 counts."
  },
  {
    swatchClass: "ikhafa_shafawi",
    label: "Ikhfaa shafawi",
    description: "Labial concealment (mim before ba) with ghunnah for ~2 counts."
  },
  {
    swatchClass: "iqlab",
    label: "Iqlab",
    description: "Change nun sakinah/tanween before ba into a hidden mim with ghunnah."
  },
  {
    swatchClass: "idgham_with_ghunnah",
    label: "Idgham (with ghunnah)",
    description: "Merge with nasalization (ghunnah) for ~2 counts."
  },
  {
    swatchClass: "idgham_without_ghunnah",
    label: "Idgham (without ghunnah)",
    description: "Merge without nasalization."
  },
  {
    swatchClass: "idgham_shafawi",
    label: "Idgham shafawi",
    description: "Mim merging (mim before mim) with ghunnah."
  },
  {
    swatchClass: "ghunnah",
    label: "Ghunnah",
    description: "Nasalization (usually 2 counts) on nun/mim with shaddah."
  },
  {
    swatchClass: "slnt",
    label: "Silent letter",
    description: "A letter present in the script that is not pronounced."
  }
];

const TAFSIR_EDITIONS = [
  { id: "en-tafsir-maarif-ul-quran", label: "Maarif-ul-Quran" },
  { id: "en-kashf-al-asrar-tafsir", label: "Kashf Al-Asrar" },
  { id: "en-al-jalalayn", label: "Al-Jalalayn" }
] as const;

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
  const [showTajweedLegend, setShowTajweedLegend] = useState(false);
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
  const [tafsirEdition, setTafsirEdition] = useLocalStorage<string>(
    "quran_tafsir_edition",
    TAFSIR_EDITIONS[0].id
  );
  const [tafsirText, setTafsirText] = useState("");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);
  const [showMemorizeModal, setShowMemorizeModal] = useState(false);
  const [memorizeMode, setMemorizeMode] = useState<"single" | "range" | "surah">("single");
  const [memorizeDraft, setMemorizeDraft] = useState({
    startAyah: 1,
    endAyah: 1,
    loops: 2
  });
  const lastTafsirKeyRef = useRef<string | null>(null);
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

  const railItems = useMemo(
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

  const isBookmarked = useCallback(
    (surah: number, ayah: number) => bookmarks?.includes(verseKey(surah, ayah)),
    [bookmarks, verseKey]
  );
  const hasNote = useCallback(
    (surah: number, ayah: number) => notes?.[verseKey(surah, ayah)],
    [notes, verseKey]
  );

  const parseVerseKey = (key: string) => {
    const [surah, ayah] = key.split(":").map(Number);
    return { surah, ayah };
  };

  useEffect(() => {
    if (!TAFSIR_EDITIONS.some((edition) => edition.id === tafsirEdition)) {
      setTafsirEdition(TAFSIR_EDITIONS[0].id);
    }
  }, [tafsirEdition, setTafsirEdition]);

  useEffect(() => {
    if (!showQuickPanel || quickPanelTab !== "tafsir") return;
    if (!selectedSurah?.number) return;

    const focused = focusedAyahKey ? parseVerseKey(focusedAyahKey) : null;
    const ayahNumber = focused?.ayah || currentAyahIndex || 1;
    if (!Number.isFinite(ayahNumber) || ayahNumber < 1) return;

    const key = `${String(tafsirEdition)}:${selectedSurah.number}:${ayahNumber}`;
    if (lastTafsirKeyRef.current === key) return;
    lastTafsirKeyRef.current = key;

    setTafsirLoading(true);
    setTafsirError(null);

    fetchJSON<{ text?: string; error?: string }>(
      `/api/tafsir?edition=${encodeURIComponent(String(tafsirEdition))}&surah=${selectedSurah.number}&ayah=${ayahNumber}`,
      {
        ttl: 30 * 24 * 60 * 60 * 1000,
        retries: 1,
        retryDelay: 300,
        cacheKey: `tafsir:v2:${String(tafsirEdition)}:${selectedSurah.number}:${ayahNumber}`,
        persist: true,
        staleWhileRevalidate: true
      }
    )
      .then((payload) => {
        if (payload?.error) {
          setTafsirError(payload.error);
          setTafsirText("");
          lastTafsirKeyRef.current = null;
          return;
        }
        const rawText = typeof payload?.text === "string" ? payload.text : "";
        const text = rawText.replace(/\uFFFD+/gu, " ").replace(/\s+/g, " ").trim();
        setTafsirText(text);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to load tafsir.";
        setTafsirError(message);
        setTafsirText("");
        lastTafsirKeyRef.current = null;
      })
      .finally(() => setTafsirLoading(false));
  }, [showQuickPanel, quickPanelTab, selectedSurah?.number, focusedAyahKey, currentAyahIndex, tafsirEdition]);

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

  const navigateToAyah = useCallback(
    (surahNumber: number, ayahNumber: number) => {
    onJumpToAyah(surahNumber, ayahNumber);
    setShowQuickPanel(false);
    },
    [onJumpToAyah]
  );

  const resolveWordAudioUrl = useCallback((audioUrl?: string) => {
    if (!audioUrl) return "";
    if (audioUrl.startsWith("http")) return audioUrl;
    return `https://audio.qurancdn.com/${audioUrl.replace(/^\//, "")}`;
  }, []);

  const handleWordAudio = useCallback(
    (audioUrl?: string) => {
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
    },
    [resolveWordAudioUrl]
  );

  const openMemorizeModal = useCallback(
    (ayahNumber: number) => {
      if (!selectedSurah) return;
      const max = selectedSurah.numberOfAyahs;
      const start = clamp(Number(ayahNumber) || 1, 1, max);
      setMemorizeMode("single");
      setMemorizeDraft({
        startAyah: start,
        endAyah: start,
        loops: Number.isFinite(memorizeConfig?.loops) ? memorizeConfig.loops : 2
      });
      setShowMemorizeModal(true);
    },
    [clamp, memorizeConfig?.loops, selectedSurah]
  );

  const closeMemorizeModal = useCallback(() => {
    setShowMemorizeModal(false);
  }, []);

  const applyMemorizeMode = useCallback(
    (mode: "single" | "range" | "surah") => {
      setMemorizeMode(mode);
      setMemorizeDraft((prev) => {
        if (!selectedSurah) return prev;
        if (mode === "single") {
          const start = clamp(Number(prev.startAyah) || 1, 1, selectedSurah.numberOfAyahs);
          return { ...prev, startAyah: start, endAyah: start };
        }
        if (mode === "surah") {
          return { ...prev, startAyah: 1, endAyah: selectedSurah.numberOfAyahs };
        }
        const start = clamp(Number(prev.startAyah) || 1, 1, selectedSurah.numberOfAyahs);
        const end = clamp(
          Number(prev.endAyah) || start,
          start,
          selectedSurah.numberOfAyahs
        );
        return { ...prev, startAyah: start, endAyah: end };
      });
    },
    [clamp, selectedSurah]
  );

  const updateMemorizeStart = useCallback(
    (value: number) => {
      if (!selectedSurah) return;
      const max = selectedSurah.numberOfAyahs;
      const start = clamp(Number(value) || 1, 1, max);
      setMemorizeDraft((prev) => {
        const end = memorizeMode === "single" ? start : clamp(prev.endAyah, start, max);
        return { ...prev, startAyah: start, endAyah: end };
      });
    },
    [clamp, memorizeMode, selectedSurah]
  );

  const updateMemorizeEnd = useCallback(
    (value: number) => {
      if (!selectedSurah) return;
      const max = selectedSurah.numberOfAyahs;
      setMemorizeDraft((prev) => {
        const start = clamp(prev.startAyah, 1, max);
        const end = clamp(Number(value) || start, start, max);
        return { ...prev, startAyah: start, endAyah: end };
      });
    },
    [clamp, selectedSurah]
  );

  const updateMemorizeLoops = useCallback((delta: number) => {
    setMemorizeDraft((prev) => {
      const raw = Number(prev.loops) || 0;
      const next = clamp(raw + delta, 0, 50);
      return { ...prev, loops: next };
    });
  }, [clamp]);

  const currentReciter = reciters?.find((r) => r.id === reciterId) || reciters?.[0];
  const ayahCards = useMemo(
    () =>
      ayahs.map((ayah, index) => {
        const ayahNum = ayah.number;
        const key = verseKey(selectedSurah?.number || 0, ayahNum);
        const bookmarked = isBookmarked(selectedSurah?.number || 0, ayahNum);
        const noted = hasNote(selectedSurah?.number || 0, ayahNum);
        const isPlaying = nowPlaying?.surah === selectedSurah?.number && nowPlaying?.ayah === ayahNum;
        const isActivePlay = isPlaying && !isAudioPaused;
        const words = showWordByWord
          ? wordByAyah?.[selectedSurah?.number || 0]?.[ayahNum] || []
          : [];
        const isFocused = focusedAyahKey === key;

        return (
          <motion.article
            key={key || `ayah-${index}`}
            id={`ayah-${ayahNum}`}
            className={`study-ayah-card${isActivePlay ? " playing" : ""}${isFocused ? " focused" : ""}${dimNonFocused && focusedAyahKey && !isFocused ? " dimmed" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => setFocusedAyahKey(key)}
            onFocus={() => setFocusedAyahKey(key)}
            tabIndex={0}
          >
            <div className="study-ayah-content">
              <div className="ayah-header study-ayah-header">
                <span className="ayah-number">Ayah {ayahNum}</span>
                <div className="ayah-actions">
                  <button
                    className="action-icon-btn memorize-icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      openMemorizeModal(ayahNum);
                    }}
                    aria-label="Memorize / Repeat"
                    title="Memorize / Repeat"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M17 2l4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 12v-2a4 4 0 0 1 4-4h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 22l-4-4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21 14v2a4 4 0 0 1-4 4H3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    className={`action-icon-btn play-icon${isActivePlay ? " playing" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTogglePlay(selectedSurah?.number || 0, ayahNum);
                    }}
                    aria-label={isActivePlay ? "Pause ayah" : "Play ayah"}
                    title={isActivePlay ? "Pause ayah" : "Play ayah"}
                  >
                    {isActivePlay ? (
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
                    className={`action-icon-btn${bookmarked ? " saved" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleBookmark(selectedSurah?.number || 0, ayahNum);
                    }}
                    aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
                    title={bookmarked ? "Remove bookmark" : "Save bookmark"}
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
                    className={`action-icon-btn${noted ? " saved" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenNote(selectedSurah?.number || 0, ayahNum);
                    }}
                    aria-label={noted ? "Edit note" : "Add note"}
                    title={noted ? "Edit note" : "Add note"}
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
              <p
                className="study-ayah-arabic"
                lang="ar"
                dir="rtl"
                style={{ fontSize: `calc(2rem * ${fontScale?.arabic || 1})` }}
              >
                {showTajweed && ayah.arabicTajweed
                  ? renderTajweedMarkup(ayah.arabicTajweed)
                  : ayah.arabic || ""}
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
                  {wordLoading && words.length === 0 && <span className="meta">Loading words…</span>}
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
          </motion.article>
        );
      }),
    [
      ayahs,
      dimNonFocused,
      focusedAyahKey,
      fontScale?.arabic,
      fontScale?.translation,
      handleWordAudio,
      hasNote,
      isAudioPaused,
      isBookmarked,
      isMushafView,
      nowPlaying,
      openMemorizeModal,
      onOpenNote,
      onToggleBookmark,
      onTogglePlay,
      primaryTranslation,
      resolveWordAudioUrl,
      selectedSurah?.number,
      setFocusedAyahKey,
      showTajweed,
      showTranslation,
      showWordByWord,
      verseKey,
      wordAudioUrl,
      wordByAyah,
      wordLoading
    ]
  );

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

        <div className="study-ayah-list">{ayahCards}</div>

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

        {quickPanelTab === "tools" && (
          <div className="quick-panel-section">
            <div className="study-card tools-card">
              <h4>Study Tools</h4>
	              <div className="tool-grid">
	                <label className="tool-toggle">
	                  <input
	                    type="checkbox"
	                    checked={showTajweed}
	                    onChange={(event) => {
	                      const next = event.target.checked;
	                      setShowTajweed(next);
	                      if (!next) {
	                        setShowTajweedLegend(false);
	                      }
	                    }}
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
	              {showTajweed && (
	                <>
	                  <button
	                    className="tool-toggle tool-legend-btn"
	                    type="button"
	                    onClick={() => setShowTajweedLegend((prev) => !prev)}
	                  >
	                    <span>Tajweed color key</span>
	                    <span className="tool-legend-chevron" aria-hidden="true">
	                      {showTajweedLegend ? "▾" : "▸"}
	                    </span>
	                  </button>
	                  {showTajweedLegend && (
	                    <div className="tajweed-legend" role="note" aria-label="Tajweed color key">
	                      <p className="tajweed-legend-hint">
	                        Counts are beats (harakah). This is a quick visual guide, not a full tajweed lesson.
	                      </p>
	                      <ul className="tajweed-legend-list">
	                        {TAJWEED_LEGEND.map((item) => (
	                          <li key={item.swatchClass} className="tajweed-legend-item">
	                            <span
	                              className={`tajweed-swatch tajweed ${item.swatchClass}`}
	                              aria-hidden="true"
	                            >
	                              Aa
	                            </span>
	                            <div className="tajweed-legend-text">
	                              <span className="tajweed-legend-label">{item.label}</span>
	                              <span className="tajweed-legend-desc">{item.description}</span>
	                            </div>
	                          </li>
	                        ))}
	                      </ul>
	                    </div>
	                  )}
	                </>
	              )}
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

        {quickPanelTab === "tafsir" && (
          <div className="quick-panel-section">
            <div className="study-card tafsir-card">
              <h4>Tafsir</h4>
              <div className="tafsir-controls">
                <label className="tafsir-field">
                  <span className="tool-label">Edition</span>
                  <select
                    className="study-select"
                    value={String(tafsirEdition)}
                    onChange={(event) => {
                      lastTafsirKeyRef.current = null;
                      setTafsirEdition(event.target.value);
                    }}
                  >
                    {TAFSIR_EDITIONS.map((edition) => (
                      <option key={edition.id} value={edition.id}>
                        {edition.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="tafsir-meta">
                  <span className="meta">
                    {selectedSurah?.englishName || "Surah"} · Ayah{" "}
                    {(focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : currentAyahIndex) || 1}
                  </span>
                  {selectedSurah?.number && currentAyahIndex > 0 && (
                    <button
                      className="quick-item-action"
                      onClick={() =>
                        setFocusedAyahKey(verseKey(selectedSurah.number, currentAyahIndex))
                      }
                    >
                      Use current
                    </button>
                  )}
                </div>
              </div>

              {tafsirLoading && <p className="status">Loading tafsir…</p>}
              {tafsirError && <p className="status error">{tafsirError}</p>}
              {!tafsirLoading && !tafsirError && (
                <div className="tafsir-text">
                  {tafsirText ? tafsirText : "No tafsir available for this ayah."}
                </div>
              )}
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
                        <button
                          className="quick-item-action"
                          onClick={() => {
                            onJumpToAyah(note.surah, note.ayah);
                            onOpenNote(note.surah, note.ayah);
                            setShowQuickPanel(false);
                          }}
                        >
                          Open
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

      <AnimatePresence>
        {showMemorizeModal && (
          <>
            <motion.div
              className="memorize-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMemorizeModal}
            />
            <motion.section
              className="memorize-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Repeat settings"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="memorize-modal-header">
                <div>
                  <h3>Repeat Settings</h3>
                  <p>{selectedSurah?.englishName || "Surah"}</p>
                </div>
                <button className="memorize-close" onClick={closeMemorizeModal} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="memorize-segmented">
                <button
                  className={`memorize-segment${memorizeMode === "single" ? " active" : ""}`}
                  onClick={() => applyMemorizeMode("single")}
                >
                  Single Verse
                </button>
                <button
                  className={`memorize-segment${memorizeMode === "range" ? " active" : ""}`}
                  onClick={() => applyMemorizeMode("range")}
                >
                  Range
                </button>
                <button
                  className={`memorize-segment${memorizeMode === "surah" ? " active" : ""}`}
                  onClick={() => applyMemorizeMode("surah")}
                >
                  Full Surah
                </button>
              </div>

              <div className="memorize-range">
                {memorizeMode === "surah" ? (
                  <div className="memorize-range-summary">
                    {selectedSurah?.englishName || "Surah"} · {selectedSurah?.numberOfAyahs || 0} ayahs
                  </div>
                ) : (
                  <div className="memorize-range-grid">
                    <label>
                      <span>Start ayah</span>
                      <input
                        type="number"
                        min={1}
                        max={selectedSurah?.numberOfAyahs || 1}
                        value={memorizeDraft.startAyah}
                        onChange={(event) => updateMemorizeStart(Number(event.target.value))}
                      />
                    </label>
                    {memorizeMode === "range" && (
                      <label>
                        <span>End ayah</span>
                        <input
                          type="number"
                          min={memorizeDraft.startAyah}
                          max={selectedSurah?.numberOfAyahs || 1}
                          value={memorizeDraft.endAyah}
                          onChange={(event) => updateMemorizeEnd(Number(event.target.value))}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="memorize-steps">
                <div className="memorize-step-row">
                  <span>Repeat range</span>
                  <div className="memorize-stepper">
                    <button type="button" onClick={() => updateMemorizeLoops(-1)} aria-label="Decrease repeats">
                      −
                    </button>
                    <span className="stepper-value">
                      {memorizeDraft.loops === 0 ? "∞" : memorizeDraft.loops}
                    </span>
                    <button type="button" onClick={() => updateMemorizeLoops(1)} aria-label="Increase repeats">
                      +
                    </button>
                  </div>
                  <span className="stepper-suffix">times</span>
                </div>
                <p className="memorize-hint">Set repeats to 0 for infinite looping.</p>
              </div>

              <div className="memorize-footer">
                {memorizeConfig?.active && (
                  <button
                    className="memorize-ghost"
                    onClick={() => {
                      onStopMemorize();
                      closeMemorizeModal();
                    }}
                  >
                    Stop
                  </button>
                )}
                <button className="memorize-ghost" onClick={closeMemorizeModal}>
                  Cancel
                </button>
                <button
                  className="memorize-primary"
                  onClick={() => {
                    const startAyah = memorizeMode === "surah" ? 1 : memorizeDraft.startAyah;
                    const endAyah =
                      memorizeMode === "surah"
                        ? selectedSurah?.numberOfAyahs || startAyah
                        : memorizeMode === "single"
                          ? startAyah
                          : memorizeDraft.endAyah;
                    onStartMemorize({
                      startAyah,
                      endAyah,
                      loops: memorizeDraft.loops
                    });
                    closeMemorizeModal();
                  }}
                >
                  Start
                </button>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      {/* Hidden audio element for word audio */}
      <audio ref={wordAudioRef} hidden />
    </div>
  );
}
