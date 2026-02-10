"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Surah } from "../../lib/types";
import { SurahListSkeleton } from "../skeletons";
import { InlineError, SearchIcon, ThemeIcon, SettingsIcon } from "../common";

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
                  <SearchIcon />
                </button>
              )}
              {onToggleTheme && (
                <button
                  className="header-icon-btn"
                  onClick={onToggleTheme}
                  aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
                >
                  <ThemeIcon isLight={isLightTheme} />
                </button>
              )}
              {onOpenSettings && (
                <button className="header-icon-btn" onClick={onOpenSettings} aria-label="Settings">
                  <SettingsIcon />
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
                <SearchIcon />
              </button>
            )}
            {onToggleTheme && (
              <button
                className="header-icon-btn"
                onClick={onToggleTheme}
                aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
              >
                <ThemeIcon isLight={isLightTheme} />
              </button>
            )}
            {onOpenSettings && (
              <button className="header-icon-btn" onClick={onOpenSettings} aria-label="Settings">
                <SettingsIcon />
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
