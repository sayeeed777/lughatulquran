"use client";

import { useMemo, useState } from "react";
import StudyQuickNotesSection from "./StudyQuickNotesSection";
import { SURAH_AYAH_COUNTS } from "../../lib/constants";
import type { DailyReading } from "../../lib/types";

type QuickPanelTab = "study" | "tool" | "tafsir" | "search" | "notes";

type VerseRef = {
  surah: number;
  ayah: number;
};

type PlanSummary =
  | null
  | { completed: true; dayIndex: number }
  | { error: string }
  | {
      dayIndex: number;
      startVerse: VerseRef | null;
      endVerse: VerseRef | null;
      todayStartIndex: number;
      todayEndIndex: number;
    };

type FontScale = {
  arabic: number;
  translation: number;
};

type ArabicFont = {
  id: string;
  label: string;
  css: string;
};

type Reciter = {
  id: string;
  label: string;
  baseUrl: string;
};

type SortedNote = {
  key: string;
  surah: number;
  ayah: number;
  value: string;
};

type TajweedLegendItem = {
  swatchClass: string;
  label: string;
  description: string;
};

type TafsirEdition = {
  id: string;
  label: string;
};

type SearchResult = {
  surah?: number;
  ayah?: number;
  text?: string;
  translation?: string;
};

type StudyQuickPanelContentProps = {
  tab: QuickPanelTab;
  readingTime: number;
  progress: number;
  sortedBookmarks: string[];
  sortedNotes: SortedNote[];
  goalTarget: number;
  goalProgress: number;
  setGoalPerDay: (value: number) => void;
  planSummary: PlanSummary;
  surahByNumber: Map<number, { englishName: string }>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onClosePanel: () => void;
  formatTime: (seconds: number) => string;
  showTranslation: boolean;
  setShowTranslation: (value: boolean) => void;
  showStudyTransliteration: boolean;
  setShowStudyTransliteration: (value: boolean) => void;
  dimNonFocused: boolean;
  setDimNonFocused: (value: boolean) => void;
  autoScrollPlaying: boolean;
  setAutoScrollPlaying: (value: boolean) => void;
  fontScale: FontScale;
  setFontScale: (value: FontScale | ((prev: FontScale) => FontScale)) => void;
  clamp: (value: number, min: number, max: number) => number;
  playbackRate: number;
  setPlaybackRate: (value: number) => void;
  arabicFonts: ArabicFont[];
  arabicFontId: string;
  setArabicFontId: (value: string) => void;
  reciters: Reciter[];
  reciterId: string;
  setReciterId: (value: string) => void;
  showTajweed: boolean;
  setShowTajweed: (value: boolean) => void;
  showTajweedLegend: boolean;
  setShowTajweedLegend: (value: boolean | ((prev: boolean) => boolean)) => void;
  showWordByWord: boolean;
  setShowWordByWord: (value: boolean) => void;
  isMushafView: boolean;
  setIsMushafView: (value: boolean) => void;
  scriptStyle: "uthmani" | "naskh";
  setScriptStyle: (value: "uthmani" | "naskh") => void;
  tajweedLegend: TajweedLegendItem[];
  tafsirEdition: string;
  tafsirEditions: readonly TafsirEdition[];
  onChangeTafsirEdition: (edition: string) => void;
  selectedSurahNumber: number;
  selectedSurahName: string;
  focusedAyahNumber: number;
  currentAyahIndex: number;
  onUseCurrentAyah: () => void;
  tafsirLoading: boolean;
  tafsirError: string | null;
  tafsirText: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  runSearch: () => void;
  searchLoading: boolean;
  searchError: string | null;
  searchHasRun: boolean;
  searchResults: SearchResult[];
  onOpenNote: (surah: number, ayah: number) => void;
  todayVersesRead: number;
  weekTotal: number;
  currentStreak: number;
  longestStreak: number;
  weeklyData: DailyReading[];
  surahProgress: Record<number, number[]>;
  hifzMarks: Record<string, true>;
  totalAyahs: number;
  markHifzRange: (surahNumber: number, startAyah: number, endAyah: number) => void;
  clearHifzSurah: (surahNumber: number, totalAyahs: number) => void;
};

