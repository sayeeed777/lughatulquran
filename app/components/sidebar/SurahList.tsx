"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Surah } from "../../lib/types";
import { SurahListSkeleton } from "../skeletons";
import { InlineError, SettingsIcon, ClockIcon, ThemeChooser } from "../common";

type SurahListProps = {
  filteredSurahs?: Surah[];
  selectedSurah: Surah | null;
  query?: string;
  setQuery?: (value: string) => void;
  onSelectSurah: (surah: Surah) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenPrayer?: () => void;
  onOpenSettings?: () => void;
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
  filteredSurahs = [], // Default to empty array to prevent .map() error
  selectedSurah,
  query,
  setQuery,
  onSelectSurah,
  loading,
  error,
  onRetry,
  onOpenPrayer,
  onOpenSettings
}: SurahListProps) {

  if (loading) {
    return (
      <aside className="panel surah-panel">
        <div className="surah-panel-header">
          <h2>Surahs</h2>
          {(onOpenPrayer || onOpenSettings) && (
            <div className="surah-header-actions">
              <div className="topbar-icon-btns surah-icon-btns">
                {onOpenPrayer && (
                  <button className="header-icon-btn" onClick={onOpenPrayer} aria-label="Prayer times">
                    <ClockIcon />
                  </button>
                )}
                <ThemeChooser />
                {onOpenSettings && (
                  <button className="header-icon-btn" onClick={onOpenSettings} aria-label="Settings">
                    <SettingsIcon />
                  </button>
                )}
              </div>
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
        {(onOpenPrayer || onOpenSettings) && (
          <div className="surah-header-actions">
            <div className="topbar-icon-btns surah-icon-btns">
              {onOpenPrayer && (
                  <button className="header-icon-btn" onClick={onOpenPrayer} aria-label="Prayer times">
                    <ClockIcon />
                  </button>
              )}
              <ThemeChooser />
              {onOpenSettings && (
                <button className="header-icon-btn" onClick={onOpenSettings} aria-label="Settings">
                  <SettingsIcon />
                </button>
              )}
            </div>
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
