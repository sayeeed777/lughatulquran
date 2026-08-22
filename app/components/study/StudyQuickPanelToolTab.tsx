"use client";

import type { StudyQuickPanelContentProps } from "./StudyQuickPanelTypes";

type StudyQuickPanelToolTabProps = Pick<
  StudyQuickPanelContentProps,
  | "showTranslation"
  | "setShowTranslation"
  | "studyScopeMode"
  | "setStudyScopeMode"
  | "studyJuzNumber"
  | "setStudyJuzNumber"
  | "studyPageNumber"
  | "setStudyPageNumber"
  | "showStudyTransliteration"
  | "setShowStudyTransliteration"
  | "dimNonFocused"
  | "setDimNonFocused"
  | "autoScrollPlaying"
  | "setAutoScrollPlaying"
  | "fontScale"
  | "setFontScale"
  | "clamp"
  | "playbackRate"
  | "setPlaybackRate"
  | "arabicFonts"
  | "arabicFontId"
  | "setArabicFontId"
  | "reciters"
  | "reciterId"
  | "setReciterId"
  | "showTajweed"
  | "setShowTajweed"
  | "showTajweedLegend"
  | "setShowTajweedLegend"
  | "showHifzMode"
  | "setShowHifzMode"
  | "showWordByWord"
  | "setShowWordByWord"
  | "isMushafView"
  | "setIsMushafView"
  | "scriptStyle"
  | "setScriptStyle"
  | "tajweedLegend"
>;

