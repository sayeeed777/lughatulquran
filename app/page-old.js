"use client";

import { useEffect, useMemo, useState } from "react";

const INLINE_TRANSLATIONS = [
  { id: "en.sahih", label: "Sahih International" },
  { id: "en.arberry", label: "A.J. Arberry" },
  { id: "en.pickthall", label: "Pickthall" },
  { id: "en.yusufali", label: "Yusuf Ali" }
];

const ALL_TRANSLATIONS = [
  { id: "en.sahih", label: "Sahih International" },
  { id: "en.arberry", label: "A.J. Arberry" },
  { id: "en.pickthall", label: "Pickthall" },
  { id: "en.yusufali", label: "Yusuf Ali" },
  { id: "taqi-usmani", label: "Mufti Taqi Usmani" }
];

const AUDIO_RECITER = {
  label: "Mishary Rashid Alafasy",
  baseUrl: "https://everyayah.com/data/Alafasy_64kbps"
};

const pad3 = (value) => String(value).padStart(3, "0");

const getAudioUrl = (surahNumber, ayahNumber) =>
  `${AUDIO_RECITER.baseUrl}/${pad3(surahNumber)}${pad3(ayahNumber)}.mp3`;

const sanitizeArabic = (text) => {
  return text;
};

const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

const parseLocalDate = (value) => new Date(`${value}T00:00:00`);

const defaultPlan = {
  startDate: getLocalDateString(),
  perDay: 10,
  startSurah: 1,
  startAyah: 1
};

const verseKey = (surahNumber, ayahNumber) => `${surahNumber}:${ayahNumber}`;

