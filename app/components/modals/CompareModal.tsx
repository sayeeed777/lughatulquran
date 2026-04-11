"use client";

import { ALL_TRANSLATIONS } from "../../lib/constants";
import { normalizeQuranDisplayArabic } from "../../lib/utils";
import { useQuranData, useUIState } from "../../contexts";
import { useEffect, useState, useRef, useCallback } from "react";
import { TAFSIR_EDITIONS } from "../study/StudyModeHelpers";

type CompareAllPayload = {
  translations?: Record<string, { text?: string }>;
};

type TafsirPayload = {
  text?: string;
  error?: string;
};

type CompareTab = "translations" | "tafseer";

export default function CompareModal() {
  const { selectedSurah } = useQuranData();
  const { selectedAyah, setSelectedAyah } = useUIState();
  const onClose = () => setSelectedAyah(null);

  const [activeTab, setActiveTab] = useState<CompareTab>("translations");
  const [payload, setPayload] = useState<CompareAllPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tafsirEdition, setTafsirEdition] = useState<string>(TAFSIR_EDITIONS[0].id);
  const [tafsirText, setTafsirText] = useState<string>("");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab("translations");
  }, [selectedAyah?.number, selectedSurah?.number]);

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

  useEffect(() => {
    if (activeTab !== "tafseer" || !selectedAyah || !selectedSurah) return;

    const controller = new AbortController();
    setTafsirLoading(true);
    setTafsirError(null);
    setTafsirText("");

    const url = `/api/tafsir?edition=${encodeURIComponent(tafsirEdition)}&surah=${selectedSurah.number}&ayah=${selectedAyah.number}`;
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as TafsirPayload;
        if (!res.ok) {
          throw new Error(data.error || `Tafsir request failed (${res.status})`);
        }
        return data;
      })
      .then((data) => setTafsirText(data.text || ""))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setTafsirError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setTafsirLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [activeTab, selectedAyah, selectedSurah, tafsirEdition]);

  if (!selectedAyah || !selectedSurah) {
    return null;
  }

  const formatArabic = (text?: string) => normalizeQuranDisplayArabic(text ?? "");
  const allTranslations = payload?.translations || {};

  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    const ratio = el.clientHeight / el.scrollHeight;
    if (ratio >= 1) {
      thumb.style.opacity = "0";
      return;
    }
    const thumbHeight = Math.max(30, ratio * el.clientHeight);
    const scrollRatio = el.scrollTop / (el.scrollHeight - el.clientHeight);
    const maxTop = el.clientHeight - thumbHeight;
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${scrollRatio * maxTop}px)`;
    thumb.style.opacity = "1";
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateThumb, { passive: true });
    const observer = new ResizeObserver(updateThumb);
    observer.observe(el);
    updateThumb();
    return () => {
      el.removeEventListener("scroll", updateThumb);
      observer.disconnect();
    };
  }, [updateThumb, loading]);

  return (
    <div className="compare-overlay" onClick={onClose}>
      <div
        className="compare-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
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
        <div className="compare-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "translations"}
            className={`compare-tab${activeTab === "translations" ? " active" : ""}`}
            onClick={() => setActiveTab("translations")}
          >
            Translations
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "tafseer"}
            className={`compare-tab${activeTab === "tafseer" ? " active" : ""}`}
            onClick={() => setActiveTab("tafseer")}
          >
            Tafseer
          </button>
        </div>
        <div className="compare-scroll-wrap">
          <div className="compare-body" ref={scrollRef}>
            <div className="compare-block">
              <p className="label">Arabic (Uthmani)</p>
              <p className="ayah-arabic" lang="ar" dir="rtl">
                {formatArabic(selectedAyah.arabic)}
              </p>
            </div>
            {activeTab === "translations" ? (
              <>
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
              </>
            ) : (
              <>
                <div className="compare-block compare-tafsir-picker">
                  <label className="label" htmlFor="compare-tafsir-edition">Tafseer Edition</label>
                  <select
                    id="compare-tafsir-edition"
                    className="compare-tafsir-select"
                    value={tafsirEdition}
                    onChange={(e) => setTafsirEdition(e.target.value)}
                  >
                    {TAFSIR_EDITIONS.map((edition) => (
                      <option key={edition.id} value={edition.id}>
                        {edition.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="compare-block">
                  <div className="compare-text compare-tafsir-text">
                    {tafsirLoading
                      ? "Loading tafseer..."
                      : tafsirError
                        ? tafsirError
                        : tafsirText || "No tafseer available for this ayah."}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="compare-scrollbar">
            <div className="compare-scrollbar-thumb" ref={thumbRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
