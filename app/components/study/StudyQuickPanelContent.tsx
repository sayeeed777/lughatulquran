"use client";

import { ProgressBar } from "../common";
import { StatCard } from "./StudyComponents";

type QuickPanelTab = "study" | "settings" | "tools" | "tafsir" | "search" | "notes";

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
  searchResults: SearchResult[];
  onOpenNote: (surah: number, ayah: number) => void;
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
  searchResults,
  onOpenNote
}: StudyQuickPanelContentProps) {
  if (tab === "study") {
    return (
      <div className="quick-panel-section">
        <div className="study-card">
          <h4>Overview</h4>
          <div className="quick-stats-grid">
            <StatCard
              label="Reading Time"
              value={formatTime(readingTime)}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
              color="var(--accent)"
            />
            <StatCard
              label="Progress"
              value={`${progress}%`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              }
              color="var(--accent-2)"
            />
            <StatCard
              label="Bookmarks"
              value={sortedBookmarks?.length || 0}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
              }
              color="#f59e0b"
            />
            <StatCard
              label="Notes"
              value={sortedNotes?.length || 0}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              }
              color="#8b5cf6"
            />
          </div>
        </div>

        <div className="study-card quick-goal">
          <h4>Daily Goal</h4>
          <div className="goal-controls">
            <label className="goal-label">Ayahs per day</label>
            <input
              type="number"
              min={1}
              max={200}
              value={goalTarget}
              onChange={(event) => setGoalPerDay(Number(event.target.value) || 1)}
            />
          </div>
          <ProgressBar
            current={goalProgress}
            total={goalTarget}
            label={`${goalProgress}/${goalTarget} ayahs`}
          />
        </div>

        {planSummary && !("completed" in planSummary) && !("error" in planSummary) && (
          <div className="study-card quick-plan-today">
            <h4>Today's Plan</h4>
            <p className="plan-range-text">
              {planSummary.startVerse && planSummary.endVerse
                ? `${surahByNumber?.get(planSummary.startVerse.surah)?.englishName || "Surah"} ${planSummary.startVerse.ayah} - ${surahByNumber?.get(planSummary.endVerse.surah)?.englishName || "Surah"} ${planSummary.endVerse.ayah}`
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

  if (tab === "settings") {
    return (
      <div className="quick-panel-section study-settings-premium">
        <div className="study-settings-group study-card">
          <h4 className="study-settings-title">Display</h4>
          <div className="study-toggle-list">
            <label className="study-premium-toggle">
              <div className="toggle-info">
                <span className="toggle-icon">📖</span>
                <span className="toggle-label">Show Translation</span>
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
            <label className="study-premium-toggle">
              <div className="toggle-info">
                <span className="toggle-icon">🌙</span>
                <span className="toggle-label">Dim Other Ayahs</span>
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
            <label className="study-premium-toggle">
              <div className="toggle-info">
                <span className="toggle-icon">⬇️</span>
                <span className="toggle-label">Auto-scroll on Play</span>
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
          </div>
        </div>

        <div className="study-settings-group study-card">
          <h4 className="study-settings-title">Text Size</h4>
          <div className="study-premium-sliders">
            <div className="study-premium-slider">
              <div className="slider-row">
                <span className="slider-icon-box">ع</span>
                <span className="slider-name">Arabic</span>
                <span className="slider-val">{Math.round((fontScale?.arabic || 1) * 100)}%</span>
              </div>
              <div className="slider-track-wrap">
                <div
                  className="slider-track-fill"
                  style={{ width: `${(((fontScale?.arabic || 1) - 0.6) / 1.4) * 100}%` }}
                />
                <input
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
            <div className="study-premium-slider">
              <div className="slider-row">
                <span className="slider-icon-box">A</span>
                <span className="slider-name">Translation</span>
                <span className="slider-val">{Math.round((fontScale?.translation || 1) * 100)}%</span>
              </div>
              <div className="slider-track-wrap">
                <div
                  className="slider-track-fill"
                  style={{ width: `${(((fontScale?.translation || 1) - 0.7) / 0.9) * 100}%` }}
                />
                <input
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
          </div>
        </div>

        <div className="study-settings-group study-card">
          <h4 className="study-settings-title">Playback</h4>
          <div className="study-premium-slider">
            <div className="slider-row">
              <span className="slider-icon-box">⏱</span>
              <span className="slider-name">Speed</span>
              <span className="slider-val">{playbackRate.toFixed(2)}x</span>
            </div>
            <div className="slider-track-wrap">
              <div
                className="slider-track-fill"
                style={{ width: `${((playbackRate - 0.75) / 0.5) * 100}%` }}
              />
              <input
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

        <div className="study-settings-group study-card">
          <h4 className="study-settings-title">Arabic Font</h4>
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
        </div>

        <div className="study-settings-group study-card">
          <h4 className="study-settings-title">Reciter</h4>
          <div className="study-reciter-grid">
            {(reciters || []).map((reciter) => (
              <button
                key={reciter.id}
                className={`study-reciter-chip ${reciterId === reciter.id ? "selected" : ""}`}
                onClick={() => setReciterId(reciter.id)}
                type="button"
              >
                <span className="reciter-avatar-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                </span>
                <span className="reciter-chip-name">{reciter.label}</span>
                {reciterId === reciter.id && (
                  <span className="reciter-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === "tools") {
    return (
      <div className="quick-panel-section">
        <div className="study-card tools-card">
          <h4>Study Tools</h4>
          <div className="tool-grid">
            <label className="tool-toggle">
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
              <span>Tajweed Colors</span>
            </label>
            <label className="tool-toggle">
              <input
                type="checkbox"
                checked={showWordByWord}
                onChange={(event) => setShowWordByWord(event.target.checked)}
              />
              <span>Word by Word Audio</span>
            </label>
            <label className="tool-toggle">
              <input
                type="checkbox"
                checked={isMushafView}
                onChange={(event) => setIsMushafView(event.target.checked)}
              />
              <span>Mushaf View</span>
            </label>
          </div>
          {showTajweed && (
            <>
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
            </>
          )}
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
        </div>
      </div>
    );
  }

  if (tab === "tafsir") {
    return (
      <div className="quick-panel-section">
        <div className="study-card tafsir-card">
          <h4>Tafsir</h4>
          <div className="tafsir-controls">
            <label className="tafsir-field">
              <span className="tool-label">Edition</span>
              <select
                className="study-select"
                value={String(tafsirEdition)}
                onChange={(event) => {
                  onChangeTafsirEdition(event.target.value);
                }}
              >
                {tafsirEditions.map((edition) => (
                  <option key={edition.id} value={edition.id}>
                    {edition.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="tafsir-meta">
              <span className="meta">
                {selectedSurahName || "Surah"} · Ayah {focusedAyahNumber || currentAyahIndex || 1}
              </span>
              {selectedSurahNumber > 0 && currentAyahIndex > 0 && (
                <button className="quick-item-action" onClick={onUseCurrentAyah} type="button">
                  Use current
                </button>
              )}
            </div>
          </div>

          {tafsirLoading && <p className="status">Loading tafsir...</p>}
          {tafsirError && <p className="status error">{tafsirError}</p>}
          {!tafsirLoading && !tafsirError && (
            <div className="tafsir-text">
              {tafsirText ? tafsirText : "No tafsir available for this ayah."}
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
            <p className="status">No results yet.</p>
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
      <div className="quick-panel-section">
        <div className="study-card notes-card">
          {sortedNotes?.length > 0 ? (
            <ul className="quick-list">
              {sortedNotes.map((note) => {
                const name = surahByNumber?.get(note.surah)?.englishName || `Surah ${note.surah}`;
                const preview = note.value.length > 60 ? `${note.value.slice(0, 60)}...` : note.value;
                return (
                  <li key={note.key} className="quick-list-item">
                    <div className="quick-item-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                    <div className="quick-item-content">
                      <span className="quick-item-title">
                        {name} - Ayah {note.ayah}
                      </span>
                      <span className="quick-item-sub">{preview}</span>
                    </div>
                    <button
                      className="quick-item-action"
                      onClick={() => {
                        onOpenNote(note.surah, note.ayah);
                        onClosePanel();
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="quick-item-action"
                      onClick={() => {
                        onJumpToAyah(note.surah, note.ayah);
                        onOpenNote(note.surah, note.ayah);
                        onClosePanel();
                      }}
                      type="button"
                    >
                      Open
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="quick-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <p>No notes yet</p>
              <span>Tap the note icon on any ayah to add thoughts</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export type { QuickPanelTab, StudyQuickPanelContentProps };
