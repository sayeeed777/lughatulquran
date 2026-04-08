"use client";

import { ALL_TRANSLATIONS } from "../../lib/constants";
import { normalizeQuranDisplayArabic } from "../../lib/utils";
import { useQuranData, useUIState } from "../../contexts";
import { useEffect, useState } from "react";

type CompareAllPayload = {
  translations?: Record<string, { text?: string }>;
};

export default function CompareModal() {
  const { selectedSurah } = useQuranData();
  const { selectedAyah, setSelectedAyah } = useUIState();
  const onClose = () => setSelectedAyah(null);

  const [payload, setPayload] = useState<CompareAllPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAyah || !selectedSurah) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPayload(null);

    const url = `/api/ayah/translations?surah=${selectedSurah.number}&ayah=${selectedAyah.number}`;
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Compare request failed (${res.status})`);
        }
        return (await res.json()) as CompareAllPayload;
      })
      .then((data) => setPayload(data))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [selectedSurah, selectedAyah]);

  if (!selectedAyah || !selectedSurah) {
    return null;
  }

  const formatArabic = (text?: string) => normalizeQuranDisplayArabic(text ?? "");
  const allTranslations = payload?.translations || {};

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
        {error && (
          <div className="compare-block">
            <p className="label">Compare mode</p>
            <p className="compare-text">{error}</p>
          </div>
        )}
        {ALL_TRANSLATIONS.map((translation) => {
          const translationText =
            allTranslations?.[translation.id]?.text
            || selectedAyah.translations?.[translation.id]?.text;

          return (
            <div key={translation.id} className="compare-block">
              <p className="label">{translation.label}</p>
              <p dir="auto" className="compare-text">
                {translationText || (loading ? "Loading..." : "Translation unavailable.")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
