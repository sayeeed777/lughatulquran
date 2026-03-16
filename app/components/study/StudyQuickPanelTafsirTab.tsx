"use client";

import { useMemo } from "react";
import type { StudyQuickPanelContentProps } from "./StudyQuickPanelTypes";

type StudyQuickPanelTafsirTabProps = Pick<
  StudyQuickPanelContentProps,
  | "tafsirEdition"
  | "tafsirEditions"
  | "onChangeTafsirEdition"
  | "selectedSurahNumber"
  | "selectedSurahName"
  | "focusedAyahNumber"
  | "currentAyahIndex"
  | "onUseCurrentAyah"
  | "tafsirLoading"
  | "tafsirError"
  | "tafsirText"
>;

export default function StudyQuickPanelTafsirTab({
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
  tafsirText
}: StudyQuickPanelTafsirTabProps) {
  const selectedTafsirLabel = useMemo(
    () => tafsirEditions.find((edition) => edition.id === String(tafsirEdition))?.label || "Select tafsir edition",
    [tafsirEdition, tafsirEditions]
  );

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
                onChange={(event) => onChangeTafsirEdition(event.target.value)}
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
