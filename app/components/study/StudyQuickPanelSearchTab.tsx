"use client";

import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StudyQuickPanelContentProps } from "./StudyQuickPanelTypes";

const RECENT_SEARCHES_KEY = "quran_recent_searches";
const MAX_RECENT = 6;
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;
const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

type StudyQuickPanelSearchTabProps = Pick<
  StudyQuickPanelContentProps,
  | "searchQuery"
  | "setSearchQuery"
  | "runSearch"
  | "searchLoading"
  | "searchError"
  | "searchHasRun"
  | "searchResults"
  | "surahByNumber"
  | "onJumpToAyah"
  | "onClosePanel"
>;

type SearchFilterKey =
  | "all"
  | "surah"
  | "arabic"
  | "translation"
  | "gloss"
  | "transliteration"
  | "root"
  | "lemma";

const TOPIC_GROUPS: Array<{ title: string; topics: string[] }> = [
  {
    title: "Core Themes",
    topics: ["Mercy", "Faith", "Patience", "Forgiveness", "Guidance", "Gratitude"]
  },
  {
    title: "Worship & Practice",
    topics: ["Prayer", "Fasting", "Charity", "Hajj", "Repentance", "Supplication"]
  },
  {
    title: "Life & Society",
    topics: ["Justice", "Family", "Kindness", "Honesty", "Knowledge", "Wealth"]
  },
  {
    title: "Hereafter",
    topics: ["Paradise", "Hell", "Judgement Day", "Death", "Resurrection", "Angels"]
  }
];

const KEY_VERSES: Array<{ label: string; surah: number; ayah: number; desc: string }> = [
  { label: "Ayat al-Kursi", surah: 2, ayah: 255, desc: "The Throne Verse" },
  { label: "Al-Fatiha", surah: 1, ayah: 1, desc: "The Opening" },
  { label: "Last 2 Ayahs", surah: 2, ayah: 285, desc: "Al-Baqarah ending" },
  { label: "Light Verse", surah: 24, ayah: 35, desc: "Ayat an-Nur" },
  { label: "No Compulsion", surah: 2, ayah: 256, desc: "Freedom of faith" },
  { label: "Trust in Allah", surah: 65, ayah: 3, desc: "At-Talaq" }
];

const getRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string) => {
  const q = query.trim();
  if (!q) return;
  try {
    const existing = getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...existing].slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
};

const clearRecentSearches = () => {
  try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch { /* ignore */ }
};

const normalizeForHighlight = (value: string) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS_RE, "")
    .replace(ARABIC_DIACRITICS_RE, "")
    .trim();

const getHighlightQuery = (query: string) =>
  query
    .trim()
    .replace(/^root\s*:/i, "")
    .replace(/^lemma\s*:/i, "")
    .replace(/^surah\s*:/i, "")
    .trim();

const getFilterKey = (matchType?: string): SearchFilterKey => {
  switch (matchType) {
    case "surah":
    case "arabic":
    case "translation":
    case "gloss":
    case "transliteration":
    case "root":
    case "lemma":
      return matchType;
    default:
      return "all";
  }
};

const FILTER_LABELS: Record<SearchFilterKey, string> = {
  all: "All",
  surah: "Surah",
  arabic: "Arabic",
  translation: "Translation",
  gloss: "Meaning",
  transliteration: "Translit",
  root: "Root",
  lemma: "Lemma"
};

const findHighlightRanges = (text: string, rawQuery: string) => {
  const baseQuery = getHighlightQuery(rawQuery);
  if (!text || !baseQuery) return [];

  const terms = [...new Set(
    baseQuery
      .split(/\s+/)
      .map((term) => normalizeForHighlight(term))
      .filter(Boolean)
  )].sort((a, b) => b.length - a.length);

  if (!terms.length) return [];

  let normalizedText = "";
  const normalizedToOriginal: number[] = [];
  let offset = 0;

  for (const char of text) {
    const charStart = offset;
    offset += char.length;
    const normalizedChar = normalizeForHighlight(char);
    if (!normalizedChar) continue;
    for (const outChar of normalizedChar) {
      normalizedText += outChar;
      normalizedToOriginal.push(charStart);
    }
  }

  const ranges: Array<{ start: number; end: number }> = [];

  for (const term of terms) {
    let searchFrom = 0;
    while (searchFrom < normalizedText.length) {
      const foundAt = normalizedText.indexOf(term, searchFrom);
      if (foundAt === -1) break;
      const lastIndex = foundAt + term.length - 1;
      const start = normalizedToOriginal[foundAt];
      const end = lastIndex + 1 < normalizedToOriginal.length
        ? normalizedToOriginal[lastIndex + 1]
        : text.length;
      if (typeof start === "number" && typeof end === "number" && end > start) {
        ranges.push({ start, end });
      }
      searchFrom = foundAt + term.length;
    }
  }

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const prev = merged[merged.length - 1];
    if (!prev || range.start > prev.end) {
      merged.push(range);
    } else if (range.end > prev.end) {
      prev.end = range.end;
    }
  }

  return merged;
};

