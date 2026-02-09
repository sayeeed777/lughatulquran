"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioPlayer } from "../common";
import { useLocalStorage } from "../../hooks";
import { getLocalDateString } from "../../lib/utils";
import { fetchJSON } from "../../lib/apiClient";
import { ProgressRing, QuickPanel } from "./StudyComponents";
import StudyAyahCard from "./StudyAyahCard";
import StudyMemorizeModal, { type MemorizeDraft, type MemorizeMode } from "./StudyMemorizeModal";
import StudyQuickPanelContent, { type QuickPanelTab } from "./StudyQuickPanelContent";
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

type Word = {
  arabic: string;
  translation?: string;
  audioUrl?: string;
  position?: number;
  lemma?: string;
  root?: string;
  rootArabic?: string;
};

type WordByAyah = Record<number, Word[]>;

type WordBySurah = Record<number, WordByAyah>;

type SelectedWordDetails = {
  surah: number;
  ayah: number;
  position: number;
  arabic: string;
  translation?: string;
  audioUrl?: string;
  lemma?: string;
  root?: string;
  rootArabic?: string;
};

type RootLexiconPayload = {
  root: string;
  rootArabic?: string;
  rootMeaning?: string | null;
  rootMeaningSource?: string;
  coreMeanings?: string[];
  definitions?: string[];
  lemmas?: string[];
  references?: string[];
  primaryRootMeaningsAvailable?: boolean;
  primaryRootMeaningsError?: string | null;
  laneAvailable?: boolean;
};

type WordByWordPayload = {
  wordsByAyah?: WordByAyah;
};

type StudyMarks = Record<string, true>;

const hasLexiconData = (wordsByAyah?: WordByAyah) => {
  if (!wordsByAyah) return false;
  for (const words of Object.values(wordsByAyah)) {
    for (const word of words || []) {
      if (word?.root || word?.lemma) {
        return true;
      }
    }
  }
  return false;
};

type TajweedTagName = "tajweed" | "span";

type TajweedStackNode = {
  tag: TajweedTagName;
  className: string | null;
  children: ReactNode[];
};

