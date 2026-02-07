"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Surah } from "../../lib/types";
import { SurahListSkeleton } from "../skeletons";
import { InlineError } from "../common";

type SurahListProps = {
  surahs: Surah[];
  filteredSurahs?: Surah[];
  selectedSurah: Surah | null;
  query?: string;
  setQuery?: (value: string) => void;
  onSelectSurah: (surah: Surah) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  onToggleTheme?: () => void;
  theme?: "light" | "dark";
};

// Move animation objects outside component to prevent recreation on every render
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

function SurahList({
  surahs,
  filteredSurahs = [], // Default to empty array to prevent .map() error
  selectedSurah,
  query,
  setQuery,
  onSelectSurah,
  loading,
  error,
  onRetry,
  onOpenSearch,
  onOpenSettings,
  onToggleTheme,
  theme
}: SurahListProps) {
  const isLightTheme = theme === "light";
  if (loading) {
    return (
      <aside className="panel surah-panel">
        <div className="surah-panel-header">
          <h2>Surahs</h2>
          {(onOpenSearch || onOpenSettings || onToggleTheme) && (
            <div className="topbar-icon-btns mobile-only">
              {onOpenSearch && (
                <button className="header-icon-btn" onClick={onOpenSearch} aria-label="Search">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              )}
              {onToggleTheme && (
                <button
                  className="header-icon-btn"
                  onClick={onToggleTheme}
                  aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {isLightTheme ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m4.93 19.07 1.41-1.41" />
                      <path d="m17.66 6.34 1.41-1.41" />
                    </svg>
                  )}
                </button>
              )}
              {onOpenSettings && (
                <button className="header-icon-btn" onClick={onOpenSettings} aria-label="Settings">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="surah-search-wrapper">
          <input className="search" placeholder="Search surahs…" value="" disabled readOnly />
        </div>
        <SurahListSkeleton />
      </aside>
    );
  }

  return (
    <aside className="panel surah-panel">
      <div className="surah-panel-header">
        <h2>Surahs</h2>
        {(onOpenSearch || onOpenSettings || onToggleTheme) && (
          <div className="topbar-icon-btns mobile-only">
            {onOpenSearch && (
              <button className="header-icon-btn" onClick={onOpenSearch} aria-label="Search">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            )}
            {onToggleTheme && (
              <button
                className="header-icon-btn"
                onClick={onToggleTheme}
                aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
              >
                {isLightTheme ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m4.93 19.07 1.41-1.41" />
                    <path d="m17.66 6.34 1.41-1.41" />
                  </svg>
                )}
              </button>
            )}
            {onOpenSettings && (
              <button className="header-icon-btn" onClick={onOpenSettings} aria-label="Settings">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="surah-search-wrapper">
        <input
          className="search"
          placeholder="Search surahs…"
          value={query || ""}
          onChange={(event) => setQuery?.(event.target.value)}
        />
      </div>
      {error && (
        <InlineError title="Surahs unavailable" message={error} onRetry={onRetry} compact />
      )}
      <motion.ul className="surah-list" variants={container} initial="hidden" animate="show">
        {filteredSurahs.map((surah) => (
          <motion.li key={surah.number} variants={item}>
            <button
              className={`surah-item${selectedSurah?.number === surah.number ? " active" : ""}`}
              onClick={() => onSelectSurah(surah)}
            >
              <span className="surah-number">{surah.number}</span>
              <span className="surah-names">
                <span className="surah-english">{surah.englishName}</span>
                <span className="surah-translation">{surah.englishNameTranslation}</span>
              </span>
              <span className="surah-arabic" lang="ar" dir="rtl">
                {surah.name}
              </span>
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </aside>
  );
}

export default memo(SurahList);
