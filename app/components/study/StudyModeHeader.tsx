"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ProgressRing } from "./StudyComponents";
import type { Surah } from "../../lib/types";

type StudyModeHeaderProps = {
  showControls: boolean;
  onExit: () => void;
  isSurahScope: boolean;
  isPageScope: boolean;
  surahs: Surah[];
  selectedSurah: Surah | null;
  activeScopeLabel: string;
  activeScopeMeta: string;
  studyPageNumber: number;
  setStudyPageNumber: (value: number) => void;
  studyJuzNumber: number;
  setStudyJuzNumber: (value: number) => void;
  jumpToStudyAyah: (surah: number, ayah: number) => void;
  progress: number;
  readingTime: number;
  formatTime: (seconds: number) => string;
};

type ScopePickerProps = {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
};

function ScopePicker({ label, value, max, onChange }: ScopePickerProps) {
  return (
    <div className="study-scope-nav">
      <button
        type="button"
        className="study-scope-nav-btn"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={`Previous ${label.toLowerCase()}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M15 18l-6-6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="study-scope-nav-select">
        <h1 className="study-surah-name">
          {label} {value}
          <svg
            className="study-surah-picker-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </h1>
        <select
          className="study-surah-picker-native"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={`Choose ${label.toLowerCase()}`}
        >
          {Array.from({ length: max }, (_, index) => {
            const optionValue = index + 1;
            return (
              <option key={optionValue} value={optionValue}>
                {label} {optionValue}
              </option>
            );
          })}
        </select>
      </div>
      <button
        type="button"
        className="study-scope-nav-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Next ${label.toLowerCase()}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default function StudyModeHeader({
  showControls,
  onExit,
  isSurahScope,
  isPageScope,
  surahs,
  selectedSurah,
  activeScopeLabel,
  activeScopeMeta,
  studyPageNumber,
  setStudyPageNumber,
  studyJuzNumber,
  setStudyJuzNumber,
  jumpToStudyAyah,
  progress,
  readingTime,
  formatTime
}: StudyModeHeaderProps) {
  return (
    <AnimatePresence>
      {showControls && (
        <motion.header
          className="study-header"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="study-header-left">
            <button className="study-back-btn" onClick={onExit} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="study-surah-info">
              {isSurahScope ? (
                <div className="study-surah-picker">
                  <h1 className="study-surah-name">
                    {selectedSurah?.englishName}
                    <svg
                      className="study-surah-picker-icon"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </h1>
                  <select
                    className="study-surah-picker-native"
                    value={selectedSurah?.number || 1}
                    onChange={(event) => {
                      const surahNumber = Number(event.target.value);
                      if (surahNumber && surahNumber !== selectedSurah?.number) {
                        jumpToStudyAyah(surahNumber, 1);
                      }
                    }}
                    aria-label="Choose surah"
                  >
                    {surahs.map((surah) => (
                      <option key={surah.number} value={surah.number}>
                        {surah.number}. {surah.englishName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : isPageScope ? (
                <ScopePicker
                  label="Page"
                  value={studyPageNumber}
                  max={604}
                  onChange={setStudyPageNumber}
                />
              ) : (
                <ScopePicker label="Juz" value={studyJuzNumber} max={30} onChange={setStudyJuzNumber} />
              )}
              <span className="study-surah-meta">{isSurahScope ? activeScopeMeta : `${activeScopeLabel} · ${activeScopeMeta}`}</span>
            </div>
          </div>

          <div className="study-header-center">
            <div className="study-progress-indicator">
              <ProgressRing progress={progress} size={48} />
              <span className="progress-text">{progress}%</span>
            </div>
          </div>

          <div className="study-header-right">
            <div className="study-reading-time">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{formatTime(readingTime)}</span>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