const renderHighlightedText = (text: string, query: string) => {
  const ranges = findHighlightRanges(text, query);
  if (!ranges.length) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }
    parts.push(
      <mark key={`${range.start}-${range.end}-${index}`} className="sqp-highlight">
        {text.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  });
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts.map((part, index) => (
    <Fragment key={typeof part === "string" ? `text-${index}` : `mark-${index}`}>{part}</Fragment>
  ));
};

export default function StudyQuickPanelSearchTab({
  searchQuery,
  setSearchQuery,
  runSearch,
  searchLoading,
  searchError,
  searchHasRun,
  searchResults,
  surahByNumber,
  onJumpToAyah,
  onClosePanel
}: StudyQuickPanelSearchTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSearchRef = useRef(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<SearchFilterKey>("all");

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    setActiveFilter("all");
  }, [searchQuery, searchResults]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    runSearch();
  }, [searchQuery, runSearch]);

  const handleClear = () => {
    pendingSearchRef.current = true;
    setSearchQuery("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (pendingSearchRef.current) {
      pendingSearchRef.current = false;
      runSearch();
    }
  }, [searchQuery, runSearch]);

  const handleTopicClick = (topic: string) => {
    saveRecentSearch(topic);
    setRecentSearches(getRecentSearches());
    pendingSearchRef.current = true;
    setSearchQuery(topic);
  };

  const handleRecentClick = (query: string) => {
    saveRecentSearch(query);
    setRecentSearches(getRecentSearches());
    pendingSearchRef.current = true;
    setSearchQuery(query);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleKeyVerse = (surah: number, ayah: number) => {
    onJumpToAyah(surah, ayah);
    onClosePanel();
  };

  const hasQuery = searchQuery.trim().length > 0;
  const showHome = !hasQuery && !searchHasRun && !searchLoading;
  const showEmpty = !searchLoading && !searchError && searchResults.length === 0;
  const availableFilters = useMemo(() => {
    const present = new Set<SearchFilterKey>(["all"]);
    searchResults.forEach((result) => {
      present.add(getFilterKey(result.matchType));
    });
    return (["all", "surah", "arabic", "translation", "gloss", "transliteration", "root", "lemma"] as SearchFilterKey[])
      .filter((filter) => present.has(filter));
  }, [searchResults]);
  const filteredResults = useMemo(
    () => searchResults.filter((result) => activeFilter === "all" || getFilterKey(result.matchType) === activeFilter),
    [activeFilter, searchResults]
  );
  const showFilteredEmpty = !searchLoading && !searchError && searchResults.length > 0 && filteredResults.length === 0;

  return (
    <div className="quick-panel-section">
      {/* Search input */}
      <div className="sqp-search-bar">
        <svg className="sqp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="sqp-search-input"
          placeholder="Search the Quran…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        />
        {searchQuery && (
          <button type="button" className="sqp-search-clear" onClick={handleClear} aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Loading */}
      {searchLoading && (
        <div className="sqp-search-status">
          <div className="sqp-search-spinner" />
          <span>Searching…</span>
        </div>
      )}

      {/* Error */}
      {searchError && (
        <div className="sqp-search-status sqp-search-status--error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
          <span>{searchError}</span>
        </div>
      )}

      {/* ── Home state (no query) ── */}
      {showHome && (
        <>
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="sqp-section">
              <div className="sqp-section-header">
                <span className="sqp-section-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Recent
                </span>
                <button type="button" className="sqp-section-action" onClick={handleClearRecent}>Clear</button>
              </div>
              <div className="sqp-chip-list">
                {recentSearches.map((q) => (
                  <button key={q} type="button" className="sqp-chip" onClick={() => handleRecentClick(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Key Verses */}
          <div className="sqp-section">
            <div className="sqp-section-header">
              <span className="sqp-section-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26Z"/></svg>
                Key Verses
              </span>
            </div>
            <div className="sqp-key-verses">
              {KEY_VERSES.map((v) => (
                <button
                  key={`${v.surah}:${v.ayah}`}
                  type="button"
                  className="sqp-key-verse"
                  onClick={() => handleKeyVerse(v.surah, v.ayah)}
                >
                  <div className="sqp-key-verse-text">
                    <span className="sqp-key-verse-label">{v.label}</span>
                    <span className="sqp-key-verse-desc">{v.desc}</span>
                  </div>
                  <span className="sqp-key-verse-ref">{v.surah}:{v.ayah}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic exploration */}
          {TOPIC_GROUPS.map((group) => (
            <div key={group.title} className="sqp-section">
              <div className="sqp-section-header">
                <span className="sqp-section-label">{group.title}</span>
              </div>
              <div className="sqp-chip-list">
                {group.topics.map((topic) => (
                  <button key={topic} type="button" className="sqp-chip sqp-chip--topic" onClick={() => handleTopicClick(topic)}>
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Search tips */}
          <div className="sqp-tips">
            <span className="sqp-tips-label">Tips</span>
            <ul className="sqp-tips-list">
              <li>Type a verse reference like <strong>2:255</strong> to jump directly</li>
              <li>Search in English or Arabic</li>
              <li>Try <strong>root:رحم</strong> or <strong>lemma:كتاب</strong> for deeper study</li>
              <li>Try broad topics like &ldquo;mercy&rdquo; or specific words</li>
            </ul>
          </div>
        </>
      )}

      {/* No results */}
      {!searchLoading && !searchError && searchHasRun && showEmpty && (
        <div className="sqp-search-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>
          <p>No results found</p>
          <span>Try a different keyword or verse reference (e.g. 2:255)</span>
        </div>
      )}

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="sqp-search-results-wrap">
          <div className="sqp-search-results-top">
            <span className="sqp-result-count">{filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}</span>
            {availableFilters.length > 1 && (
              <div className="sqp-search-filters">
                {availableFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`sqp-search-filter${activeFilter === filter ? " is-active" : ""}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {FILTER_LABELS[filter]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ul className="sqp-search-results">
            {filteredResults.map((result, index) => {
              const name = result.surah
                ? surahByNumber.get(result.surah)?.englishName || `Surah ${result.surah}`
                : "";
              const verseKey = result.surah && result.ayah ? `${result.surah}:${result.ayah}` : "";
              return (
                <li
                  key={`${result.surah}-${result.ayah}-${index}`}
                  className="sqp-search-result"
                  onClick={() => {
                    if (result.surah && result.ayah) {
                      onJumpToAyah(result.surah, result.ayah);
                      onClosePanel();
                    }
                  }}
                  role={result.surah && result.ayah ? "button" : undefined}
                  tabIndex={result.surah && result.ayah ? 0 : undefined}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && result.surah && result.ayah) {
                      e.preventDefault();
                      onJumpToAyah(result.surah, result.ayah);
                      onClosePanel();
                    }
                  }}
                >
                  <div className="sqp-result-header">
                    <span className="sqp-result-name">{renderHighlightedText(name, searchQuery)}</span>
                    {verseKey && <span className="sqp-result-key">{verseKey}</span>}
                  </div>
                  {(result.matchLabel || result.page || result.juz) && (
                    <div className="sqp-result-meta">
                      {[
                        result.matchLabel,
                        result.juz ? `Juz ${result.juz}` : null,
                        result.page ? `Page ${result.page}` : null
                      ].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {result.text && (
                    <p className="sqp-result-arabic" lang="ar" dir="rtl">{renderHighlightedText(result.text, searchQuery)}</p>
                  )}
                  {result.translation && (
                    <p className="sqp-result-translation">{renderHighlightedText(result.translation, searchQuery)}</p>
                  )}
                </li>
              );
            })}
          </ul>
          {showFilteredEmpty && (
            <div className="sqp-search-empty sqp-search-empty--inline">
              <p>No {FILTER_LABELS[activeFilter].toLowerCase()} matches</p>
              <span>Try switching filters or broadening the query.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
