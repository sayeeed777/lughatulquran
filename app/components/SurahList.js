"use client";

import { motion } from "framer-motion";
import SurahListSkeleton from "./skeletons/SurahListSkeleton";

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

export default function SurahList({
  surahs,
  filteredSurahs = [], // Default to empty array to prevent .map() error
  selectedSurah,
  query,
  setQuery,
  onSelectSurah,
  loading,
  onOpenSearch,
  onOpenSettings
}) {
  if (loading) {
    return (
      <aside className="panel surah-panel">
        <div className="surah-panel-header">
          <h2>Surahs</h2>
          {(onOpenSearch || onOpenSettings) && (
            <div className="topbar-icon-btns mobile-only">
              {onOpenSearch && (
                <button
                  className="header-icon-btn"
                  onClick={onOpenSearch}
                  aria-label="Search"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              )}
              {onOpenSettings && (
                <button
                  className="header-icon-btn"
                  onClick={onOpenSettings}
                  aria-label="Settings"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            value=""
            disabled
            readOnly
          />
        </div>
        <SurahListSkeleton />
      </aside>
    );
  }

  return (
    <aside className="panel surah-panel">
      <div className="surah-panel-header">
        <h2>Surahs</h2>
        {(onOpenSearch || onOpenSettings) && (
          <div className="topbar-icon-btns mobile-only">
            {onOpenSearch && (
              <button
                className="header-icon-btn"
                onClick={onOpenSearch}
                aria-label="Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            )}
            {onOpenSettings && (
              <button
                className="header-icon-btn"
                onClick={onOpenSettings}
                aria-label="Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <motion.ul
        className="surah-list"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filteredSurahs.map((surah) => (
          <motion.li key={surah.number} variants={item}>
            <button
              className={`surah-item${selectedSurah?.number === surah.number ? " active" : ""
                }`}
              onClick={() => onSelectSurah(surah)}
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
          </motion.li>
        ))}
      </motion.ul>
    </aside>
  );
}