export default function StudyQuickPanelContent({
  tab,
  readingTime,
  progress,
  sortedBookmarks,
  sortedNotes,
  goalTarget,
  goalProgress,
  setGoalPerDay,
  planSummary,
  surahByNumber,
  onJumpToAyah,
  onClosePanel,
  formatTime,
  showTranslation,
  setShowTranslation,
  showStudyTransliteration,
  setShowStudyTransliteration,
  dimNonFocused,
  setDimNonFocused,
  autoScrollPlaying,
  setAutoScrollPlaying,
  fontScale,
  setFontScale,
  clamp,
  playbackRate,
  setPlaybackRate,
  arabicFonts,
  arabicFontId,
  setArabicFontId,
  reciters,
  reciterId,
  setReciterId,
  showTajweed,
  setShowTajweed,
  showTajweedLegend,
  setShowTajweedLegend,
  showWordByWord,
  setShowWordByWord,
  isMushafView,
  setIsMushafView,
  scriptStyle,
  setScriptStyle,
  tajweedLegend,
  tafsirEdition,
  tafsirEditions,
  onChangeTafsirEdition,
  selectedSurahNumber,
  selectedSurahName,
  focusedAyahNumber,
  currentAyahIndex,
  onUseCurrentAyah,
  tafsirLoading,
  tafsirError,
  tafsirText,
  searchQuery,
  setSearchQuery,
  runSearch,
  searchLoading,
  searchError,
  searchHasRun,
  searchResults,
  onOpenNote,
  todayVersesRead,
  weekTotal,
  currentStreak,
  longestStreak,
  weeklyData,
  surahProgress,
  hifzMarks,
  totalAyahs,
  markHifzRange,
  clearHifzSurah
}: StudyQuickPanelContentProps) {
  const selectedTafsirLabel = useMemo(
    () =>
      tafsirEditions.find((edition) => edition.id === String(tafsirEdition))?.label
      || "Select tafsir edition",
    [tafsirEdition, tafsirEditions]
  );

  if (tab === "study") {
    return (
      <StudyTabContent
        readingTime={readingTime}
        progress={progress}
        sortedBookmarks={sortedBookmarks}
        sortedNotes={sortedNotes}
        goalTarget={goalTarget}
        goalProgress={goalProgress}
        setGoalPerDay={setGoalPerDay}
        planSummary={planSummary}
        surahByNumber={surahByNumber}
        onJumpToAyah={onJumpToAyah}
        onClosePanel={onClosePanel}
        formatTime={formatTime}
        todayVersesRead={todayVersesRead}
        weekTotal={weekTotal}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        weeklyData={weeklyData}
        surahProgress={surahProgress}
        hifzMarks={hifzMarks}
        selectedSurahNumber={selectedSurahNumber}
        selectedSurahName={selectedSurahName}
        totalAyahs={totalAyahs}
        markHifzRange={markHifzRange}
        clearHifzSurah={clearHifzSurah}
      />
    );
  }

  if (tab === "tool") {
    const activeToolCount = [
      showTranslation,
      showStudyTransliteration,
      dimNonFocused,
      autoScrollPlaying,
      showTajweed,
      showWordByWord,
      isMushafView
    ].filter(Boolean).length;
    const selectedReciterLabel =
      (reciters || []).find((reciter) => reciter.id === reciterId)?.label ||
      "Select reciter";

    return (
      <div className="quick-panel-section study-tool-section">
        <div className="study-card tool-block">
          <div className="tool-block-head">
            <h5>Reading Aids</h5>
            <span>Focus and visual helpers</span>
          </div>
          <div className="tool-toggle-grid">
            <label className="tool-toggle-card">
              <div className="tool-toggle-copy">
                <span className="tool-toggle-title">Show Translation</span>
                <span className="tool-toggle-sub">Keep translation visible under each ayah.</span>
              </div>
              <div className={`toggle-switch ${showTranslation ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={(event) => setShowTranslation(event.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </label>

            <label className="tool-toggle-card">
              <div className="tool-toggle-copy">
                <span className="tool-toggle-title">Show Transliteration</span>
                <span className="tool-toggle-sub">Display transliteration only in Study mode.</span>
              </div>
              <div className={`toggle-switch ${showStudyTransliteration ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={showStudyTransliteration}
                  onChange={(event) => setShowStudyTransliteration(event.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </label>

            <label className="tool-toggle-card">
              <div className="tool-toggle-copy">
                <span className="tool-toggle-title">Dim Other Ayahs</span>
                <span className="tool-toggle-sub">Highlight the focused ayah during study.</span>
              </div>
              <div className={`toggle-switch ${dimNonFocused ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={dimNonFocused}
                  onChange={(event) => setDimNonFocused(event.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </label>

            <label className="tool-toggle-card">
              <div className="tool-toggle-copy">
                <span className="tool-toggle-title">Auto-scroll on Play</span>
                <span className="tool-toggle-sub">Follow recitation while ayahs advance.</span>
              </div>
              <div className={`toggle-switch ${autoScrollPlaying ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={autoScrollPlaying}
                  onChange={(event) => setAutoScrollPlaying(event.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </label>

            <label className="tool-toggle-card">
              <div className="tool-toggle-copy">
                <span className="tool-toggle-title">Tajweed Colors</span>
                <span className="tool-toggle-sub">Show tajweed highlights in Arabic text.</span>
              </div>
              <div className={`toggle-switch ${showTajweed ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={showTajweed}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setShowTajweed(next);
                    if (!next) {
                      setShowTajweedLegend(false);
                    }
                  }}
                />
                <span className="toggle-slider" />
              </div>
            </label>

            <label className="tool-toggle-card">
              <div className="tool-toggle-copy">
                <span className="tool-toggle-title">Word by Word</span>
                <span className="tool-toggle-sub">Enable word chips and word-level audio.</span>
              </div>
              <div className={`toggle-switch ${showWordByWord ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={showWordByWord}
                  onChange={(event) => setShowWordByWord(event.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </label>

            <label className="tool-toggle-card">
              <div className="tool-toggle-copy">
                <span className="tool-toggle-title">Mushaf View</span>
                <span className="tool-toggle-sub">Use a cleaner page-like reading layout.</span>
              </div>
              <div className={`toggle-switch ${isMushafView ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={isMushafView}
                  onChange={(event) => setIsMushafView(event.target.checked)}
                />
                <span className="toggle-slider" />
              </div>
            </label>
          </div>
        </div>

        {showTajweed && (
          <div className="study-card tool-block">
            <button
              className="tool-toggle tool-legend-btn"
              type="button"
              onClick={() => setShowTajweedLegend((prev) => !prev)}
            >
              <span>Tajweed color key</span>
              <span className="tool-legend-chevron" aria-hidden="true">
                {showTajweedLegend ? "▾" : "▸"}
              </span>
            </button>
            {showTajweedLegend && (
              <div className="tajweed-legend" role="note" aria-label="Tajweed color key">
                <p className="tajweed-legend-hint">
                  Counts are beats (harakah). This is a quick visual guide, not a full tajweed lesson.
                </p>
                <ul className="tajweed-legend-list">
                  {tajweedLegend.map((item) => (
                    <li key={item.swatchClass} className="tajweed-legend-item">
                      <span
                        className={`tajweed-swatch tajweed ${item.swatchClass}`}
                        aria-hidden="true"
                      >
                        Aa
                      </span>
                      <div className="tajweed-legend-text">
                        <span className="tajweed-legend-label">{item.label}</span>
                        <span className="tajweed-legend-desc">{item.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="study-card tool-block">
          <div className="tool-block-head">
            <h5>Typography and Audio</h5>
            <span>Text scale and playback speed</span>
          </div>

          <div className="tool-slider-stack">
            <div className="tool-slider-row">
              <div className="tool-slider-head">
                <span className="tool-slider-label">Arabic Size</span>
                <span className="tool-slider-value">{Math.round((fontScale?.arabic || 1) * 100)}%</span>
              </div>
              <div className="tool-slider-track">
                <progress
                  className="tool-slider-fill"
                  max={100}
                  value={Math.max(0, Math.min(100, (((fontScale?.arabic || 1) - 0.6) / 1.4) * 100))}
                  aria-hidden="true"
                />
                <input
                  className="tool-slider-input"
                  type="range"
                  min="0.6"
                  max="2"
                  step="0.05"
                  value={fontScale?.arabic || 1}
                  onChange={(event) =>
                    setFontScale((prev) => ({
                      ...prev,
                      arabic: clamp(Number(event.target.value), 0.6, 2)
                    }))
                  }
                />
              </div>
            </div>

            <div className="tool-slider-row">
              <div className="tool-slider-head">
                <span className="tool-slider-label">Translation Size</span>
                <span className="tool-slider-value">
                  {Math.round((fontScale?.translation || 1) * 100)}%
                </span>
              </div>
              <div className="tool-slider-track">
                <progress
                  className="tool-slider-fill"
                  max={100}
                  value={Math.max(0, Math.min(100, (((fontScale?.translation || 1) - 0.7) / 0.9) * 100))}
                  aria-hidden="true"
                />
                <input
                  className="tool-slider-input"
                  type="range"
                  min="0.7"
                  max="1.6"
                  step="0.05"
                  value={fontScale?.translation || 1}
                  onChange={(event) =>
                    setFontScale((prev) => ({
                      ...prev,
                      translation: clamp(Number(event.target.value), 0.7, 1.6)
                    }))
                  }
                />
              </div>
            </div>

            <div className="tool-slider-row">
              <div className="tool-slider-head">
                <span className="tool-slider-label">Playback Speed</span>
                <span className="tool-slider-value">{playbackRate.toFixed(2)}x</span>
              </div>
              <div className="tool-slider-track">
                <progress
                  className="tool-slider-fill"
                  max={100}
                  value={Math.max(0, Math.min(100, ((playbackRate - 0.75) / 0.5) * 100))}
                  aria-hidden="true"
                />
                <input
                  className="tool-slider-input"
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={playbackRate}
                  onChange={(event) => setPlaybackRate(Number(event.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="study-card tool-block">
          <div className="tool-block-head">
            <h5>Script and Font</h5>
            <span>Choose Arabic rendering style</span>
          </div>
          <div className="tool-script-grid">
            <div className="tool-section">
              <span className="tool-label">Script</span>
              <div className="tool-buttons">
                <button
                  className={`control-btn${scriptStyle === "uthmani" ? " primary" : ""}`}
                  onClick={() => setScriptStyle("uthmani")}
                  type="button"
                >
                  Uthmani
                </button>
                <button
                  className={`control-btn${scriptStyle === "naskh" ? " primary" : ""}`}
                  onClick={() => setScriptStyle("naskh")}
                  type="button"
                >
                  Naskh
                </button>
              </div>
            </div>

            <label className="tool-section tool-select-wrap">
              <span className="tool-label">Arabic Font</span>
              <select
                className="study-select"
                value={arabicFontId}
                onChange={(event) => setArabicFontId(event.target.value)}
              >
                {(arabicFonts || []).map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="study-card tool-block">
          <div className="tool-block-head">
            <h5>Reciter</h5>
            <span>Set your default recitation voice</span>
          </div>
          <div className="tool-reciter-select-shell">
            <span className="tool-reciter-caption">Current</span>
            <div className="tool-reciter-select-field">
              <span className="tool-reciter-selected">{selectedReciterLabel}</span>
              <span className="tool-reciter-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <select
                className="tool-reciter-select-native"
                value={reciterId}
                onChange={(event) => setReciterId(event.target.value)}
                aria-label="Reciter"
              >
                {(reciters || []).map((reciter) => (
                  <option key={reciter.id} value={reciter.id}>
                    {reciter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "tafsir") {
    return (
      <div className="quick-panel-section">
        <div className="study-card tafsir-card">
          <div className="tafsir-controls">
            <div className="tafsir-edition-shell">
              <div className="tafsir-edition-head">
                <span className="tool-label">Tafsir Edition</span>
                <span className="tafsir-edition-action">Tap to change</span>
              </div>
              <div className="tafsir-edition-field">
                <span className="tafsir-edition-selected">{selectedTafsirLabel}</span>
                <span className="tafsir-edition-chevron" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
                <select
                  className="tafsir-edition-native"
                  value={String(tafsirEdition)}
                  onChange={(event) => {
                    onChangeTafsirEdition(event.target.value);
                  }}
                  aria-label="Choose tafsir edition"
                >
                  {tafsirEditions.map((edition) => (
                    <option key={edition.id} value={edition.id}>
                      {edition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tafsir-meta">
              <span className="meta">
                {selectedSurahName || "Surah"} · Ayah {focusedAyahNumber || currentAyahIndex || 1}
              </span>
              {selectedSurahNumber > 0 && currentAyahIndex > 0 && (
                <button className="quick-item-action" onClick={onUseCurrentAyah} type="button">
                  Use current ayah
                </button>
              )}
            </div>
          </div>

          {tafsirLoading && <p className="status">Loading tafsir...</p>}
          {tafsirError && <p className="status error">{tafsirError}</p>}
          {!tafsirLoading && !tafsirError && (
            <div className="tafsir-text">
              {tafsirText || "No tafsir available for this ayah."}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tab === "search") {
    return (
      <div className="quick-panel-section">
        <div className="study-card search-card">
          <h4>Search the Quran</h4>
          <div className="search-row">
            <input
              type="text"
              placeholder="Keyword or topic"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
            />
            <button className="control-btn primary" onClick={runSearch} type="button">
              Search
            </button>
          </div>
          {searchLoading && <p className="status">Searching...</p>}
          {searchError && <p className="status error">{searchError}</p>}
          {!searchLoading && !searchError && searchResults.length === 0 && (
            <p className="status">{searchHasRun ? "No results found." : "Type a keyword, then press Search."}</p>
          )}
          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map((result, index) => {
                const name = result.surah
                  ? surahByNumber?.get(result.surah)?.englishName || `Surah ${result.surah}`
                  : "Surah";
                const location = result.ayah ? `Ayah ${result.ayah}` : "";
                return (
                  <li key={`${result.surah}-${result.ayah}-${index}`}>
                    <div className="search-result-main">
                      <span className="search-result-title">
                        {name} {location}
                      </span>
                      <span className="search-result-text">
                        {result.translation || result.text || "Result"}
                      </span>
                    </div>
                    {result.surah && result.ayah && (
                      <button
                        className="quick-item-action"
                        onClick={() => {
                          onJumpToAyah(result.surah!, result.ayah!);
                          onClosePanel();
                        }}
                        type="button"
                      >
                        Go
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (tab === "notes") {
    return (
      <StudyQuickNotesSection
        sortedNotes={sortedNotes}
        surahByNumber={surahByNumber}
        onJumpToAyah={onJumpToAyah}
        onClosePanel={onClosePanel}
        onOpenNote={onOpenNote}
      />
    );
  }

  return null;
}

/* =============================================
   STUDY TAB — Apple HIG-aligned design
   ============================================= */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* #3 — Polished bar chart with rounded bars + visible empty track */
function WeeklyChart({ data }: { data: DailyReading[] }) {
  const maxVerses = Math.max(...data.map((d) => d.versesRead), 1);
  const today = getLocalDateString();

  return (
    <div className="qp-weekly-chart">
      <div className="qp-weekly-bars">
        {data.map((day) => {
          const height = day.versesRead > 0 ? Math.max((day.versesRead / maxVerses) * 100, 6) : 0;
          const dayOfWeek = new Date(day.date + "T12:00:00").getDay();
          const isToday = day.date === today;
          return (
            <div key={day.date} className={`qp-bar-col${isToday ? " today" : ""}`}>
              <span className="qp-bar-value">{day.versesRead || ""}</span>
              <div className="qp-bar-track">
                <div className="qp-bar-fill" style={{ height: `${height}%` }} />
              </div>
              <span className="qp-bar-label">{DAY_LABELS[dayOfWeek]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniRing({ progress, size = 34 }: { progress: number; size?: number }) {
  const sw = 3.5;
  const r = (size - sw) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (Math.min(progress, 100) / 100) * c;
  const center = size / 2;
  return (
    <svg width={size} height={size} className="qp-mini-ring">
      <circle className="qp-ring-bg" strokeWidth={sw} fill="transparent" r={r} cx={center} cy={center} />
      <circle
        className="qp-ring-fill"
        strokeWidth={sw}
        strokeLinecap="round"
        fill="transparent"
        r={r}
        cx={center}
        cy={center}
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}

/* #7 — Apple-style stepper (- value +) instead of raw number input */
function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="qp-stepper">
      <button
        className="qp-stepper-btn"
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className="qp-stepper-value">{value}</span>
      <button
        className="qp-stepper-btn"
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

type StudyTabProps = {
  readingTime: number;
  progress: number;
  sortedBookmarks: string[];
  sortedNotes: SortedNote[];
  goalTarget: number;
  goalProgress: number;
  setGoalPerDay: (value: number) => void;
  planSummary: PlanSummary;
  surahByNumber: Map<number, { englishName: string }>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onClosePanel: () => void;
  formatTime: (seconds: number) => string;
  todayVersesRead: number;
  weekTotal: number;
  currentStreak: number;
  longestStreak: number;
  weeklyData: DailyReading[];
  surahProgress: Record<number, number[]>;
  hifzMarks: Record<string, true>;
  selectedSurahNumber: number;
  selectedSurahName: string;
  totalAyahs: number;
  markHifzRange: (surahNumber: number, startAyah: number, endAyah: number) => void;
  clearHifzSurah: (surahNumber: number, totalAyahs: number) => void;
};

function StudyTabContent({
  readingTime,
  progress,
  goalTarget,
  goalProgress,
  setGoalPerDay,
  planSummary,
  surahByNumber,
  onJumpToAyah,
  onClosePanel,
  formatTime,
  todayVersesRead,
  weekTotal,
  currentStreak,
  longestStreak,
  weeklyData,
  surahProgress,
  hifzMarks,
  selectedSurahNumber,
  selectedSurahName,
  totalAyahs,
  markHifzRange,
  clearHifzSurah
}: StudyTabProps) {
  const [showAllSurahs, setShowAllSurahs] = useState(false);
  const overallProgress = Math.max(0, Math.min(100, Math.round(progress)));

  const surahEntries = useMemo(() => {
    const items: { number: number; name: string; total: number; read: number; pct: number; memorized: number; memPct: number }[] = [];
    // Collect surahs that have reading progress OR memorization marks
    const surahNumbers = new Set<number>();
    for (const numStr of Object.keys(surahProgress)) surahNumbers.add(Number(numStr));
    if (hifzMarks) {
      for (const key of Object.keys(hifzMarks)) {
        const sNum = Number(key.split(":")[0]);
        if (sNum) surahNumbers.add(sNum);
      }
    }
    for (const num of surahNumbers) {
      const surah = surahByNumber.get(num);
      if (!surah) continue;
      const total = SURAH_AYAH_COUNTS[num - 1] || 0;
      if (!total) continue;
      const ayahs = surahProgress[num];
      const read = ayahs ? new Set(ayahs).size : 0;
      let memorized = 0;
      if (hifzMarks) {
        for (let i = 1; i <= total; i++) {
          if (hifzMarks[`${num}:${i}`]) memorized++;
        }
      }
      if (read === 0 && memorized === 0) continue;
      items.push({ number: num, name: surah.englishName, total, read, pct: Math.round((read / total) * 100), memorized, memPct: Math.round((memorized / total) * 100) });
    }
    return items.sort((a, b) => b.pct - a.pct);
  }, [surahProgress, surahByNumber, hifzMarks]);

  const almostDone = useMemo(
    () => surahEntries.filter((e) => e.pct >= 70 && e.pct < 100),
    [surahEntries]
  );

  const displayedSurahs = showAllSurahs ? surahEntries : surahEntries.slice(0, 4);
  const streakClass = currentStreak >= 7 ? "qp-streak-fire" : currentStreak >= 3 ? "qp-streak-warm" : "";
  const goalPct = goalTarget > 0 ? Math.min(100, Math.round((goalProgress / goalTarget) * 100)) : 0;

  // Hifz (memorization) stats
  const totalHifzCount = Object.keys(hifzMarks || {}).length;
  const TOTAL_QURAN_AYAHS = 6236;
  const hifzPct = Math.round((totalHifzCount / TOTAL_QURAN_AYAHS) * 100);
  const currentSurahHifzCount = useMemo(() => {
    if (!selectedSurahNumber || !hifzMarks) return 0;
    let count = 0;
    for (let i = 1; i <= totalAyahs; i++) {
      if (hifzMarks[`${selectedSurahNumber}:${i}`]) count++;
    }
    return count;
  }, [selectedSurahNumber, totalAyahs, hifzMarks]);
  const currentSurahHifzPct = totalAyahs > 0 ? Math.round((currentSurahHifzCount / totalAyahs) * 100) : 0;

  return (
    <div className="quick-panel-section qp-apple" data-overall-progress={overallProgress}>

      {/* #1 + #2 + #4 — Grouped container, 2x2 hero grid, large display numbers */}
      <div className="qp-group">
        <div className="qp-hero-grid">
          <div className="qp-hero-stat qp-stat-verses">
            <div className="qp-hero-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="qp-hero-value">{todayVersesRead}</span>
            <span className="qp-hero-label">Verses Today</span>
          </div>
          <div className="qp-hero-stat qp-stat-week">
            <div className="qp-hero-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <span className="qp-hero-value">{weekTotal}</span>
            <span className="qp-hero-label">This Week</span>
          </div>
          <div className={`qp-hero-stat qp-stat-streak ${streakClass}`}>
            <div className="qp-hero-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2c.5 4-2.5 6-2.5 10a4.5 4.5 0 0 0 9 0c0-4-3-6-2.5-10" />
                <path d="M12 18a2 2 0 0 1-2-2c0-1.5 2-3 2-3s2 1.5 2 3a2 2 0 0 1-2 2Z" />
              </svg>
            </div>
            <span className="qp-hero-value">{currentStreak}</span>
            <span className="qp-hero-label">Day Streak</span>
          </div>
          <div className="qp-hero-stat qp-stat-time">
            <div className="qp-hero-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span className="qp-hero-value">{formatTime(readingTime)}</span>
            <span className="qp-hero-label">Session</span>
          </div>
        </div>
      </div>

      {/* #3 — Polished weekly chart in its own group */}
      <div className="qp-group">
        <div className="qp-group-header">
          <h4>Weekly Activity</h4>
        </div>
        <WeeklyChart data={weeklyData} />
      </div>

      {/* Memorization (Hifz) Progress */}
      <div className="qp-group hifz-group">
        <div className="qp-group-header">
          <h4>Memorization</h4>
          <span className="hifz-total-badge">{totalHifzCount} / {TOTAL_QURAN_AYAHS}</span>
        </div>

        <div className="hifz-stats-row">
          <div className="hifz-stat">
            <MiniRing progress={hifzPct} />
            <div className="hifz-stat-text">
              <span className="hifz-stat-value">{hifzPct}%</span>
              <span className="hifz-stat-label">Overall</span>
            </div>
          </div>
          <div className="hifz-stat">
            <MiniRing progress={currentSurahHifzPct} />
            <div className="hifz-stat-text">
              <span className="hifz-stat-value">{currentSurahHifzCount}/{totalAyahs}</span>
              <span className="hifz-stat-label">{selectedSurahName || "Current"}</span>
            </div>
          </div>
        </div>

        {totalAyahs > 0 && (
          <div className="hifz-actions">
            {currentSurahHifzCount < totalAyahs ? (
              <button
                className="hifz-action-btn"
                type="button"
                onClick={() => markHifzRange(selectedSurahNumber, 1, totalAyahs)}
              >
                Mark all {totalAyahs} ayahs as memorized
              </button>
            ) : (
              <button
                className="hifz-action-btn hifz-action-clear"
                type="button"
                onClick={() => clearHifzSurah(selectedSurahNumber, totalAyahs)}
              >
                Clear memorization for this surah
              </button>
            )}
          </div>
        )}
      </div>

      {/* #1 + #7 + #10 — Grouped: goal stepper + progress in one block, no redundant label */}
      {/* Surah progress */}
      {surahEntries.length > 0 && (
        <div className="qp-group">
          <div className="qp-group-header">
            <h4>Surah Progress</h4>
            {surahEntries.length > 4 && (
              <button className="qp-see-all" onClick={() => setShowAllSurahs(!showAllSurahs)} type="button">
                {showAllSurahs ? "Less" : "See All"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={showAllSurahs ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
                </svg>
              </button>
            )}
          </div>

          {almostDone.length > 0 && (
            <div className="qp-almost-banner">
              <svg className="qp-almost-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="qp-almost-text">
                {almostDone.slice(0, 2).map((s) => s.name).join(" & ")}
                {almostDone.length > 2 ? ` +${almostDone.length - 2}` : ""}
                {" — almost complete"}
              </span>
            </div>
          )}

          <div className="qp-surah-list">
            {displayedSurahs.map((entry) => (
              <div key={entry.number} className="qp-surah-row">
                <MiniRing progress={entry.pct} />
                <div className="qp-surah-info">
                  <span className="qp-surah-name">{entry.number}. {entry.name}</span>
                  <span className="qp-surah-detail">
                    {entry.read}/{entry.total} read
                    {entry.memorized > 0 && (
                      <span className="qp-surah-hifz-detail"> · {entry.memorized} memorized</span>
                    )}
                  </span>
                </div>
                <div className="qp-surah-badges">
                  {entry.memorized > 0 && (
                    <span className={`qp-surah-mem-pct${entry.memPct === 100 ? " done" : ""}`}>
                      {entry.memPct === 100 ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12l2 2 4-4" />
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      ) : `${entry.memPct}%`}
                    </span>
                  )}
                  <span className={`qp-surah-pct${entry.pct === 100 ? " done" : ""}`}>
                    {entry.pct === 100 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : `${entry.pct}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Goal */}
      <div className="qp-group">
        <div className="qp-group-header">
          <h4>Daily Goal</h4>
        </div>
        <div className="qp-goal-row">
          <div className="qp-goal-info">
            <span className="qp-goal-fraction">{goalProgress}<span className="qp-goal-of">/{goalTarget}</span></span>
            <span className="qp-goal-sublabel">ayahs read</span>
          </div>
          <Stepper value={goalTarget} min={1} max={200} onChange={setGoalPerDay} />
        </div>
        <div className="qp-goal-bar">
          <div className="qp-goal-bar-fill" style={{ width: `${goalPct}%` }} />
        </div>
        {currentStreak > 0 && (
          <p className="qp-streak-msg">
            {currentStreak >= 7
              ? `${currentStreak}-day streak — longest: ${longestStreak}`
              : currentStreak >= 3
                ? `${currentStreak}-day streak`
                : `${currentStreak} day streak`}
          </p>
        )}
      </div>

      {/* Today's Plan */}
      {planSummary && !("completed" in planSummary) && !("error" in planSummary) && (
        <div className="qp-group">
          <div className="qp-group-header">
            <h4>Today&apos;s Plan</h4>
          </div>
          <p className="plan-range-text">
            {planSummary.startVerse && planSummary.endVerse
              ? `${surahByNumber?.get(planSummary.startVerse.surah)?.englishName || "Surah"} ${planSummary.startVerse.ayah} — ${surahByNumber?.get(planSummary.endVerse.surah)?.englishName || "Surah"} ${planSummary.endVerse.ayah}`
              : "Set up your reading plan"}
          </p>
          {planSummary.startVerse && (
            <button
              className="plan-jump-btn"
              onClick={() => {
                onJumpToAyah(planSummary.startVerse!.surah, planSummary.startVerse!.ayah);
                onClosePanel();
              }}
              type="button"
            >
              Start Reading
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export type { QuickPanelTab, StudyQuickPanelContentProps };
