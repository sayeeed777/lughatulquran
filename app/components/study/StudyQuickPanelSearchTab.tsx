"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudyQuickPanelContentProps } from "./StudyQuickPanelTypes";

const RECENT_SEARCHES_KEY = "quran_recent_searches";
const MAX_RECENT = 6;

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

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    // Auto-focus the input when tab opens
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    runSearch();
  }, [searchQuery, runSearch]);

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Run search after query state has been updated from a recent click
  useEffect(() => {
    if (pendingSearchRef.current) {
      pendingSearchRef.current = false;
      runSearch();
    }
  }, [searchQuery, runSearch]);

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

  const showRecent = !searchQuery.trim() && !searchHasRun && recentSearches.length > 0;
  const showEmpty = !searchLoading && !searchError && searchResults.length === 0;

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

      {/* Recent searches */}
      {showRecent && (
        <div className="sqp-recent">
          <div className="sqp-recent-header">
            <span className="sqp-recent-label">Recent</span>
            <button type="button" className="sqp-recent-clear" onClick={handleClearRecent}>Clear</button>
          </div>
          <div className="sqp-recent-list">
            {recentSearches.map((q) => (
              <button key={q} type="button" className="sqp-recent-chip" onClick={() => handleRecentClick(q)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searchLoading && !searchError && !showRecent && showEmpty && (
        <div className="sqp-search-empty">
          {searchHasRun ? (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>
              <p>No results found</p>
              <span>Try a different keyword or verse reference (e.g. 2:255)</span>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <p>Search by keyword or verse</p>
              <span>Try &ldquo;mercy&rdquo;, &ldquo;patience&rdquo;, or a verse like &ldquo;2:255&rdquo;</span>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="sqp-search-results-wrap">
          <span className="sqp-result-count">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</span>
          <ul className="sqp-search-results">
            {searchResults.map((result, index) => {
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
                    <span className="sqp-result-name">{name}</span>
                    {verseKey && <span className="sqp-result-key">{verseKey}</span>}
                  </div>
                  {result.text && (
                    <p className="sqp-result-arabic" lang="ar" dir="rtl">{result.text}</p>
                  )}
                  {result.translation && (
                    <p className="sqp-result-translation">{result.translation}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