const parseVerseKey = (key) => {
  const [surah, ayah] = key.split(":").map(Number);
  return { surah, ayah };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function Home() {
  const [surahs, setSurahs] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [loadingSurahData, setLoadingSurahData] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState(
    INLINE_TRANSLATIONS[0].id
  );
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
  const [readingPlan, setReadingPlan] = useState(defaultPlan);
  const [readingMode, setReadingMode] = useState(false);
  const [fontScale, setFontScale] = useState({
    arabic: 1,
    translation: 1
  });
  const [nowPlaying, setNowPlaying] = useState(null);
  const [pendingScroll, setPendingScroll] = useState(null);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const storedBookmarks = localStorage.getItem("quran_bookmarks");
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      }
      const storedNotes = localStorage.getItem("quran_notes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
      const storedPlan = localStorage.getItem("quran_plan");
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        setReadingPlan({
          ...defaultPlan,
          ...parsedPlan,
          perDay: Number(parsedPlan.perDay) || defaultPlan.perDay,
          startSurah: Number(parsedPlan.startSurah) || defaultPlan.startSurah,
          startAyah: Number(parsedPlan.startAyah) || defaultPlan.startAyah
        });
      }
      const storedScale = localStorage.getItem("quran_font_scale");
      if (storedScale) {
        const parsedScale = JSON.parse(storedScale);
        setFontScale({
          arabic: clamp(Number(parsedScale.arabic) || 1, 0.8, 1.4),
          translation: clamp(Number(parsedScale.translation) || 1, 0.8, 1.3)
        });
      }
    } catch (err) {
      setError("Saved study data could not be loaded.");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("quran_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("quran_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("quran_plan", JSON.stringify(readingPlan));
  }, [readingPlan]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("quran_font_scale", JSON.stringify(fontScale));
  }, [fontScale]);

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

  const surahByNumber = useMemo(() => {
    return new Map(surahs.map((surah) => [surah.number, surah]));
  }, [surahs]);

  const surahIndex = useMemo(() => {
    let offset = 0;
    return surahs.map((surah) => {
      const start = offset + 1;
      const end = offset + surah.numberOfAyahs;
      offset = end;
      return {
        number: surah.number,
        start,
        end
      };
    });
  }, [surahs]);

  const totalAyahs = surahIndex.length
    ? surahIndex[surahIndex.length - 1].end
    : 0;

  useEffect(() => {
    if (!readingPlan.startSurah) {
      return;
    }
    const info = surahByNumber.get(Number(readingPlan.startSurah));
    if (!info) {
      return;
    }
    if (readingPlan.startAyah > info.numberOfAyahs) {
      setReadingPlan((prev) => ({
        ...prev,
        startAyah: info.numberOfAyahs
      }));
    }
  }, [readingPlan.startSurah, readingPlan.startAyah, surahByNumber]);

  useEffect(() => {
    if (!pendingScroll || !surahData?.surah || !selectedSurah) {
      return;
    }
    if (surahData.surah.number !== selectedSurah.number) {
      return;
    }
    const target = document.getElementById(`ayah-${pendingScroll}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setFocusedAyahKey(verseKey(selectedSurah.number, pendingScroll));
    }
    setPendingScroll(null);
  }, [pendingScroll, surahData, selectedSurah]);

  useEffect(() => {
    if (!showWordByWord || !selectedSurah) {
      return;
    }
    if (wordByAyah[selectedSurah.number]) {
      return;
    }
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
        if (isMounted) {
          setWordError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setWordLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showWordByWord, selectedSurah, wordByAyah]);

  const filteredSurahs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return surahs;
    }
    return surahs.filter((surah) => {
      return (
        surah.englishName.toLowerCase().includes(trimmed) ||
        surah.englishNameTranslation.toLowerCase().includes(trimmed) ||
        String(surah.number).includes(trimmed)
      );
    });
  }, [query, surahs]);

  const filteredAyahs = useMemo(() => {
    if (!surahData?.ayahs) {
      return [];
    }
    const trimmed = ayahQuery.trim().toLowerCase();
    if (!trimmed) {
      return surahData.ayahs;
    }
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
      if (first.surah !== second.surah) {
        return first.surah - second.surah;
      }
      return first.ayah - second.ayah;
    });
  }, [bookmarks]);

  const sortedNotes = useMemo(() => {
    return Object.entries(notes)
      .map(([key, value]) => ({ key, value, ...parseVerseKey(key) }))
      .sort((a, b) => {
        if (a.surah !== b.surah) {
          return a.surah - b.surah;
        }
        return a.ayah - b.ayah;
      });
  }, [notes]);

  const getGlobalIndex = (surahNumber, ayahNumber) => {
    const entry = surahIndex.find((item) => item.number === surahNumber);
    if (!entry) {
      return null;
    }
    return entry.start + ayahNumber - 1;
  };

  const indexToVerse = (globalIndex) => {
    const entry = surahIndex.find(
      (item) => globalIndex >= item.start && globalIndex <= item.end
    );
    if (!entry) {
      return null;
    }
    return {
      surah: entry.number,
      ayah: globalIndex - entry.start + 1
    };
  };

  const planSummary = useMemo(() => {
    if (!surahIndex.length) {
      return null;
    }
    const perDay = Math.max(1, Number(readingPlan.perDay) || 1);
    const startSurah = Number(readingPlan.startSurah) || 1;
    const startAyah = Math.max(1, Number(readingPlan.startAyah) || 1);
    const startIndex = getGlobalIndex(startSurah, startAyah);
    if (!startIndex) {
      return { error: "Start position is not available." };
    }
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
    return {
      dayIndex,
      startVerse,
      endVerse,
      todayStartIndex,
      todayEndIndex
    };
  }, [readingPlan, surahIndex, totalAyahs]);

  const formatVerseLabel = (verse) => {
    if (!verse) {
      return "";
    }
    const surah = surahByNumber.get(verse.surah);
    const name = surah ? surah.englishName : `Surah ${verse.surah}`;
    return `${name} Ayah ${verse.ayah}`;
  };

  const formatRangeLabel = (startVerse, endVerse) => {
    if (!startVerse || !endVerse) {
      return "";
    }
    if (startVerse.surah === endVerse.surah) {
      const surah = surahByNumber.get(startVerse.surah);
      const name = surah ? surah.englishName : `Surah ${startVerse.surah}`;
      return `${name} Ayah ${startVerse.ayah} to ${endVerse.ayah}`;
    }
    return `${formatVerseLabel(startVerse)} to ${formatVerseLabel(endVerse)}`;
  };

  const handleCompare = async (ayah) => {
    if (!selectedSurah) {
      return;
    }

    setSelectedAyah(ayah);
    setFocusedAyahKey(verseKey(selectedSurah.number, ayah.number));
    const key = `${selectedSurah.number}:${ayah.number}`;
    if (taqiCache[key] || taqiLoading[key]) {
      return;
    }

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
    if (!selectedSurah) {
      return;
    }
    const number = Number(goToAyahInput);
    if (!number || number < 1 || number > selectedSurah.numberOfAyahs) {
      return;
    }
    setPendingScroll(number);
    setFocusedAyahKey(verseKey(selectedSurah.number, number));
  };

  const copyAyahLink = async (surahNumber, ayahNumber) => {
    if (typeof window === "undefined") {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("surah", surahNumber);
    url.searchParams.set("ayah", ayahNumber);
    url.hash = `ayah-${ayahNumber}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.toString());
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url.toString();
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      const key = verseKey(surahNumber, ayahNumber);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1600);
    } catch (err) {
      setError("Unable to copy link.");
    }
  };

  const closeNote = () => {
    setNoteTarget(null);
    setNoteDraft("");
  };

  const saveNote = () => {
    if (!noteTarget) {
      return;
    }
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
    if (!targetSurah) {
      return;
    }
    setSelectedSurah(targetSurah);
    setPendingScroll(ayahNumber);
    setFocusedAyahKey(verseKey(surahNumber, ayahNumber));
  };

  const playAyah = (surahNumber, ayahNumber) => {
    setNowPlaying({ surah: surahNumber, ayah: ayahNumber });
  };

  const selectedAyahKey =
    selectedSurah && selectedAyah
      ? `${selectedSurah.number}:${selectedAyah.number}`
      : null;
  const taqiText = selectedAyahKey ? taqiCache[selectedAyahKey] : null;

  const audioSrc = nowPlaying
    ? getAudioUrl(nowPlaying.surah, nowPlaying.ayah)
    : null;
  const nowPlayingLabel = nowPlaying
    ? `${
        surahByNumber.get(nowPlaying.surah)?.englishName ||
        `Surah ${nowPlaying.surah}`
      } - Ayah ${nowPlaying.ayah}`
    : "Select an ayah to play.";
  const formatArabic = (text) => sanitizeArabic(text);
  const fontVars = {
    "--arabic-scale": fontScale.arabic,
    "--translation-scale": fontScale.translation
  };

  return (
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
        <aside className="panel surah-panel">
          <div className="panel-header">
            <h2>Surahs</h2>
            <input
              className="search"
              placeholder="Search by name or number"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {loadingSurahs ? (
            <p className="status">Loading surahs...</p>
          ) : (
            <ul className="surah-list">
              {filteredSurahs.map((surah) => (
                <li key={surah.number}>
                  <button
                    className={`surah-item${
                      selectedSurah?.number === surah.number ? " active" : ""
                    }`}
                    onClick={() => {
                      setSelectedSurah(surah);
                      setSelectedAyah(null);
                      setFocusedAyahKey(null);
                    }}
                  >
                    <span className="surah-number">{surah.number}</span>
                    <span className="surah-names">
                      <span className="surah-english">{surah.englishName}</span>
                      <span className="surah-translation">
                        {surah.englishNameTranslation}
                      </span>
                    </span>
                    <span className="surah-arabic" lang="ar" dir="rtl">
                      {surah.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="panel reader-panel">
          <div className="panel-header">
            <div>
              <h2>
                {selectedSurah
                  ? `${selectedSurah.englishName} (${selectedSurah.name})`
                  : "Choose a Surah"}
              </h2>
              {selectedSurah && (
                <p className="meta">
                  {selectedSurah.englishNameTranslation} -
                  {" " + selectedSurah.numberOfAyahs} ayahs -
                  {" " + selectedSurah.revelationType}
                </p>
              )}
            </div>
            <div className="translation-toggle">
              {INLINE_TRANSLATIONS.map((translation) => (
                <button
                  key={translation.id}
                  className={
                    selectedTranslation === translation.id ? "active" : ""
                  }
                  onClick={() => setSelectedTranslation(translation.id)}
                >
                  {translation.label}
                </button>
              ))}
            </div>
          </div>

          <div className="reader-controls">
            <div className="reader-toolbar">
              <label className="reader-search">
                <span>Search ayahs</span>
                <input
                  type="text"
                  placeholder="Ayah number or word in translation"
                  value={ayahQuery}
                  onChange={(event) => setAyahQuery(event.target.value)}
                />
              </label>
              <div className="go-ayah">
                <label>
                  <span>Go to ayah</span>
                  <input
                    type="number"
                    min={1}
                    max={selectedSurah?.numberOfAyahs || 1}
                    value={goToAyahInput}
                    onChange={(event) => setGoToAyahInput(event.target.value)}
                  />
                </label>
                <button className="action-btn" onClick={handleGoToAyah}>
                  Go
                </button>
              </div>
              <div className="word-toggle">
                <button
                  className={`action-btn${showWordByWord ? " saved" : ""}`}
                  onClick={() => setShowWordByWord((prev) => !prev)}
                >
                  Word by word
                </button>
                {showWordByWord && wordLoading && (
                  <span className="meta">Loading...</span>
                )}
                {showWordByWord && wordError && (
                  <span className="meta error">Unavailable</span>
                )}
              </div>
            </div>
            <label className="control">
              <span>Arabic size</span>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={fontScale.arabic}
                onChange={(event) =>
                  setFontScale((prev) => ({
                    ...prev,
                    arabic: clamp(Number(event.target.value), 0.8, 1.4)
                  }))
                }
              />
            </label>
            <label className="control">
              <span>Translation size</span>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={fontScale.translation}
                onChange={(event) =>
                  setFontScale((prev) => ({
                    ...prev,
                    translation: clamp(Number(event.target.value), 0.8, 1.3)
                  }))
                }
              />
            </label>
          </div>

          <div className="audio-bar">
            <div>
              <p className="label">Recitation</p>
              <p className="meta">
                {AUDIO_RECITER.label} - {nowPlayingLabel}
              </p>
            </div>
            {audioSrc ? (
              <audio key={audioSrc} src={audioSrc} controls autoPlay />
            ) : (
              <div className="audio-placeholder">Ready</div>
            )}
          </div>

          {error && <p className="status error">{error}</p>}

          {loadingSurahData ? (
            <p className="status">Loading ayahs...</p>
          ) : surahData ? (
            filteredAyahs.length ? (
              <ol className="ayah-list">
                {filteredAyahs.map((ayah, index) => {
                  const translation = ayah.translations?.[selectedTranslation];
                  const key = verseKey(selectedSurah.number, ayah.number);
                  const isSaved = bookmarks.includes(key);
                  const hasNote = notes[key];
                  const isFocused = focusedAyahKey === key;
                  const words =
                    wordByAyah[selectedSurah.number]?.[ayah.number] || [];
                  return (
                    <li
                      key={ayah.number}
                      id={`ayah-${ayah.number}`}
                      className={`ayah-card${isFocused ? " focused" : ""}`}
                      style={{ "--i": index }}
                      tabIndex={0}
                      onClick={() => setFocusedAyahKey(key)}
                      onFocus={() => setFocusedAyahKey(key)}
                    >
                      <div className="ayah-header">
                        <span className="ayah-number">Ayah {ayah.number}</span>
                        <div className="ayah-actions">
                          <button
                            className="action-btn"
                            onClick={() =>
                              playAyah(selectedSurah.number, ayah.number)
                            }
                          >
                            Play
                          </button>
                          <button
                            className={`action-btn${isSaved ? " saved" : ""}`}
                            onClick={() =>
                              toggleBookmark(selectedSurah.number, ayah.number)
                            }
                          >
                            {isSaved ? "Saved" : "Save"}
                          </button>
                          <button
                            className={`action-btn${hasNote ? " saved" : ""}`}
                            onClick={() =>
                              openNote(selectedSurah.number, ayah.number)
                            }
                          >
                            {hasNote ? "Edit note" : "Add note"}
                          </button>
                          <button
                            className="compare-btn"
                            onClick={() => handleCompare(ayah)}
                          >
                            Compare
                          </button>
                          <button
                            className="action-btn"
                            onClick={() =>
                              copyAyahLink(selectedSurah.number, ayah.number)
                            }
                          >
                            {copiedKey === key ? "Copied" : "Copy link"}
                          </button>
                        </div>
                      </div>
                      <p className="ayah-arabic" lang="ar" dir="rtl">
                        {formatArabic(ayah.arabic)}
                      </p>
                      <p className="ayah-translation">
                        {translation?.text || "Translation unavailable."}
                      </p>
                      {showWordByWord && words.length > 0 && (
                        <div className="word-row">
                          {words.map((word, wordIndex) => (
                            <div
                              className="word-chip"
                              key={`${key}-${wordIndex}`}
                            >
                              <span className="word-ar" lang="ar" dir="rtl">
                                {word.arabic}
                              </span>
                              {word.translation && (
                                <span className="word-en">
                                  {word.translation}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="status">No ayahs found.</p>
            )
          ) : (
            <p className="status">Select a surah to begin.</p>
          )}
        </section>

        <aside className="panel study-panel">
          <div className="panel-header">
            <h2>Study</h2>
            <p className="meta">Plan, bookmarks, and notes</p>
          </div>

          <div className="study-section">
            <h3>Daily plan</h3>
            <div className="plan-grid">
              <label className="field">
                <span>Start date</span>
                <input
                  type="date"
                  value={readingPlan.startDate || getLocalDateString()}
                  onChange={(event) =>
                    setReadingPlan((prev) => ({
                      ...prev,
                      startDate: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Ayahs per day</span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={readingPlan.perDay || 10}
                  onChange={(event) =>
                    setReadingPlan((prev) => ({
                      ...prev,
                      perDay: Number(event.target.value)
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Start surah</span>
                <select
                  value={readingPlan.startSurah || 1}
                  onChange={(event) =>
                    setReadingPlan((prev) => ({
                      ...prev,
                      startSurah: Number(event.target.value)
                    }))
                  }
                >
                  {surahs.map((surah) => (
                    <option key={surah.number} value={surah.number}>
                      {surah.number}. {surah.englishName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Start ayah</span>
                <input
                  type="number"
                  min={1}
                  max={
                    surahByNumber.get(readingPlan.startSurah)?.numberOfAyahs ||
                    1
                  }
                  value={readingPlan.startAyah || 1}
                  onChange={(event) =>
                    setReadingPlan((prev) => ({
                      ...prev,
                      startAyah: Number(event.target.value)
                    }))
                  }
                />
              </label>
            </div>
            <div className="plan-summary">
              <p className="label">Today</p>
              {!planSummary ? (
                <p className="plan-range">Loading plan...</p>
              ) : planSummary.completed ? (
                <p className="plan-range">
                  Plan complete. Adjust the start date to begin again.
                </p>
              ) : planSummary.error ? (
                <p className="plan-range">{planSummary.error}</p>
              ) : (
                <>
                  <p className="plan-range">
                    {formatRangeLabel(
                      planSummary.startVerse,
                      planSummary.endVerse
                    )}
                  </p>
                  {planSummary.startVerse && (
                    <button
                      className="action-btn"
                      onClick={() =>
                        jumpToAyah(
                          planSummary.startVerse.surah,
                          planSummary.startVerse.ayah
                        )
                      }
                    >
                      Jump to today
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="study-section">
            <h3>Bookmarks</h3>
            {sortedBookmarks.length ? (
              <ul className="study-list">
                {sortedBookmarks.map((key) => {
                  const { surah, ayah } = parseVerseKey(key);
                  const name =
                    surahByNumber.get(surah)?.englishName || `Surah ${surah}`;
                  return (
                    <li key={key} className="study-item">
                      <div>
                        <p className="study-title">{name}</p>
                        <p className="study-sub">Ayah {ayah}</p>
                      </div>
                      <div className="study-actions">
                        <button
                          className="action-btn"
                          onClick={() => jumpToAyah(surah, ayah)}
                        >
                          Open
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => toggleBookmark(surah, ayah)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="status">No bookmarks yet.</p>
            )}
          </div>

          <div className="study-section">
            <h3>Notes</h3>
            {sortedNotes.length ? (
              <ul className="study-list">
                {sortedNotes.map((note) => {
                  const name =
                    surahByNumber.get(note.surah)?.englishName ||
                    `Surah ${note.surah}`;
                  const preview = note.value.length > 80
                    ? `${note.value.slice(0, 80)}...`
                    : note.value;
                  return (
                    <li key={note.key} className="study-item">
                      <div>
                        <p className="study-title">{name} - Ayah {note.ayah}</p>
                        <p className="study-sub">{preview}</p>
                      </div>
                      <div className="study-actions">
                        <button
                          className="action-btn"
                          onClick={() => openNote(note.surah, note.ayah)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => jumpToAyah(note.surah, note.ayah)}
                        >
                          Open
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="status">No notes yet.</p>
            )}
          </div>
        </aside>
      </section>

      {selectedAyah && selectedSurah && (
        <div className="compare-panel" role="dialog" aria-modal="true">
          <div className="compare-header">
            <div>
              <p className="eyebrow">Ayah {selectedAyah.number}</p>
              <h3>
                {selectedSurah.englishName} - {selectedSurah.name}
              </h3>
            </div>
            <button
              className="close-btn"
              onClick={() => setSelectedAyah(null)}
            >
              Close
            </button>
          </div>
          <div className="compare-body">
            <div className="compare-block">
              <p className="label">Arabic (Uthmani)</p>
              <p className="ayah-arabic" lang="ar" dir="rtl">
                {formatArabic(selectedAyah.arabic)}
              </p>
            </div>
            {ALL_TRANSLATIONS.map((translation) => {
              const isTaqi = translation.id === "taqi-usmani";
              const translationText = isTaqi
                ? taqiText
                : selectedAyah.translations?.[translation.id]?.text;
              return (
                <div key={translation.id} className="compare-block">
                  <p className="label">{translation.label}</p>
                  <p className="compare-text">
                    {isTaqi && taqiLoading[selectedAyahKey]
                      ? "Loading translation..."
                      : translationText || "Translation unavailable."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {noteTarget && (
        <div className="note-panel" role="dialog" aria-modal="true">
          <div className="compare-header">
            <div>
              <p className="eyebrow">Notes</p>
              <h3>
                {surahByNumber.get(noteTarget.surah)?.englishName ||
                  `Surah ${noteTarget.surah}`} - Ayah {noteTarget.ayah}
              </h3>
            </div>
            <button className="close-btn" onClick={closeNote}>
              Close
            </button>
          </div>
          <div className="note-body">
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Write your reflection or note here..."
              rows={6}
            />
            <div className="note-actions">
              <button className="action-btn" onClick={closeNote}>
                Cancel
              </button>
              <button className="action-btn saved" onClick={saveNote}>
                Save note
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