type RailItem = {
  id: QuickPanelTab;
  label: string;
  icon: ReactNode;
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
  playbackRate: number;
  setPlaybackRate: (value: number) => void;
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
  playbackRate,
  setPlaybackRate,
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
  const [quickPanelTab, setQuickPanelTab] = useState<QuickPanelTab>("study");
  const [readingTime, setReadingTime] = useState(0);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [showTajweed, setShowTajweed] = useState(false);
  const [showTajweedLegend, setShowTajweedLegend] = useState(false);
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [isMushafView, setIsMushafView] = useState(false);
  const [scriptStyle, setScriptStyle] = useState<"uthmani" | "naskh">("uthmani");
  const [showTranslation, setShowTranslation] = useState(true);
  const [dimNonFocused, setDimNonFocused] = useState(false);
  const [autoScrollPlaying, setAutoScrollPlaying] = useState(true);
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
  const [memorizeMode, setMemorizeMode] = useState<MemorizeMode>("single");
  const [memorizeDraft, setMemorizeDraft] = useState<MemorizeDraft>({
    startAyah: 1,
    endAyah: 1,
    loops: 2
  });
  const lastTafsirKeyRef = useRef<string | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [selectedWordDetails, setSelectedWordDetails] = useState<SelectedWordDetails | null>(null);
  const [isRootModalOpen, setIsRootModalOpen] = useState(false);
  const [rootLexicon, setRootLexicon] = useState<RootLexiconPayload | null>(null);
  const [rootLexiconLoading, setRootLexiconLoading] = useState(false);
  const [rootLexiconError, setRootLexiconError] = useState<string | null>(null);
  const [studyWordCache, setStudyWordCache] = useState<WordBySurah>({});
  const [studyWordLoading, setStudyWordLoading] = useState(false);
  const [studyMarks, setStudyMarks] = useLocalStorage<StudyMarks>("quran_study_marks", {});
  const [studyGoal, setStudyGoal] = useLocalStorage("quran_study_goal", {
    perDay: 15,
    date: getLocalDateString()
  });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerActivityRef = useRef(0);
  const rootLookupRequestRef = useRef(0);

  const ayahs = filteredAyahs || surahData?.ayahs || [];
  const selectedSurahNumber = selectedSurah?.number || 0;
  const wordsFromHook = selectedSurahNumber ? wordByAyah?.[selectedSurahNumber] : undefined;
  const wordsFromStudyCache = selectedSurahNumber ? studyWordCache?.[selectedSurahNumber] : undefined;
  const hookHasLexiconData = useMemo(() => hasLexiconData(wordsFromHook), [wordsFromHook]);
  const cacheHasLexiconData = useMemo(() => hasLexiconData(wordsFromStudyCache), [wordsFromStudyCache]);
  const wordsByAyahForStudy = useMemo<WordByAyah>(
    () => {
      if (hookHasLexiconData && wordsFromHook) return wordsFromHook;
      if (cacheHasLexiconData && wordsFromStudyCache) return wordsFromStudyCache;
      return wordsFromHook || wordsFromStudyCache || {};
    },
    [hookHasLexiconData, wordsFromHook, cacheHasLexiconData, wordsFromStudyCache]
  );
  const effectiveWordLoading = wordLoading || studyWordLoading;
  const totalAyahs = ayahs.length;
  const progress = totalAyahs > 0 ? Math.round((currentAyahIndex / totalAyahs) * 100) : 0;
  const goalTarget = Math.max(1, Number(studyGoal?.perDay) || 1);
  const goalProgress = Math.min(currentAyahIndex, goalTarget);

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

  useEffect(() => {
    if (!selectedSurahNumber) return;

    if (hookHasLexiconData && wordsFromHook) {
      setStudyWordCache((prev) => {
        if (prev[selectedSurahNumber]) return prev;
        return {
          ...prev,
          [selectedSurahNumber]: wordsFromHook
        };
      });
      return;
    }

    if (cacheHasLexiconData && wordsFromStudyCache) return;

    let isMounted = true;
    setStudyWordLoading(true);

    fetchJSON<WordByWordPayload>(`/api/words/${selectedSurahNumber}?v=6`, {
      ttl: 24 * 60 * 60 * 1000,
      retries: 1,
      retryDelay: 300,
      persist: true,
      staleWhileRevalidate: true
    })
      .then((payload) => {
        if (!isMounted) return;
        setStudyWordCache((prev) => ({
          ...prev,
          [selectedSurahNumber]: payload?.wordsByAyah || {}
        }));
      })
      .catch(() => {
        if (!isMounted) return;
      })
      .finally(() => {
        if (!isMounted) return;
        setStudyWordLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    selectedSurahNumber,
    wordsFromHook,
    wordsFromStudyCache,
    hookHasLexiconData,
    cacheHasLexiconData
  ]);

  // Auto-hide controls
  useEffect(() => {
    let frameId: number | null = null;
    const resetHideTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    };
    const revealControls = (throttleMs: number) => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (now - lastPointerActivityRef.current < throttleMs) return;
      lastPointerActivityRef.current = now;
      setShowControls((prev) => (prev ? prev : true));
      resetHideTimer();
    };
    const handlePointerMove = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        revealControls(120);
        frameId = null;
      });
    };
    const handlePointerDown = () => revealControls(0);
    const handleKeyDown = () => revealControls(0);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    resetHideTimer();

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Track scroll position for current ayah with intersection observer to avoid
  // scanning all cards on every scroll event.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const ayahElements = Array.from(
      container.querySelectorAll<HTMLElement>(".study-ayah-card")
    );
    if (ayahElements.length === 0) {
      setCurrentAyahIndex(0);
      return;
    }

    let frameId: number | null = null;
    let visibleEntries = new Map<Element, IntersectionObserverEntry>();
    let activeAyah = 0;
    const updateActiveAyah = () => {
      let bestAyah = activeAyah;
      let bestScore = -1;
      visibleEntries.forEach((entry, target) => {
        if (!entry.isIntersecting) return;
        const element = target as HTMLElement;
        const id = element.id.startsWith("ayah-")
          ? Number(element.id.slice(5))
          : Number.NaN;
        if (!Number.isFinite(id)) return;
        const rootTop = entry.rootBounds?.top ?? 0;
        const distance = Math.abs(entry.boundingClientRect.top - rootTop);
        const score = entry.intersectionRatio - distance / 10000;
        if (score > bestScore) {
          bestScore = score;
          bestAyah = id;
        }
      });
      if (bestAyah > 0 && bestAyah !== activeAyah) {
        activeAyah = bestAyah;
        setCurrentAyahIndex(bestAyah);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleEntries.set(entry.target, entry);
        });
        if (frameId !== null) return;
        frameId = window.requestAnimationFrame(() => {
          updateActiveAyah();
          frameId = null;
        });
      },
      {
        root: container,
        threshold: [0.15, 0.35, 0.6, 0.85],
        rootMargin: "-6% 0px -50% 0px"
      }
    );

    ayahElements.forEach((element) => observer.observe(element));
    const firstAyahId = Number(ayahElements[0]?.id.replace("ayah-", ""));
    if (Number.isFinite(firstAyahId) && firstAyahId > 0) {
      activeAyah = firstAyahId;
      setCurrentAyahIndex(firstAyahId);
    }

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      visibleEntries = new Map();
    };
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

  const setGoalPerDay = useCallback(
    (value: number) => {
      setStudyGoal((prev) => ({
        ...prev,
        perDay: value
      }));
    },
    [setStudyGoal]
  );

  const handleChangeTafsirEdition = useCallback(
    (edition: string) => {
      lastTafsirKeyRef.current = null;
      setTafsirEdition(edition);
    },
    [setTafsirEdition]
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

  const hydrateWordLexicon = useCallback(
    async (surahNumber: number, ayahNumber: number, position: number) => {
      const payload = await fetchJSON<WordByWordPayload>(`/api/words/${surahNumber}?v=6`, {
        ttl: 24 * 60 * 60 * 1000,
        retries: 1,
        retryDelay: 250,
        persist: true,
        staleWhileRevalidate: true
      });
      const wordsByAyahPayload = payload?.wordsByAyah || {};
      setStudyWordCache((prev) => ({
        ...prev,
        [surahNumber]: wordsByAyahPayload
      }));
      const ayahWords = wordsByAyahPayload?.[ayahNumber] || [];
      return (
        ayahWords.find((item, idx) => (Number(item.position) || idx + 1) === position) || null
      );
    },
    []
  );

  const fetchRootLexicon = useCallback(async (root?: string) => {
    const normalizedRoot = (root || "").trim();
    if (!normalizedRoot) return null;
    const requestId = rootLookupRequestRef.current + 1;
    rootLookupRequestRef.current = requestId;
    setRootLexiconLoading(true);
    setRootLexiconError(null);
    try {
      const payload = await fetchJSON<RootLexiconPayload>(
        `/api/lexicon/root/${encodeURIComponent(normalizedRoot)}`,
        { ttl: 24 * 60 * 60 * 1000, retries: 1, retryDelay: 250, persist: true }
      );
      if (rootLookupRequestRef.current !== requestId) return null;
      setRootLexicon(payload);
      return payload;
    } catch (error) {
      if (rootLookupRequestRef.current !== requestId) return null;
      const message = error instanceof Error ? error.message : "Failed to load root lexicon.";
      setRootLexicon(null);
      setRootLexiconError(message);
      return null;
    } finally {
      if (rootLookupRequestRef.current === requestId) {
        setRootLexiconLoading(false);
      }
    }
  }, []);

  const handleWordSelect = useCallback(
    (word: Word, ayahNumber: number, wordIndex: number) => {
      const surahNumber = selectedSurah?.number;
      if (!surahNumber) return;
      rootLookupRequestRef.current += 1;
      const position = Number(word.position) || wordIndex + 1;
      setSelectedWordDetails({
        surah: surahNumber,
        ayah: ayahNumber,
        position,
        arabic: word.arabic,
        translation: word.translation,
        audioUrl: word.audioUrl,
        lemma: word.lemma,
        root: word.root,
        rootArabic: word.rootArabic
      });
      setIsRootModalOpen(false);
      setRootLexicon(null);
      setRootLexiconError(null);

      if (word.root) {
        void fetchRootLexicon(word.root);
      }

      if (!word.root && !word.lemma) {
        void hydrateWordLexicon(surahNumber, ayahNumber, position)
          .then((hydratedWord) => {
            if (!hydratedWord) return;
            setSelectedWordDetails((prev) => {
              if (!prev) return prev;
              if (
                prev.surah !== surahNumber ||
                prev.ayah !== ayahNumber ||
                prev.position !== position
              ) {
                return prev;
              }
              return {
                ...prev,
                lemma: hydratedWord.lemma || prev.lemma,
                root: hydratedWord.root || prev.root,
                rootArabic: hydratedWord.rootArabic || prev.rootArabic
              };
            });
            if (hydratedWord.root) {
              void fetchRootLexicon(hydratedWord.root);
            }
          })
          .catch(() => {});
      }
    },
    [selectedSurah?.number, hydrateWordLexicon, fetchRootLexicon]
  );

  const closeWordDetails = useCallback(() => {
    rootLookupRequestRef.current += 1;
    setSelectedWordDetails(null);
    setIsRootModalOpen(false);
    setRootLexicon(null);
    setRootLexiconError(null);
    setRootLexiconLoading(false);
  }, []);

  const openRootDetails = useCallback(async (root?: string) => {
    const normalizedRoot = (root || "").trim();
    if (!normalizedRoot) return;
    setIsRootModalOpen(true);
    if (rootLexicon?.root === normalizedRoot && !rootLexiconError) {
      return;
    }
    await fetchRootLexicon(normalizedRoot);
  }, [fetchRootLexicon, rootLexicon?.root, rootLexiconError]);

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
    (mode: MemorizeMode) => {
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

  const toggleStudyMark = useCallback((key: string) => {
    setStudyMarks((previous) => {
      const next = { ...(previous || {}) };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  }, [setStudyMarks]);

  const ayahCards = useMemo(
    () =>
      ayahs.map((ayah, index) => {
        const ayahNum = ayah.number;
        const key = verseKey(selectedSurah?.number || 0, ayahNum);
        const bookmarked = isBookmarked(selectedSurah?.number || 0, ayahNum);
        const noted = hasNote(selectedSurah?.number || 0, ayahNum);
        const isPlaying = nowPlaying?.surah === selectedSurah?.number && nowPlaying?.ayah === ayahNum;
        const isActivePlay = isPlaying && !isAudioPaused;
        const words = ayahNum ? wordsByAyahForStudy?.[ayahNum] || [] : [];
        const isFocused = focusedAyahKey === key;
        const isMarked = Boolean(studyMarks?.[key]);
        const translationText = ayah.translations?.[primaryTranslation]?.text || "";

        return (
          <StudyAyahCard
            key={key || `ayah-${index}`}
            ayahNumber={ayahNum}
            animationDelay={index * 0.02}
            cardId={key || `ayah-${ayahNum}`}
            isActivePlay={isActivePlay}
            isFocused={isFocused}
            isMarked={isMarked}
            isDimmed={Boolean(dimNonFocused && focusedAyahKey && !isFocused)}
            arabicContent={
              showTajweed && ayah.arabicTajweed ? renderTajweedMarkup(ayah.arabicTajweed) : ayah.arabic || ""
            }
            translationText={translationText}
            showTranslation={showTranslation}
            isMushafView={isMushafView}
            fontScaleArabic={fontScale?.arabic || 1}
            fontScaleTranslation={fontScale?.translation || 1}
            showWordByWord={showWordByWord}
            words={words}
            wordLoading={effectiveWordLoading}
            wordAudioUrl={wordAudioUrl}
            selectedWordPosition={
              selectedWordDetails?.surah === selectedSurah?.number &&
              selectedWordDetails?.ayah === ayahNum
                ? selectedWordDetails.position
                : null
            }
            isBookmarked={Boolean(bookmarked)}
            hasNote={Boolean(noted)}
            resolveWordAudioUrl={resolveWordAudioUrl}
            onFocusAyah={() => setFocusedAyahKey(key)}
            onOpenMemorize={() => openMemorizeModal(ayahNum)}
            onTogglePlay={() => onTogglePlay(selectedSurah?.number || 0, ayahNum)}
            onToggleBookmark={() => onToggleBookmark(selectedSurah?.number || 0, ayahNum)}
            onOpenTafsir={() => {
              setFocusedAyahKey(key);
              setQuickPanelTab("tafsir");
              setShowQuickPanel(true);
            }}
            onOpenNote={() => onOpenNote(selectedSurah?.number || 0, ayahNum)}
            onWordSelect={handleWordSelect}
            onWordAudio={handleWordAudio}
            onToggleStudyMark={() => toggleStudyMark(key)}
          />
        );
      }),
    [
      ayahs,
      dimNonFocused,
      focusedAyahKey,
      fontScale?.arabic,
      fontScale?.translation,
      handleWordAudio,
      handleWordSelect,
      hasNote,
      isAudioPaused,
      isBookmarked,
      studyMarks,
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
      wordsByAyahForStudy,
      effectiveWordLoading,
      selectedWordDetails?.surah,
      selectedWordDetails?.ayah,
      selectedWordDetails?.position,
      toggleStudyMark
    ]
  );

  const selectedRoot = (selectedWordDetails?.root || "").trim();
  const selectedRootArabic =
    selectedWordDetails?.rootArabic || rootLexicon?.rootArabic || "";
  const distillRootMeaning = useCallback((value?: string) => {
    const raw = (value || "").replace(/\s+/g, " ").trim();
    if (!raw) return "";
    const firstSentence = raw.split(/[.;:]/, 1)[0] || raw;
    const condensed = firstSentence.replace(/\s+/g, " ").trim();
    if (condensed.length <= 160) return condensed;
    return `${condensed.slice(0, 157).trim()}...`;
  }, []);
  const rootMeaningSummary = useMemo(() => {
    if (!selectedRoot) return "Root data is not available for this word yet.";
    if (rootLexicon?.rootMeaning) {
      return distillRootMeaning(rootLexicon.rootMeaning);
    }
    if (rootLexiconLoading) return "Loading root meaning...";
    if (rootLexicon?.primaryRootMeaningsAvailable === false) {
      return "Primary root-meaning dataset is not available.";
    }
    return "No root meaning found in the primary dataset.";
  }, [
    distillRootMeaning,
    rootLexicon?.rootMeaning,
    rootLexicon?.primaryRootMeaningsAvailable,
    rootLexiconLoading,
    selectedRoot
  ]);
  const laneActionLabel = useMemo(() => {
    if (!selectedRoot) return "Lane Lexicon unavailable";
    if (rootLexiconLoading) return "Loading Lane Lexicon...";
    if (rootLexiconError) return "Retry Lane Lexicon";
    return "Open Lane Lexicon";
  }, [rootLexiconError, rootLexiconLoading, selectedRoot]);
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
          onJumpToAyah={onJumpToAyah}
          onClosePanel={() => setShowQuickPanel(false)}
          formatTime={formatTime}
          showTranslation={showTranslation}
          setShowTranslation={setShowTranslation}
          dimNonFocused={dimNonFocused}
          setDimNonFocused={setDimNonFocused}
          autoScrollPlaying={autoScrollPlaying}
          setAutoScrollPlaying={setAutoScrollPlaying}
          fontScale={fontScale}
          setFontScale={setFontScale}
          clamp={clamp}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          arabicFonts={arabicFonts}
          arabicFontId={arabicFontId}
          setArabicFontId={setArabicFontId}
          reciters={reciters}
          reciterId={reciterId}
          setReciterId={setReciterId}
          showTajweed={showTajweed}
          setShowTajweed={setShowTajweed}
          showTajweedLegend={showTajweedLegend}
          setShowTajweedLegend={setShowTajweedLegend}
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
          focusedAyahNumber={(focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : currentAyahIndex) || 1}
          currentAyahIndex={currentAyahIndex}
          onUseCurrentAyah={() =>
            setFocusedAyahKey(verseKey(selectedSurah?.number || 0, currentAyahIndex))
          }
          tafsirLoading={tafsirLoading}
          tafsirError={tafsirError}
          tafsirText={tafsirText}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          runSearch={runSearch}
          searchLoading={searchLoading}
          searchError={searchError}
          searchResults={searchResults}
          onOpenNote={onOpenNote}
        />
      </QuickPanel>

      <AnimatePresence>
        {selectedWordDetails && (
          <motion.div
            className="study-lexicon-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWordDetails}
          >
            <motion.div
              className="study-lexicon-modal"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="study-lexicon-header">
                <div>
                  <p className="study-lexicon-eyebrow">Word</p>
                  <h3>Word Details</h3>
                </div>
                <button className="study-lexicon-close" onClick={closeWordDetails} type="button">
                  ✕
                </button>
              </div>

              <div className="study-lexicon-body">
                <div className="study-lexicon-top-row">
                  {selectedRoot ? (
                    <button
                      type="button"
                      className="study-lexicon-root-focus"
                      onClick={() => openRootDetails(selectedRoot)}
                    >
                      <span className="study-lexicon-root-heading">Root (جذر)</span>
                      <span className="study-lexicon-root-arabic" lang="ar" dir="rtl">
                        {selectedRootArabic || "—"}
                      </span>
                    </button>
                  ) : (
                    <div className="study-lexicon-root-focus is-unavailable">
                      <span className="study-lexicon-root-heading">Root (جذر)</span>
                      <span className="study-lexicon-unavailable">Unavailable</span>
                    </div>
                  )}

                  <p className="study-lexicon-word" lang="ar" dir="rtl">
                    {selectedWordDetails.arabic}
                  </p>
                </div>

                {selectedWordDetails.translation ? (
                  <p className="study-lexicon-translation">{selectedWordDetails.translation}</p>
                ) : null}

                <div className="study-lexicon-summary-grid">
                  <div className="study-lexicon-summary-item">
                    <span className="study-lexicon-label">Root Meaning</span>
                    <p className="study-lexicon-summary-text">{rootMeaningSummary}</p>
                  </div>
                  <div className="study-lexicon-summary-item">
                    <span className="study-lexicon-label">Lane Lexicon</span>
                    {selectedRoot ? (
                      <button
                        type="button"
                        className="study-lane-open-btn"
                        onClick={() => openRootDetails(selectedRoot)}
                      >
                        {laneActionLabel}
                      </button>
                    ) : (
                      <p className="study-lexicon-summary-text">No root available for this word.</p>
                    )}
                  </div>
                </div>

                {rootLexiconError && selectedRoot ? (
                  <p className="study-lexicon-unavailable">{rootLexiconError}</p>
                ) : null}

                <div className="study-lexicon-actions">
                  {selectedRoot ? (
                    <button
                      type="button"
                      className="study-root-link study-root-insight-btn"
                      onClick={() => openRootDetails(selectedRoot)}
                    >
                      Open root details
                    </button>
                  ) : (
                    <span className="study-lexicon-unavailable">Root unavailable</span>
                  )}

                  {selectedWordDetails.audioUrl ? (
                    <button
                      type="button"
                      className="study-word-audio-btn"
                      onClick={() => handleWordAudio(selectedWordDetails.audioUrl)}
                    >
                      Play word audio
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedWordDetails && isRootModalOpen && (
          <motion.div
            className="study-lexicon-backdrop root-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsRootModalOpen(false)}
          >
            <motion.div
              className="study-lexicon-modal root-modal"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="study-lexicon-header">
                <div>
                  <p className="study-lexicon-eyebrow">Lane Lexicon</p>
                  <h3>{selectedWordDetails.rootArabic || rootLexicon?.rootArabic || "Root"}</h3>
                </div>
                <button
                  className="study-lexicon-close"
                  onClick={() => setIsRootModalOpen(false)}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="study-lexicon-body">
                {rootLexiconLoading ? <p className="study-lexicon-unavailable">Loading lexicon...</p> : null}
                {!rootLexiconLoading && rootLexiconError ? (
                  <p className="study-lexicon-unavailable">{rootLexiconError}</p>
                ) : null}
                {!rootLexiconLoading && !rootLexiconError && (
                  <>
                    <div className="study-lexicon-meta-grid">
                      <div className="study-lexicon-meta-item">
                        <span className="study-lexicon-label">Arabic</span>
                        <span className="study-lexicon-value">
                          {rootLexicon?.rootArabic || selectedWordDetails.rootArabic || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="study-lexicon-section">
                      <h4>Core Meanings</h4>
                      {rootLexicon?.coreMeanings?.length ? (
                        <div className="study-lexicon-chip-row">
                          {rootLexicon.coreMeanings.map((meaning) => (
                            <span key={meaning} className="study-lexicon-chip">
                              {meaning}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="study-lexicon-unavailable">No Lane meanings found for this root.</p>
                      )}
                    </div>

                    <div className="study-lexicon-section">
                      <h4>Dictionary Definitions</h4>
                      {rootLexicon?.definitions?.length ? (
                        <ul className="study-lexicon-list">
                          {rootLexicon.definitions.map((definition, index) => (
                            <li key={`${index}-${definition.slice(0, 16)}`}>{definition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="study-lexicon-unavailable">
                          Add a Lane lexicon JSON to see dictionary definitions here.
                        </p>
                      )}
                    </div>

                    <div className="study-lexicon-section">
                      <h4>Qur&apos;anic References</h4>
                      {rootLexicon?.references?.length ? (
                        <div className="study-lexicon-ref-grid">
                          {rootLexicon.references.map((ref) => (
                            <span key={ref} className="study-lexicon-ref">
                              {ref}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="study-lexicon-unavailable">No references found.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
