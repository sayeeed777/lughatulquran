"use client";

import type { Ayah, Surah } from "../../lib/types";
import { ALL_TRANSLATIONS } from "../../lib/constants";

type CompareModalProps = {
  selectedAyah: Ayah | null;
  selectedSurah: Surah | null;
  selectedAyahKey: string | null;
  taqiCache: Record<string, string>;
  taqiLoading: Record<string, boolean>;
  onClose: () => void;
};

export default function CompareModal({
  selectedAyah,
  selectedSurah,
  selectedAyahKey,
  taqiCache,
  taqiLoading,
  onClose
}: CompareModalProps) {
  if (!selectedAyah || !selectedSurah) {
    return null;
  }

  const taqiText = selectedAyahKey ? taqiCache[selectedAyahKey] : null;
  const isTaqiLoading = selectedAyahKey ? taqiLoading[selectedAyahKey] : false;
  const formatArabic = (text?: string) => text ?? "";

  return (
    <div className="compare-panel" role="dialog" aria-modal="true" aria-labelledby="compare-modal-title">
      <div className="compare-header">
        <div>
          <p className="eyebrow">Ayah {selectedAyah.number}</p>
          <h3 id="compare-modal-title">
            {selectedSurah.englishName} - {selectedSurah.name}
          </h3>
        </div>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="compare-body">
        <div className="compare-block">
          <p className="label">Arabic (Uthmani)</p>
          <p className="ayah-arabic" lang="ar" dir="rtl">
            {formatArabic(selectedAyah.arabic)}
          </p>
        </div>
        {ALL_TRANSLATIONS.map((translation) => {
          const isTaqi = translation.id === "taqi-usmani";
          const translationText = isTaqi
            ? taqiText
            : selectedAyah.translations?.[translation.id]?.text;
          return (
            <div key={translation.id} className="compare-block">
              <p className="label">{translation.label}</p>
              <p className="compare-text">
                {isTaqi && isTaqiLoading
                  ? "Loading translation..."
                  : translationText || "Translation unavailable."}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
