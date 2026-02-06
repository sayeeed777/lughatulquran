"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SurahList,
  ReaderPanel,
  StudyPanel,
  StudyModeView,
  CompareModal,
  NoteModal,
  ErrorBoundary,
  LastReadCard,
  KeyboardShortcutsHelp
} from "./components";
import {
  AUDIO_RECITERS,
  ARABIC_FONTS,
  DEFAULT_PLAN,
  STORAGE_KEYS
} from "./lib/constants";
import {
  getLocalDateString,
  parseLocalDate,
  verseKey,
  parseVerseKey,
  clamp,
  getAudioUrl,
  copyToClipboard
} from "./lib/utils";

// Custom Hooks
import { useLocalStorage, useLastRead, useKeyboardShortcuts } from "./hooks";
import { useSurahs, useSurahDetails, useWordByWord, useTaqiTranslation } from "./hooks/useQuranData";
import { useReadingPlan, useFontScale } from "./hooks/useAppSettings";

export default function Home() {
  // --- 1. Data Hooks ---
  const { surahs, loading: loadingSurahs, error: surahsError, surahByNumber } = useSurahs();

  // --- 2. State & Settings ---
  const [selectedSurah, setSelectedSurah] = useState(null);
  const { surahData, loading: loadingSurahData, error: surahDataError } = useSurahDetails(selectedSurah?.number);

  const [bookmarks, setBookmarks] = useLocalStorage(STORAGE_KEYS.bookmarks, []);
  const [notes, setNotes] = useLocalStorage(STORAGE_KEYS.notes, {});
  const [readingPlan, setReadingPlan] = useReadingPlan();
  const [fontScale, setFontScale] = useFontScale();
  const { lastRead, updateLastRead } = useLastRead();

  // Reciter State (Store ID, derive Object)
  const [reciterId, setReciterId] = useLocalStorage(STORAGE_KEYS.reciter, AUDIO_RECITERS[0].id);
  const selectedReciter = useMemo(() =>
    AUDIO_RECITERS.find(r => r.id === reciterId) || AUDIO_RECITERS[0],
    [reciterId]);
  const [arabicFontId, setArabicFontId] = useLocalStorage(
    STORAGE_KEYS.arabicFont,
    ARABIC_FONTS[0].id
  );
  const selectedArabicFont = useMemo(
    () => ARABIC_FONTS.find((font) => font.id === arabicFontId) || ARABIC_FONTS[0],
    [arabicFontId]
  );

  // UI State
  const [query, setQuery] = useState("");
  const [selectedTranslations, setSelectedTranslations] = useState(["en.arberry"]); // Array for multi-translation
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [focusedAyahKey, setFocusedAyahKey] = useState(null);
  const [ayahQuery, setAyahQuery] = useState("");
  const [goToAyahInput, setGoToAyahInput] = useState("");
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [readingMode, setReadingMode] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [pendingScroll, setPendingScroll] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [memorizeConfig, setMemorizeConfig] = useState({
    active: false,
    startAyah: 1,
    endAyah: 5,
    loops: 0,
    remaining: 0
  });
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Advanced Data Hooks
  const { wordByAyah, loading: wordLoading, error: wordError } = useWordByWord(
    selectedSurah?.number,
    showWordByWord || readingMode
  );
  const { cache: taqiCache, loading: taqiLoading, fetchTranslation: fetchTaqi } = useTaqiTranslation();

  // --- 3. Effects ---

  // Initial Surah Selection & URL handling
  useEffect(() => {
    if (!surahs.length || selectedSurah) return;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const surahParam = Number(params.get("surah"));
      const ayahParam = Number(params.get("ayah"));
      const hashMatch = window.location.hash.match(/ayah-(\d+)/); // Support hash too
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
    setSelectedSurah(surahs[0]);
  }, [surahs, selectedSurah]);

  // Sync URL with selection
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSurah) return;
    const url = new URL(window.location.href);
    url.searchParams.set("surah", selectedSurah.number);
    if (focusedAyahKey) {
      const { ayah } = parseVerseKey(focusedAyahKey);
      url.searchParams.set("ayah", ayah);
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

  // Clamp memorize range when surah changes
  useEffect(() => {
    if (!selectedSurah) return;
    setMemorizeConfig((prev) => {
      const max = selectedSurah.numberOfAyahs;
      const startAyah = clamp(Number(prev.startAyah) || 1, 1, max);
      const endAyah = clamp(Number(prev.endAyah) || startAyah, startAyah, max);
      return { ...prev, startAyah, endAyah };
    });
  }, [selectedSurah, clamp]);

  // Stop memorize when exiting study mode
  useEffect(() => {
    if (readingMode) return;
    if (!memorizeConfig.active) return;
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
  }, [readingMode, memorizeConfig.active]);

  // Pending Scroll Logic
  useEffect(() => {
    if (!pendingScroll || !surahData?.surah || !selectedSurah) return;
    if (surahData.surah.number !== selectedSurah.number) return;

    // Give a slight delay for render
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


  // --- 4. Helpers & Computed ---

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

  const getGlobalIndex = (surahNumber, ayahNumber) => {
    const entry = surahIndex.find((item) => item.number === surahNumber);
    if (!entry) return null;
    return entry.start + ayahNumber - 1;
  };

  const indexToVerse = (globalIndex) => {
    const entry = surahIndex.find((item) => globalIndex >= item.start && globalIndex <= item.end);
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
    const dayIndex = Math.max(0, Math.floor((todayValue - startDateValue) / 86400000));

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
    return surahs.filter((surah) =>
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
        .map((t) => t.text || "").join(" ").toLowerCase();
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
    return Object.entries(notes)
      .map(([key, value]) => ({ key, value, ...parseVerseKey(key) }))
      .sort((a, b) => {
        if (a.surah !== b.surah) return a.surah - b.surah;
        return a.ayah - b.ayah;
      });
  }, [notes]);

  // Labels
  const formatVerseLabel = (verse) => {
    if (!verse) return "";
    const surah = surahByNumber.get(verse.surah);
    return `${surah ? surah.englishName : `Surah ${verse.surah}`} Ayah ${verse.ayah}`;
  };

  const formatRangeLabel = (startVerse, endVerse) => {
    if (!startVerse || !endVerse) return "";
    if (startVerse.surah === endVerse.surah) {
      const surah = surahByNumber.get(startVerse.surah);
      return `${surah ? surah.englishName : `Surah ${startVerse.surah}`} Ayah ${startVerse.ayah} to ${endVerse.ayah}`;
    }
    return `${formatVerseLabel(startVerse)} to ${formatVerseLabel(endVerse)}`;
  };

  const nowPlayingLabel = nowPlaying
    ? `${surahByNumber.get(nowPlaying.surah)?.englishName || `Surah ${nowPlaying.surah}`} - Ayah ${nowPlaying.ayah}`
    : "Select an ayah to play.";

  // Actions
  const stopMemorize = () => {
    if (!memorizeConfig.active) return;
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
  };

  const startMemorize = (config) => {
    if (!selectedSurah) return;
    const max = selectedSurah.numberOfAyahs;
    const startAyah = clamp(Number(config?.startAyah) || 1, 1, max);
    const endAyah = clamp(Number(config?.endAyah) || startAyah, startAyah, max);
    const loops = Math.max(0, Number(config?.loops) || 0);

    setMemorizeConfig({
      active: true,
      startAyah,
      endAyah,
      loops,
      remaining: loops
    });

    setIsAutoPlaying(true);
    setIsAudioPaused(false);
    setNowPlaying({ surah: selectedSurah.number, ayah: startAyah });
    setFocusedAyahKey(verseKey(selectedSurah.number, startAyah));
    setPendingScroll(startAyah);
  };

  const handleSelectSurah = (surah) => {
    stopMemorize();
    setSelectedSurah(surah);
    setSelectedAyah(null);
    setFocusedAyahKey(null);
    setIsAutoPlaying(false);
    setNowPlaying(null);
    setIsAudioPaused(false);

    // On mobile, scroll to the reader panel after selecting a surah
    if (typeof window !== "undefined" && window.innerWidth <= 1100) {
      setTimeout(() => {
        const readerPanel = document.querySelector(".reader-panel");
        if (readerPanel) {
          readerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handlePlaySurah = (startFromAyah = 1) => {
    if (!selectedSurah) return;
    stopMemorize();
    const start =
      Number.isFinite(Number(startFromAyah)) && Number(startFromAyah) >= 1
        ? Number(startFromAyah)
        : 1;
    setIsAutoPlaying(true);
    setNowPlaying({ surah: selectedSurah.number, ayah: start });
    setIsAudioPaused(false);
    setFocusedAyahKey(verseKey(selectedSurah.number, start));
    setPendingScroll(start);
  };

  const handleStopAutoPlay = () => {
    stopMemorize();
    setIsAutoPlaying(false);
    setNowPlaying(null);
    setIsAudioPaused(false);
  };

  const handleAudioEnded = () => {
    if (memorizeConfig.active && selectedSurah && nowPlaying) {
      const nextAyah = nowPlaying.ayah + 1;
      if (nextAyah <= memorizeConfig.endAyah) {
        setNowPlaying({ surah: selectedSurah.number, ayah: nextAyah });
        setFocusedAyahKey(verseKey(selectedSurah.number, nextAyah));
        setPendingScroll(nextAyah);
        return;
      }

      // Reached end of memorize range
      if (memorizeConfig.loops === 0) {
        setNowPlaying({ surah: selectedSurah.number, ayah: memorizeConfig.startAyah });
        setFocusedAyahKey(verseKey(selectedSurah.number, memorizeConfig.startAyah));
        setPendingScroll(memorizeConfig.startAyah);
        return;
      }

      if (memorizeConfig.remaining > 1) {
        setMemorizeConfig((prev) => ({ ...prev, remaining: prev.remaining - 1 }));
        setNowPlaying({ surah: selectedSurah.number, ayah: memorizeConfig.startAyah });
        setFocusedAyahKey(verseKey(selectedSurah.number, memorizeConfig.startAyah));
        setPendingScroll(memorizeConfig.startAyah);
        return;
      }

      // Done looping
      setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
      setIsAutoPlaying(false);
      setNowPlaying(null);
      setIsAudioPaused(false);
      return;
    }

    if (!isAutoPlaying || !nowPlaying || !selectedSurah) {
      setIsAudioPaused(false);
      setNowPlaying(null);
      return;
    }

    const nextAyah = nowPlaying.ayah + 1;
    if (nextAyah <= selectedSurah.numberOfAyahs) {
      // Play next ayah and scroll to it
      setNowPlaying({ surah: selectedSurah.number, ayah: nextAyah });
      setFocusedAyahKey(verseKey(selectedSurah.number, nextAyah));
      setPendingScroll(nextAyah);
    } else {
      // Surah finished
      setIsAutoPlaying(false);
      setNowPlaying(null);
      setIsAudioPaused(false);
    }
  };

  const handlePlayAyah = (surah, ayah) => {
    stopMemorize();
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
    setNowPlaying({ surah, ayah });
  };

  const handleToggleAyah = (surah, ayah) => {
    if (memorizeConfig.active) {
      stopMemorize();
    }
    // If same ayah is playing, toggle pause and stop auto-play
    if (nowPlaying && nowPlaying.surah === surah && nowPlaying.ayah === ayah) {
      if (!isAudioPaused) {
        // Pausing - stop auto-play mode
        setIsAudioPaused(true);
        setIsAutoPlaying(false);
      } else {
        // Resuming - just unpause (don't restart auto-play)
        setIsAudioPaused(false);
      }
      return;
    }
    // Otherwise, play the new ayah (stops auto-play)
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
    setNowPlaying({ surah, ayah });
  };

  const toggleBookmark = (surahNumber, ayahNumber) => {
    const key = verseKey(surahNumber, ayahNumber);
    setBookmarks((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const openNote = (surahNumber, ayahNumber) => {
    const key = verseKey(surahNumber, ayahNumber);
    setNoteTarget({ surah: surahNumber, ayah: ayahNumber, key });
    setNoteDraft(notes[key] || "");
  };

  const saveNote = () => {
    if (!noteTarget) return;
    const trimmed = noteDraft.trim();
    setNotes((prev) => {
      const next = { ...prev };
      if (trimmed) next[noteTarget.key] = trimmed;
      else delete next[noteTarget.key];
      return next;
    });
    setNoteTarget(null);
    setNoteDraft("");
  };

  const handleGoToAyah = () => {
    if (!selectedSurah) return;
    const number = Number(goToAyahInput);
    if (!number || number < 1 || number > selectedSurah.numberOfAyahs) return;
    setPendingScroll(number);
    setFocusedAyahKey(verseKey(selectedSurah.number, number));
  };

  const jumpToAyah = (surahNumber, ayahNumber) => {
    const targetSurah = surahByNumber.get(surahNumber);
    if (!targetSurah) return;
    setSelectedSurah(targetSurah);
    setPendingScroll(ayahNumber);
    setFocusedAyahKey(verseKey(surahNumber, ayahNumber));
  };

  const copyAyahLink = useCallback(async (surahNumber, ayahNumber) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("surah", surahNumber);
    url.searchParams.set("ayah", ayahNumber);
    url.hash = `ayah-${ayahNumber}`;

    if (await copyToClipboard(url.toString())) {
      const key = verseKey(surahNumber, ayahNumber);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => prev === key ? null : prev), 1600);
    }
  }, []);

  const handleCompare = (ayah) => {
    if (!selectedSurah) return;
    setSelectedAyah(ayah);
    setFocusedAyahKey(verseKey(selectedSurah.number, ayah.number));
    fetchTaqi(selectedSurah.number, ayah.number);
  };

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    "Show Shortcuts": { keys: ["?"], handler: () => setShowShortcuts(p => !p) },
    "Close Modal": {
      keys: ["Escape"], handler: () => {
        if (showShortcuts) setShowShortcuts(false);
        else if (selectedAyah) setSelectedAyah(null);
        else if (noteTarget) setNoteTarget(null);
        else if (readingMode) setReadingMode(false);
      }
    },
    "Study Mode": { keys: ["f"], handler: () => setReadingMode(p => !p) },
    "Word by Word": { keys: ["w"], handler: () => setShowWordByWord(p => !p) },
    "Next Ayah": {
      keys: ["ArrowDown", "j"], handler: () => {
        if (!selectedSurah || !surahData) return;
        const current = focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : 1;
        const next = Math.min(current + 1, selectedSurah.numberOfAyahs);
        setPendingScroll(next);
        setFocusedAyahKey(verseKey(selectedSurah.number, next));
      }
    },
    "Prev Ayah": {
      keys: ["ArrowUp", "k"], handler: () => {
        if (!selectedSurah || !surahData) return;
        const current = focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : 1;
        const prev = Math.max(current - 1, 1);
        setPendingScroll(prev);
        setFocusedAyahKey(verseKey(selectedSurah.number, prev));
      }
    },
    "Toggle Bookmark": {
      keys: ["b"], handler: () => {
        if (focusedAyahKey) {
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          toggleBookmark(surah, ayah);
        }
      }
    },
    "Play Audio": {
      keys: ["p"], handler: () => {
        if (focusedAyahKey) {
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          setNowPlaying({ surah, ayah });
        }
      }
    },
  });

  // Render
  if (readingMode) {
    return (
      <ErrorBoundary>
        <StudyModeView
          selectedSurah={selectedSurah}
          surahData={surahData}
          filteredAyahs={filteredAyahs}
          reciters={AUDIO_RECITERS}
          reciterId={reciterId}
          setReciterId={setReciterId}
          arabicFonts={ARABIC_FONTS}
          arabicFontId={arabicFontId}
          setArabicFontId={setArabicFontId}
          selectedTranslations={selectedTranslations}
          bookmarks={bookmarks}
          notes={notes}
          sortedBookmarks={sortedBookmarks}
          sortedNotes={sortedNotes}
          readingPlan={readingPlan}
          planSummary={planSummary}
          focusedAyahKey={focusedAyahKey}
          setFocusedAyahKey={setFocusedAyahKey}
          fontScale={fontScale}
          setFontScale={setFontScale}
          nowPlaying={nowPlaying}
          isAutoPlaying={isAutoPlaying}
          isAudioPaused={isAudioPaused}
          wordByAyah={wordByAyah}
          wordLoading={wordLoading}
          audioSrc={nowPlaying ? getAudioUrl(selectedReciter.baseUrl, nowPlaying.surah, nowPlaying.ayah) : null}
          reciterLabel={selectedReciter.label}
          onExit={() => setReadingMode(false)}
          onPlayAyah={handlePlayAyah}
          onTogglePlay={handleToggleAyah}
          onStopAutoPlay={handleStopAutoPlay}
          onPlaySurah={handlePlaySurah}
          onAudioEnded={handleAudioEnded}
          memorizeConfig={memorizeConfig}
          setMemorizeConfig={setMemorizeConfig}
          onStartMemorize={startMemorize}
          onStopMemorize={stopMemorize}
          onToggleBookmark={toggleBookmark}
          onOpenNote={openNote}
          onJumpToAyah={jumpToAyah}
          surahByNumber={surahByNumber}
          verseKey={verseKey}
          clamp={clamp}
        />
        <NoteModal
          noteTarget={noteTarget}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          surahByNumber={surahByNumber}
          onSave={saveNote}
          onClose={() => { setNoteTarget(null); setNoteDraft(""); }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <main className="app" style={{
        "--arabic-scale": fontScale.arabic,
        "--translation-scale": fontScale.translation,
        "--font-arabic": selectedArabicFont?.css
      }}>
        <div className="topbar">
          <div className="logo">
            <div className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                <path d="M12 18c6-3 14-4 20-4s14 1 20 4v28c-6-3-14-4-20-4s-14 1-20 4V18Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                <path d="M32 14v28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M20 24h12M20 32h12M20 40h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="logo-text">
              <p className="logo-title">Quran</p>
              <p className="logo-sub">Reader</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-icon-btns mobile-only">
              <button
                className="header-icon-btn"
                onClick={() => setShowMobileSearch(true)}
                aria-label="Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <button
                className="header-icon-btn"
                onClick={() => setShowMobileSettings(true)}
                aria-label="Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>

            </div>
          </div>
        </div>

        <section className="content">

          <SurahList
            surahs={surahs}
            filteredSurahs={filteredSurahs}
            selectedSurah={selectedSurah}
            query={query}
            setQuery={setQuery}
            onSelectSurah={handleSelectSurah}
            loading={loadingSurahs}
            onEnterStudyMode={() => setReadingMode(true)}
          />

          <ReaderPanel
            selectedSurah={selectedSurah}
            surahData={surahData}
            filteredAyahs={filteredAyahs}
            surahs={surahs}
            filteredSurahs={filteredSurahs}
            query={query}
            setQuery={setQuery}
            reciters={AUDIO_RECITERS}
            reciterId={reciterId}
            setReciterId={setReciterId}
            arabicFonts={ARABIC_FONTS}
            arabicFontId={arabicFontId}
            setArabicFontId={setArabicFontId}
            selectedTranslations={selectedTranslations}
            setSelectedTranslations={setSelectedTranslations}
            ayahQuery={ayahQuery}
            setAyahQuery={setAyahQuery}
            goToAyahInput={goToAyahInput}
            setGoToAyahInput={setGoToAyahInput}
            handleGoToAyah={handleGoToAyah}
            showWordByWord={showWordByWord}
            setShowWordByWord={setShowWordByWord}
            showMobileSettings={showMobileSettings}
            setShowMobileSettings={setShowMobileSettings}
            showMobileSearch={showMobileSearch}
            setShowMobileSearch={setShowMobileSearch}
            wordLoading={wordLoading}
            wordError={wordError}
            wordByAyah={wordByAyah}
            fontScale={fontScale}
            setFontScale={setFontScale}
            bookmarks={bookmarks}
            notes={notes}
            focusedAyahKey={focusedAyahKey}
            setFocusedAyahKey={setFocusedAyahKey}
            copiedKey={copiedKey}
            nowPlaying={nowPlaying}
            audioSrc={nowPlaying ? getAudioUrl(selectedReciter.baseUrl, nowPlaying.surah, nowPlaying.ayah) : null}
            nowPlayingLabel={nowPlayingLabel}
            reciterLabel={selectedReciter.label}
            error={surahsError || surahDataError || wordError}
            loadingSurahData={loadingSurahData}
            isAutoPlaying={isAutoPlaying}
            isAudioPaused={isAudioPaused}
            onPlaySurah={handlePlaySurah}
            onStopAutoPlay={handleStopAutoPlay}
            onAudioEnded={handleAudioEnded}
            onPlay={handlePlayAyah}
            onTogglePlay={handleToggleAyah}
            onToggleBookmark={toggleBookmark}
            onOpenNote={openNote}
            onCompare={handleCompare}
            onCopyLink={copyAyahLink}
            onSelectSurah={handleSelectSurah}
            verseKey={verseKey}
            clamp={clamp}
          />

          <StudyPanel
            surahs={surahs}
            surahByNumber={surahByNumber}
            readingPlan={readingPlan}
            setReadingPlan={setReadingPlan}
            planSummary={planSummary}
            sortedBookmarks={sortedBookmarks}
            sortedNotes={sortedNotes}
            onJumpToAyah={jumpToAyah}
            onToggleBookmark={toggleBookmark}
            onOpenNote={openNote}
            formatRangeLabel={formatRangeLabel}
            getLocalDateString={getLocalDateString}
            lastRead={lastRead}
          />
        </section>

        {!selectedSurah && lastRead && (
          <LastReadCard
            lastRead={lastRead}
            onContinue={() => jumpToAyah(lastRead.surah, lastRead.ayah)}
          />
        )}

        <CompareModal
          selectedAyah={selectedAyah}
          selectedSurah={selectedSurah}
          selectedAyahKey={selectedSurah && selectedAyah ? `${selectedSurah.number}:${selectedAyah.number}` : null}
          taqiCache={taqiCache}
          taqiLoading={taqiLoading}
          onClose={() => setSelectedAyah(null)}
        />

        <NoteModal
          noteTarget={noteTarget}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          surahByNumber={surahByNumber}
          onSave={saveNote}
          onClose={() => { setNoteTarget(null); setNoteDraft(""); }}
        />

        {showShortcuts && <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />}
      </main>
    </ErrorBoundary>
  );
}
