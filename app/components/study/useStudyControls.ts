"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../../hooks";
import { fetchJSON } from "../../lib/apiClient";
import { SURAH_AYAH_COUNTS } from "../../lib/constants";
import { getLocalDateString } from "../../lib/utils";
import { TAFSIR_EDITIONS } from "./StudyModeHelpers";
import type { MemorizeConfig, StudyMarks } from "./StudyModeTypes";
import type { MemorizeDraft, MemorizeMode } from "./StudyMemorizeModal";
import type { QuickPanelTab } from "./StudyQuickPanelContent";
import type { Surah } from "../../lib/types";

type SearchResult = {
  surah?: number;
  ayah?: number;
  text?: string;
  translation?: string;
};

type StudyGoal = {
  perDay: number;
  date: string;
};

type UseStudyControlsArgs = {
  ayahsLength: number;
  selectedSurah: Surah | null;
  focusedAyahKey: string | null;
  clamp: (value: number, min: number, max: number) => number;
  memorizeConfig: MemorizeConfig;
};

export default function useStudyControls({
  ayahsLength,
  selectedSurah,
  focusedAyahKey,
  clamp,
  memorizeConfig
}: UseStudyControlsArgs) {
  const [showControls, setShowControls] = useState(true);
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [quickPanelTab, setQuickPanelTab] = useState<QuickPanelTab>("study");
  const [readingTime, setReadingTime] = useState(0);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [showTajweed, setShowTajweed] = useState(false);
  const [showTajweedLegend, setShowTajweedLegend] = useState(false);
  const [showHifzMode, setShowHifzMode] = useState(false);
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [isMushafView, setIsMushafView] = useState(false);
  const [scriptStyle, setScriptStyle] = useState<"uthmani" | "naskh">("uthmani");
  const [showTranslation, setShowTranslation] = useState(true);
  const [dimNonFocused, setDimNonFocused] = useState(false);
  const [autoScrollPlaying, setAutoScrollPlaying] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHasRun, setSearchHasRun] = useState(false);
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
  const [studyMarks, setStudyMarks] = useLocalStorage<StudyMarks>("quran_study_marks", {});
  const [hifzMarks, setHifzMarks] = useLocalStorage<StudyMarks>("quran_hifz", {});
  const [studyGoal, setStudyGoal] = useLocalStorage<StudyGoal>("quran_study_goal", {
    perDay: 15,
    date: getLocalDateString()
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const lastPointerActivityRef = useRef(0);
  const lastTafsirKeyRef = useRef<string | null>(null);

  const progress = ayahsLength > 0 ? Math.round((currentAyahIndex / ayahsLength) * 100) : 0;
  const goalTarget = Math.max(1, Number(studyGoal?.perDay) || 1);
  const goalProgress = Math.min(currentAyahIndex, goalTarget);

  const parseVerseKey = useCallback((key: string) => {
    const [surah, ayah] = key.split(":").map(Number);
    return { surah, ayah };
  }, []);

  const focusedAyahNumber = useMemo(() => {
    if (!focusedAyahKey) return currentAyahIndex || 1;
    const parsed = parseVerseKey(focusedAyahKey);
    if (Number.isFinite(parsed.ayah) && parsed.ayah > 0) {
      return parsed.ayah;
    }
    return currentAyahIndex || 1;
  }, [currentAyahIndex, focusedAyahKey, parseVerseKey]);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
    };
  }, []);

  const parseDirectVerseReference = useCallback((rawQuery: string) => {
    const normalized = rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
    if (!normalized) return null;

    const match =
      normalized.match(/^(\d{1,3})\s*[:./-]\s*(\d{1,3})$/)
      || normalized.match(/^surah\s*(\d{1,3})\s*ayah\s*(\d{1,3})$/);

    if (!match) return null;
    const surah = Number(match[1]);
    const ayah = Number(match[2]);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
    if (!Number.isInteger(ayah) || ayah < 1) return null;

    const maxAyah = SURAH_AYAH_COUNTS[surah - 1] || 0;
    if (!maxAyah || ayah > maxAyah) return null;

    return { surah, ayah };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime((time) => time + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const today = getLocalDateString();
    if (!studyGoal?.date || studyGoal.date !== today) {
      setStudyGoal((prev) => ({
        ...prev,
        date: today
      }));
    }
  }, [studyGoal?.date, setStudyGoal]);

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
  }, [ayahsLength]);

  useEffect(() => {
    if (!focusedAyahKey || !selectedSurah) return;
    const parsed = parseVerseKey(focusedAyahKey);
    if (!Number.isFinite(parsed.ayah)) return;
    setCurrentAyahIndex(parsed.ayah);
  }, [focusedAyahKey, parseVerseKey, selectedSurah]);

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
      `/api/tafsir?edition=${encodeURIComponent(
        String(tafsirEdition)
      )}&surah=${selectedSurah.number}&ayah=${ayahNumber}`,
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
  }, [
    showQuickPanel,
    quickPanelTab,
    selectedSurah?.number,
    focusedAyahKey,
    currentAyahIndex,
    tafsirEdition,
    parseVerseKey
  ]);

  const runSearch = useCallback(async () => {
    const query = searchQuery.trim().replace(/\s+/g, " ");
    if (!query) {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      setSearchError(null);
      setSearchResults([]);
      setSearchLoading(false);
      setSearchHasRun(false);
      return;
    }

    setSearchHasRun(true);

    const directRef = parseDirectVerseReference(query);
    if (directRef) {
      setSearchError(null);
      setSearchResults([
        {
          surah: directRef.surah,
          ayah: directRef.ayah,
          text: "",
          translation: `Direct verse match (${directRef.surah}:${directRef.ayah})`
        }
      ]);
      setSearchLoading(false);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const payload = await fetchJSON<{ results?: SearchResult[] }>(
        `/api/search?q=${encodeURIComponent(query)}`,
        {
          ttl: 2 * 60 * 1000,
          retries: 1,
          retryDelay: 250,
          cacheKey: `study-search:${query.toLowerCase()}`,
          signal: controller.signal
        }
      );
      if (searchAbortRef.current !== controller) return;
      setSearchResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      if (searchAbortRef.current !== controller) return;
      const message = error instanceof Error ? error.message : "Search failed.";
      setSearchError(message);
      setSearchResults([]);
    } finally {
      if (searchAbortRef.current === controller) {
        setSearchLoading(false);
        searchAbortRef.current = null;
      }
    }
  }, [parseDirectVerseReference, searchQuery]);

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

  const updateMemorizeLoops = useCallback(
    (delta: number) => {
      setMemorizeDraft((prev) => {
        const raw = Number(prev.loops) || 0;
        const next = clamp(raw + delta, 0, 50);
        return { ...prev, loops: next };
      });
    },
    [clamp]
  );

  const toggleStudyMark = useCallback(
    (key: string) => {
      setStudyMarks((previous) => {
        const next = { ...(previous || {}) };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = true;
        }
        return next;
      });
    },
    [setStudyMarks]
  );

  const toggleHifzMark = useCallback(
    (key: string) => {
      setHifzMarks((previous) => {
        const next = { ...(previous || {}) };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = true;
        }
        return next;
      });
    },
    [setHifzMarks]
  );

  const markHifzRange = useCallback(
    (surahNumber: number, startAyah: number, endAyah: number) => {
      setHifzMarks((previous) => {
        const next = { ...(previous || {}) };
        for (let i = startAyah; i <= endAyah; i++) {
          next[`${surahNumber}:${i}`] = true;
        }
        return next;
      });
    },
    [setHifzMarks]
  );

  const clearHifzSurah = useCallback(
    (surahNumber: number, totalAyahs: number) => {
      setHifzMarks((previous) => {
        const next = { ...(previous || {}) };
        for (let i = 1; i <= totalAyahs; i++) {
          delete next[`${surahNumber}:${i}`];
        }
        return next;
      });
    },
    [setHifzMarks]
  );

  return {
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
  };
}
