"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SurahList,
  ReaderPanel,
  StudyPanel,
  CompareModal,
  NoteModal,
  ErrorBoundary,
  LastReadCard,
  KeyboardShortcutsHelp
} from "./components";
import {
  AUDIO_RECITERS,
  DEFAULT_PLAN,
  STORAGE_KEYS,
  FONT_SCALE
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

export default function Home() {
  const [surahs, setSurahs] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [loadingSurahData, setLoadingSurahData] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState("en.sahih");
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [focusedAyahKey, setFocusedAyahKey] = useState(null);
  const [ayahQuery, setAyahQuery] = useState("");
  const [goToAyahInput, setGoToAyahInput] = useState("");
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [wordByAyah, setWordByAyah] = useState({});
  const [wordLoading, setWordLoading] = useState(false);
  const [wordError, setWordError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [taqiCache, setTaqiCache] = useState({});
  const [taqiLoading, setTaqiLoading] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({});
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [readingPlan, setReadingPlan] = useState(DEFAULT_PLAN);
  const [readingMode, setReadingMode] = useState(false);
  const [fontScale, setFontScale] = useState(FONT_SCALE.default);
  const [selectedReciter, setSelectedReciter] = useState(AUDIO_RECITERS[0]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [pendingScroll, setPendingScroll] = useState(null);
  const [error, setError] = useState(null);
  const [lastRead, setLastRead] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load surahs
  useEffect(() => {
    let isMounted = true;
    const loadSurahs = async () => {
      setLoadingSurahs(true);
      try {
        const response = await fetch("/api/surahs");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load surahs.");
        }
        if (isMounted) {
          setSurahs(payload.surahs || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoadingSurahs(false);
        }
      }
    };

    loadSurahs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle URL params and initial surah selection
  useEffect(() => {
    if (!surahs.length || selectedSurah) {
      return;
    }
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
    setSelectedSurah(surahs[0]);
  }, [surahs, selectedSurah]);

  // Load surah data
  useEffect(() => {
    let isMounted = true;
    if (!selectedSurah) {
      return undefined;
    }

    const loadSurah = async () => {
      setLoadingSurahData(true);
      setError(null);
      try {
        const response = await fetch(`/api/surah/${selectedSurah.number}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load surah.");
        }
        if (isMounted) {
          setSurahData(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoadingSurahData(false);
        }
      }
    };

    loadSurah();
    return () => {
      isMounted = false;
    };
  }, [selectedSurah]);

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const storedBookmarks = localStorage.getItem(STORAGE_KEYS.bookmarks);
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      }
      const storedNotes = localStorage.getItem(STORAGE_KEYS.notes);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
      const storedPlan = localStorage.getItem(STORAGE_KEYS.plan);
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        setReadingPlan({
          ...DEFAULT_PLAN,
          ...parsedPlan,
          perDay: Number(parsedPlan.perDay) || DEFAULT_PLAN.perDay,
          startSurah: Number(parsedPlan.startSurah) || DEFAULT_PLAN.startSurah,
          startAyah: Number(parsedPlan.startAyah) || DEFAULT_PLAN.startAyah
        });
      }
      const storedScale = localStorage.getItem(STORAGE_KEYS.fontScale);
      if (storedScale) {
        const parsedScale = JSON.parse(storedScale);
        setFontScale({
          arabic: clamp(Number(parsedScale.arabic) || 1, FONT_SCALE.min.arabic, FONT_SCALE.max.arabic),
          translation: clamp(Number(parsedScale.translation) || 1, FONT_SCALE.min.translation, FONT_SCALE.max.translation)
        });
      }
      const storedLastRead = localStorage.getItem(STORAGE_KEYS.lastRead);
      if (storedLastRead) {
        setLastRead(JSON.parse(storedLastRead));
      }
      const storedReciter = localStorage.getItem(STORAGE_KEYS.reciter);
      if (storedReciter) {
        const reciter = AUDIO_RECITERS.find(r => r.id === storedReciter);
        if (reciter) setSelectedReciter(reciter);
      }
    } catch (err) {
      setError("Saved study data could not be loaded.");
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(readingPlan));
  }, [readingPlan]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.fontScale, JSON.stringify(fontScale));
  }, [fontScale]);

  // Save last read position
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSurah || !focusedAyahKey) return;
    const { surah, ayah } = parseVerseKey(focusedAyahKey);
    const lastReadData = {
      surah,
      ayah,
      surahName: selectedSurah.englishName,
      timestamp: Date.now()
    };
    setLastRead(lastReadData);
    localStorage.setItem(STORAGE_KEYS.lastRead, JSON.stringify(lastReadData));
  }, [selectedSurah, focusedAyahKey]);

  // Save selected reciter
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.reciter, selectedReciter.id);
  }, [selectedReciter]);

  // Update URL
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSurah) {
      return;
    }
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

  // Memoized values
  const surahByNumber = useMemo(() => {
    return new Map(surahs.map((surah) => [surah.number, surah]));
  }, [surahs]);

  const surahIndex = useMemo(() => {
    let offset = 0;
    return surahs.map((surah) => {
      const start = offset + 1;
      const end = offset + surah.numberOfAyahs;
      offset = end;
      return { number: surah.number, start, end };
    });
  }, [surahs]);

  const totalAyahs = surahIndex.length
    ? surahIndex[surahIndex.length - 1].end
    : 0;

  // Reading plan validation
  useEffect(() => {
    if (!readingPlan.startSurah) return;
    const info = surahByNumber.get(Number(readingPlan.startSurah));
    if (!info) return;
    if (readingPlan.startAyah > info.numberOfAyahs) {
      setReadingPlan((prev) => ({ ...prev, startAyah: info.numberOfAyahs }));
    }
  }, [readingPlan.startSurah, readingPlan.startAyah, surahByNumber]);

  // Pending scroll
  useEffect(() => {
    if (!pendingScroll || !surahData?.surah || !selectedSurah) return;
    if (surahData.surah.number !== selectedSurah.number) return;
    const target = document.getElementById(`ayah-${pendingScroll}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setFocusedAyahKey(verseKey(selectedSurah.number, pendingScroll));
    }
    setPendingScroll(null);
  }, [pendingScroll, surahData, selectedSurah]);

  // Word by word loading
  useEffect(() => {
    if (!showWordByWord || !selectedSurah) return;
    if (wordByAyah[selectedSurah.number]) return;
    let isMounted = true;
    setWordLoading(true);
    setWordError(null);
    fetch(`/api/words/${selectedSurah.number}`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) {
          throw new Error(data?.error || "Word-by-word unavailable.");
        }
        if (isMounted) {
          setWordByAyah((prev) => ({
            ...prev,
            [selectedSurah.number]: data.wordsByAyah || {}
          }));
        }
      })
      .catch((err) => {
        if (isMounted) setWordError(err.message);
      })
      .finally(() => {
        if (isMounted) setWordLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [showWordByWord, selectedSurah, wordByAyah]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      // ? - Show shortcuts help
      if (event.key === "?") {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Escape - Close modals, exit focus mode
      if (event.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (selectedAyah) {
          setSelectedAyah(null);
        } else if (noteTarget) {
          setNoteTarget(null);
          setNoteDraft("");
        } else if (readingMode) {
          setReadingMode(false);
        }
        return;
      }

      // f - Toggle focus/reading mode
      if (event.key === "f" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setReadingMode((prev) => !prev);
        return;
      }

      // w - Toggle word by word
      if (event.key === "w" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setShowWordByWord((prev) => !prev);
        return;
      }

      // Navigate with arrow keys when a surah is selected
      if (selectedSurah && surahData?.ayahs?.length) {
        const currentAyah = focusedAyahKey
          ? parseVerseKey(focusedAyahKey).ayah
          : 1;

        // ArrowDown/j - Next ayah
        if (event.key === "ArrowDown" || event.key === "j") {
          event.preventDefault();
          const nextAyah = Math.min(
            currentAyah + 1,
            selectedSurah.numberOfAyahs
          );
          setPendingScroll(nextAyah);
          setFocusedAyahKey(verseKey(selectedSurah.number, nextAyah));
          return;
        }

        // ArrowUp/k - Previous ayah
        if (event.key === "ArrowUp" || event.key === "k") {
          event.preventDefault();
          const prevAyah = Math.max(currentAyah - 1, 1);
          setPendingScroll(prevAyah);
          setFocusedAyahKey(verseKey(selectedSurah.number, prevAyah));
          return;
        }

        // b - Toggle bookmark for focused ayah
        if (event.key === "b" && focusedAyahKey) {
          event.preventDefault();
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          toggleBookmark(surah, ayah);
          return;
        }

        // p - Play current ayah
        if (event.key === "p" && focusedAyahKey) {
          event.preventDefault();
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          playAyah(surah, ayah);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedSurah,
    surahData,
    focusedAyahKey,
    readingMode,
    showShortcuts,
    selectedAyah,
    noteTarget
  ]);

  // Filtered lists
  const filteredSurahs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return surahs;
    return surahs.filter((surah) => {
      return (
        surah.englishName.toLowerCase().includes(trimmed) ||
        surah.englishNameTranslation.toLowerCase().includes(trimmed) ||
        String(surah.number).includes(trimmed)
      );
    });
  }, [query, surahs]);

  const filteredAyahs = useMemo(() => {
    if (!surahData?.ayahs) return [];
    const trimmed = ayahQuery.trim().toLowerCase();
    if (!trimmed) return surahData.ayahs;
    if (/^\d+$/.test(trimmed)) {
      const number = Number(trimmed);
      return surahData.ayahs.filter((ayah) => ayah.number === number);
    }
    return surahData.ayahs.filter((ayah) => {
      const combined = Object.values(ayah.translations || {})
        .map((translation) => translation.text || "")
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
    return Object.entries(notes)
      .map(([key, value]) => ({ key, value, ...parseVerseKey(key) }))
      .sort((a, b) => {
        if (a.surah !== b.surah) return a.surah - b.surah;
        return a.ayah - b.ayah;
      });
  }, [notes]);

  // Helper functions
  const getGlobalIndex = (surahNumber, ayahNumber) => {
    const entry = surahIndex.find((item) => item.number === surahNumber);
    if (!entry) return null;
    return entry.start + ayahNumber - 1;
  };

  const indexToVerse = (globalIndex) => {
    const entry = surahIndex.find(
      (item) => globalIndex >= item.start && globalIndex <= item.end
    );
    if (!entry) return null;
    return { surah: entry.number, ayah: globalIndex - entry.start + 1 };
  };

  // Plan summary
  const planSummary = useMemo(() => {
    if (!surahIndex.length) return null;
    const perDay = Math.max(1, Number(readingPlan.perDay) || 1);
    const startSurah = Number(readingPlan.startSurah) || 1;
    const startAyah = Math.max(1, Number(readingPlan.startAyah) || 1);
    const startIndex = getGlobalIndex(startSurah, startAyah);
    if (!startIndex) return { error: "Start position is not available." };
    const startDate = readingPlan.startDate || getLocalDateString();
    let startDateValue = parseLocalDate(startDate);
    if (Number.isNaN(startDateValue.getTime())) {
      startDateValue = parseLocalDate(getLocalDateString());
    }
    const todayValue = parseLocalDate(getLocalDateString());
    const dayIndex = Math.max(
      0,
      Math.floor((todayValue - startDateValue) / 86400000)
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

  const formatVerseLabel = (verse) => {
    if (!verse) return "";
    const surah = surahByNumber.get(verse.surah);
    const name = surah ? surah.englishName : `Surah ${verse.surah}`;
    return `${name} Ayah ${verse.ayah}`;
  };

  const formatRangeLabel = (startVerse, endVerse) => {
    if (!startVerse || !endVerse) return "";
    if (startVerse.surah === endVerse.surah) {
      const surah = surahByNumber.get(startVerse.surah);
      const name = surah ? surah.englishName : `Surah ${startVerse.surah}`;
      return `${name} Ayah ${startVerse.ayah} to ${endVerse.ayah}`;
    }
    return `${formatVerseLabel(startVerse)} to ${formatVerseLabel(endVerse)}`;
  };

  // Event handlers
  const handleCompare = async (ayah) => {
    if (!selectedSurah) return;
    setSelectedAyah(ayah);
    setFocusedAyahKey(verseKey(selectedSurah.number, ayah.number));
    const key = `${selectedSurah.number}:${ayah.number}`;
    if (taqiCache[key] || taqiLoading[key]) return;

    setTaqiLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(
        `/api/ayah/taqi-usmani?surah=${selectedSurah.number}&ayah=${ayah.number}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load translation.");
      }
      setTaqiCache((prev) => ({ ...prev, [key]: payload.text }));
    } catch (err) {
      setTaqiCache((prev) => ({
        ...prev,
        [key]: "Unable to load Mufti Taqi Usmani translation."
      }));
    } finally {
      setTaqiLoading((prev) => ({ ...prev, [key]: false }));
    }
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

  const handleGoToAyah = () => {
    if (!selectedSurah) return;
    const number = Number(goToAyahInput);
    if (!number || number < 1 || number > selectedSurah.numberOfAyahs) return;
    setPendingScroll(number);
    setFocusedAyahKey(verseKey(selectedSurah.number, number));
  };

  const copyAyahLink = useCallback(async (surahNumber, ayahNumber) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("surah", surahNumber);
    url.searchParams.set("ayah", ayahNumber);
    url.hash = `ayah-${ayahNumber}`;
    
    const success = await copyToClipboard(url.toString());
    if (success) {
      const key = verseKey(surahNumber, ayahNumber);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1600);
    } else {
      setError("Unable to copy link.");
    }
  }, []);

  const closeNote = () => {
    setNoteTarget(null);
    setNoteDraft("");
  };

  const saveNote = () => {
    if (!noteTarget) return;
    const trimmed = noteDraft.trim();
    setNotes((prev) => {
      const next = { ...prev };
      if (trimmed) {
        next[noteTarget.key] = trimmed;
      } else {
        delete next[noteTarget.key];
      }
      return next;
    });
    closeNote();
  };

  const jumpToAyah = (surahNumber, ayahNumber) => {
    const targetSurah = surahByNumber.get(surahNumber);
    if (!targetSurah) return;
    setSelectedSurah(targetSurah);
    setPendingScroll(ayahNumber);
    setFocusedAyahKey(verseKey(surahNumber, ayahNumber));
  };

  const playAyah = (surahNumber, ayahNumber) => {
    setNowPlaying({ surah: surahNumber, ayah: ayahNumber });
  };

  const handleSelectSurah = (surah) => {
    setSelectedSurah(surah);
    setSelectedAyah(null);
    setFocusedAyahKey(null);
  };

  // Computed values
  const selectedAyahKey =
    selectedSurah && selectedAyah
      ? `${selectedSurah.number}:${selectedAyah.number}`
      : null;

  const audioSrc = nowPlaying
    ? getAudioUrl(selectedReciter.baseUrl, nowPlaying.surah, nowPlaying.ayah)
    : null;

  const nowPlayingLabel = nowPlaying
    ? `${
        surahByNumber.get(nowPlaying.surah)?.englishName ||
        `Surah ${nowPlaying.surah}`
      } - Ayah ${nowPlaying.ayah}`
    : "Select an ayah to play.";

  const fontVars = {
    "--arabic-scale": fontScale.arabic,
    "--translation-scale": fontScale.translation
  };

  return (
    <ErrorBoundary>
      <main className={`app${readingMode ? " reading" : ""}`} style={fontVars}>
        <div className="topbar">
          <div className="logo">
            <div className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                <path
                  d="M12 18c6-3 14-4 20-4s14 1 20 4v28c-6-3-14-4-20-4s-14 1-20 4V18Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M32 14v28"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M20 24h12M20 32h12M20 40h12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="logo-text">
              <p className="logo-title">Quran</p>
              <p className="logo-sub">Reader</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              className="action-btn"
              onClick={() => setReadingMode((prev) => !prev)}
            >
              {readingMode ? "Exit focus" : "Focus mode"}
            </button>
          </div>
        </div>

        <section className={`content${readingMode ? " reading" : ""}`}>
          <SurahList
            surahs={surahs}
            filteredSurahs={filteredSurahs}
            selectedSurah={selectedSurah}
            query={query}
            setQuery={setQuery}
            onSelectSurah={handleSelectSurah}
            loading={loadingSurahs}
          />

          <ReaderPanel
            selectedSurah={selectedSurah}
            surahData={surahData}
            filteredAyahs={filteredAyahs}
            selectedTranslation={selectedTranslation}
            setSelectedTranslation={setSelectedTranslation}
            ayahQuery={ayahQuery}
            setAyahQuery={setAyahQuery}
            goToAyahInput={goToAyahInput}
            setGoToAyahInput={setGoToAyahInput}
            handleGoToAyah={handleGoToAyah}
            showWordByWord={showWordByWord}
            setShowWordByWord={setShowWordByWord}
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
            audioSrc={audioSrc}
            nowPlayingLabel={nowPlayingLabel}
            reciterLabel={selectedReciter.label}
            error={error}
            loadingSurahData={loadingSurahData}
            onPlay={playAyah}
            onToggleBookmark={toggleBookmark}
            onOpenNote={openNote}
            onCompare={handleCompare}
            onCopyLink={copyAyahLink}
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

        {/* Last read card - shows when no surah is selected */}
        {!selectedSurah && lastRead && (
          <LastReadCard
            lastRead={lastRead}
            onContinue={() => jumpToAyah(lastRead.surah, lastRead.ayah)}
          />
        )}

        <CompareModal
          selectedAyah={selectedAyah}
          selectedSurah={selectedSurah}
          selectedAyahKey={selectedAyahKey}
          taqiCache={taqiCache}
          taqiLoading={taqiLoading}
          onClose={() => setSelectedAyah(null)}
        />

        <NoteModal
          noteTarget={noteTarget}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          surahByNumber={surahByNumber}
          onClose={closeNote}
          onSave={saveNote}
        />

        {/* Keyboard shortcuts help modal */}
        <KeyboardShortcutsHelp
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />

        {/* Keyboard shortcuts hint */}
        <div className="shortcuts-hint">
          Press <kbd>?</kbd> for keyboard shortcuts
        </div>
      </main>
    </ErrorBoundary>
  );
}