type ToggleCardProps = {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleCard({ title, subtitle, checked, onChange }: ToggleCardProps) {
  return (
    <label className="tool-toggle-card">
      <div className="tool-toggle-copy">
        <span className="tool-toggle-title">{title}</span>
        <span className="tool-toggle-sub">{subtitle}</span>
      </div>
      <div className={`toggle-switch ${checked ? "active" : ""}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="toggle-slider" />
      </div>
    </label>
  );
}

type ScopeNavProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function ScopeNav({ label, value, min, max, onChange }: ScopeNavProps) {
  return (
    <div className="tool-section tool-nav-row">
      <span className="tool-label">{label}</span>
      <div className="tool-nav-picker">
        <button
          type="button"
          className="tool-nav-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Previous ${label.toLowerCase()}`}
          title={`Previous ${label.toLowerCase()}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <label className="tool-select-wrap">
          <select className="study-select" value={value} onChange={(event) => onChange(Number(event.target.value))}>
            {Array.from({ length: max - min + 1 }, (_, index) => {
              const optionValue = index + min;
              return (
                <option key={optionValue} value={optionValue}>
                  {label} {optionValue}
                </option>
              );
            })}
          </select>
        </label>
        <button
          type="button"
          className="tool-nav-btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Next ${label.toLowerCase()}`}
          title={`Next ${label.toLowerCase()}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function StudyQuickPanelToolTab({
  showTranslation,
  setShowTranslation,
  studyScopeMode,
  setStudyScopeMode,
  studyJuzNumber,
  setStudyJuzNumber,
  studyPageNumber,
  setStudyPageNumber,
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
  showHifzMode,
  setShowHifzMode,
  showWordByWord,
  setShowWordByWord,
  isMushafView,
  setIsMushafView,
  scriptStyle,
  setScriptStyle,
  tajweedLegend
}: StudyQuickPanelToolTabProps) {
  const selectedReciterLabel =
    reciters.find((reciter) => reciter.id === reciterId)?.label || "Select reciter";

  return (
    <div className="quick-panel-section study-tool-section">
      <div className="study-card tool-block">
        <div className="tool-block-head">
          <h5>Reading Aids</h5>
          <span>Focus and visual helpers</span>
        </div>
        <div className="tool-toggle-grid">
          <ToggleCard
            title="Track Memorization"
            subtitle="Show checkmarks to track memorized ayahs."
            checked={showHifzMode}
            onChange={setShowHifzMode}
          />
          <ToggleCard
            title="Show Translation"
            subtitle="Keep translation visible under each ayah."
            checked={showTranslation}
            onChange={setShowTranslation}
          />
          <ToggleCard
            title="Show Transliteration"
            subtitle="Display transliteration only in Study mode."
            checked={showStudyTransliteration}
            onChange={setShowStudyTransliteration}
          />
          <ToggleCard
            title="Dim Other Ayahs"
            subtitle="Highlight the focused ayah during study."
            checked={dimNonFocused}
            onChange={setDimNonFocused}
          />
          <ToggleCard
            title="Auto-scroll on Play"
            subtitle="Follow recitation while ayahs advance."
            checked={autoScrollPlaying}
            onChange={setAutoScrollPlaying}
          />
          <ToggleCard
            title="Tajweed Colors"
            subtitle="Show tajweed highlights in Arabic text."
            checked={showTajweed}
            onChange={(next) => {
              setShowTajweed(next);
              if (!next) {
                setShowTajweedLegend(false);
              }
            }}
          />
          <ToggleCard
            title="Word by Word"
            subtitle="Enable word chips and word-level audio."
            checked={showWordByWord}
            onChange={setShowWordByWord}
          />
          <ToggleCard
            title="Mushaf View"
            subtitle="Use a cleaner page-like reading layout."
            checked={isMushafView}
            onChange={setIsMushafView}
          />
        </div>
      </div>

      <div className="study-card tool-block">
        <div className="tool-block-head">
          <h5>Reading Scope</h5>
          <span>Switch between surah, juz, and mushaf page reading.</span>
        </div>
        <div className="tool-script-grid">
          <div className="tool-section">
            <span className="tool-label">Mode</span>
            <div className="tool-buttons">
              <button className={`control-btn${studyScopeMode === "surah" ? " primary" : ""}`} onClick={() => setStudyScopeMode("surah")} type="button">
                Surah
              </button>
              <button className={`control-btn${studyScopeMode === "juz" ? " primary" : ""}`} onClick={() => setStudyScopeMode("juz")} type="button">
                Juz
              </button>
              <button className={`control-btn${studyScopeMode === "page" ? " primary" : ""}`} onClick={() => setStudyScopeMode("page")} type="button">
                Page
              </button>
            </div>
          </div>

          {studyScopeMode === "juz" && (
            <ScopeNav label="Juz" value={studyJuzNumber} min={1} max={30} onChange={setStudyJuzNumber} />
          )}

          {studyScopeMode === "page" && (
            <ScopeNav label="Page" value={studyPageNumber} min={1} max={604} onChange={setStudyPageNumber} />
          )}
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
                    <span className={`tajweed-swatch tajweed ${item.swatchClass}`} aria-hidden="true">
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

      {showHifzMode && (
        <div className="study-card tool-block">
          <div className="hifz-guide" role="note" aria-label="Memorization tracking guide">
            <p className="hifz-guide-title">How tracking works</p>
            <ul className="hifz-guide-list">
              <li>A <strong>✓</strong> icon now appears on each ayah card</li>
              <li>After memorizing an ayah, tap the icon to mark it</li>
              <li>Your progress shows in the <strong>Study</strong> tab under Surah Progress</li>
              <li>You can also mark entire surahs from the Study tab</li>
            </ul>
          </div>
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
              <span className="tool-slider-value">{Math.round((fontScale.arabic || 1) * 100)}%</span>
            </div>
            <div className="tool-slider-track">
              <progress
                className="tool-slider-fill"
                max={100}
                value={Math.max(0, Math.min(100, (((fontScale.arabic || 1) - 0.6) / 1.4) * 100))}
                aria-hidden="true"
              />
              <input
                className="tool-slider-input"
                type="range"
                min="0.6"
                max="2"
                step="0.05"
                value={fontScale.arabic || 1}
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
              <span className="tool-slider-value">{Math.round((fontScale.translation || 1) * 100)}%</span>
            </div>
            <div className="tool-slider-track">
              <progress
                className="tool-slider-fill"
                max={100}
                value={Math.max(0, Math.min(100, (((fontScale.translation || 1) - 0.7) / 0.9) * 100))}
                aria-hidden="true"
              />
              <input
                className="tool-slider-input"
                type="range"
                min="0.7"
                max="1.6"
                step="0.05"
                value={fontScale.translation || 1}
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
              <button className={`control-btn${scriptStyle === "uthmani" ? " primary" : ""}`} onClick={() => setScriptStyle("uthmani")} type="button">
                Uthmani
              </button>
              <button className={`control-btn${scriptStyle === "naskh" ? " primary" : ""}`} onClick={() => setScriptStyle("naskh")} type="button">
                Naskh
              </button>
            </div>
          </div>

          <label className="tool-section tool-select-wrap">
            <span className="tool-label">Arabic Font</span>
            <select className="study-select" value={arabicFontId} onChange={(event) => setArabicFontId(event.target.value)}>
              {arabicFonts.map((font) => (
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
              {reciters.map((reciter) => (
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
