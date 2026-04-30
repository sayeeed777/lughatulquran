"use client";

import { ALL_TRANSLATIONS } from "../../lib/constants";
import { fetchJSON } from "../../lib/apiClient";
import { normalizeQuranDisplayArabic } from "../../lib/utils";
import { useQuranData, useUIState } from "../../contexts";
import { useLocalStorage } from "../../hooks";
import { useEffect, useState, useRef, useCallback } from "react";
import { TAFSIR_EDITIONS } from "../study/StudyModeHelpers";
import { CloseIcon, CopyIcon, CheckIcon } from "../common/Icons";

type CompareAllPayload = {
  translations?: Record<string, { text?: string }>;
};

type TafsirPayload = {
  text?: string;
  error?: string;
};

type CompareTab = "translations" | "tafseer";

const TAFSIR_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

const getTafsirCacheKey = (edition: string, surah: number, ayah: number) =>
  `tafsir:v2:${edition}:${surah}:${ayah}`;

const getTafsirUrl = (edition: string, surah: number, ayah: number) =>
  `/api/tafsir?edition=${encodeURIComponent(edition)}&surah=${surah}&ayah=${ayah}`;

const cleanTafsirText = (text: string) =>
  text.replace(/\uFFFD+/gu, " ").replace(/\s+/g, " ").trim();

export default function CompareModal() {
  const { selectedSurah } = useQuranData();
  const { selectedAyah, setSelectedAyah } = useUIState();
  const onClose = useCallback(() => setSelectedAyah(null), [setSelectedAyah]);
  const selectedSurahNumber = selectedSurah?.number;
  const selectedAyahNumber = selectedAyah?.number;

  const [activeTab, setActiveTab] = useState<CompareTab>("translations");
  const [payload, setPayload] = useState<CompareAllPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tafsirEdition, setTafsirEdition, isTafsirEditionLoaded] = useLocalStorage<string>(
    "quran_tafsir_edition",
    TAFSIR_EDITIONS[0].id
  );
  const [tafsirText, setTafsirText] = useState<string>("");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const loadedTafsirKeyRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<CompareTab>("translations");
  activeTabRef.current = activeTab;

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
    setActiveTab("translations");
  }, [selectedAyahNumber, selectedSurahNumber]);

  useEffect(() => {
    if (!isTafsirEditionLoaded) return;
    if (!TAFSIR_EDITIONS.some((edition) => edition.id === tafsirEdition)) {
      setTafsirEdition(TAFSIR_EDITIONS[0].id);
    }
  }, [isTafsirEditionLoaded, tafsirEdition, setTafsirEdition]);

  useEffect(() => {
    if (!selectedAyahNumber || !selectedSurahNumber) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPayload(null);

    const url = `/api/ayah/translations?surah=${selectedSurahNumber}&ayah=${selectedAyahNumber}`;
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
  }, [selectedSurahNumber, selectedAyahNumber]);

  useEffect(() => {
    if (
      activeTab !== "tafseer" ||
      !isTafsirEditionLoaded ||
      !selectedAyahNumber ||
      !selectedSurahNumber
    ) {
      return;
    }

    const controller = new AbortController();
    const key = getTafsirCacheKey(tafsirEdition, selectedSurahNumber, selectedAyahNumber);
    if (loadedTafsirKeyRef.current === key) {
      setTafsirLoading(false);
      return;
    }

    setTafsirLoading(true);
    setTafsirError(null);
    setTafsirText("");

    fetchJSON<TafsirPayload>(getTafsirUrl(tafsirEdition, selectedSurahNumber, selectedAyahNumber), {
      ttl: TAFSIR_CACHE_TTL,
      retries: 1,
      retryDelay: 300,
      cacheKey: key,
      persist: true,
      staleWhileRevalidate: true,
      signal: controller.signal
    })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        loadedTafsirKeyRef.current = key;
        setTafsirText(cleanTafsirText(data.text || ""));
      })
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
  }, [activeTab, isTafsirEditionLoaded, selectedAyahNumber, selectedSurahNumber, tafsirEdition]);

  useEffect(() => {
    if (
      activeTabRef.current === "tafseer" ||
      !isTafsirEditionLoaded ||
      !selectedAyahNumber ||
      !selectedSurahNumber
    ) {
      return;
    }

    const controller = new AbortController();
    const key = getTafsirCacheKey(tafsirEdition, selectedSurahNumber, selectedAyahNumber);
    loadedTafsirKeyRef.current = null;
    setTafsirText("");
    setTafsirError(null);
    setTafsirLoading(false);

    fetchJSON<TafsirPayload>(getTafsirUrl(tafsirEdition, selectedSurahNumber, selectedAyahNumber), {
      ttl: TAFSIR_CACHE_TTL,
      retries: 1,
      retryDelay: 300,
      cacheKey: key,
      persist: true,
      staleWhileRevalidate: true,
      signal: controller.signal
    })
      .then((data) => {
        if (controller.signal.aborted || data.error) return;
        loadedTafsirKeyRef.current = key;
        setTafsirText(cleanTafsirText(data.text || ""));
      })
      .catch(() => {
        // Prefetch is best-effort; the visible Tafseer tab fetch reports errors.
      });

    return () => {
      controller.abort();
    };
  }, [isTafsirEditionLoaded, selectedAyahNumber, selectedSurahNumber, tafsirEdition]);

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
  }, [updateThumb, loading, activeTab, tafsirLoading, tafsirText]);

  useEffect(() => {
    if (!selectedAyahNumber) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft") {
        setActiveTab("translations");
      } else if (e.key === "ArrowRight") {
        setActiveTab("tafseer");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selectedAyahNumber]);

  if (!selectedAyah || !selectedSurah) {
    return null;
  }

  const formatArabic = (text?: string) => normalizeQuranDisplayArabic(text ?? "");
  const allTranslations = payload?.translations || {};
  const currentTafsirKey =
    selectedSurahNumber && selectedAyahNumber
      ? getTafsirCacheKey(tafsirEdition, selectedSurahNumber, selectedAyahNumber)
      : null;
  const showTafsirLoading =
    tafsirLoading ||
    (
      activeTab === "tafseer" &&
      Boolean(currentTafsirKey) &&
      loadedTafsirKeyRef.current !== currentTafsirKey &&
      !tafsirError
    );

  const copyToClipboard = async (id: string, text: string) => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopiedId(id);
      setTimeout(
        () => setCopiedId((current) => (current === id ? null : current)),
        1500,
      );
    }
  };

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
          <h3 id="compare-modal-title" className="compare-header-title">
            <span className="compare-header-surah">{selectedSurah.englishName}</span>
            <span className="compare-header-ayah">Ayah {selectedAyah.number}</span>
          </h3>
          <button
            className="compare-close-icon"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="compare-arabic-hero compare-arabic-hero--desktop">
          <p className="ayah-arabic" lang="ar" dir="rtl">
            {formatArabic(selectedAyah.arabic)}
          </p>
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
            <div className="compare-arabic-hero compare-arabic-hero--mobile">
              <p className="ayah-arabic" lang="ar" dir="rtl">
                {formatArabic(selectedAyah.arabic)}
              </p>
            </div>
            {activeTab === "translations" ? (
              <div className="compare-translations-list">
                {error && (
                  <div className="compare-translation-row">
                    <p className="compare-translation-label">Compare mode</p>
                    <p className="compare-translation-text">{error}</p>
                  </div>
                )}
                {ALL_TRANSLATIONS.map((translation) => {
                  const translationText =
                    allTranslations?.[translation.id]?.text
                    || selectedAyah.translations?.[translation.id]?.text;
                  const canCopy = Boolean(translationText);
                  const isCopied = copiedId === translation.id;

                  return (
                    <div key={translation.id} className="compare-translation-row">
                      <p className="compare-translation-label">{translation.label}</p>
                      <p dir="auto" className="compare-translation-text">
                        {translationText || (loading ? "Loading..." : "Translation unavailable.")}
                      </p>
                      {canCopy && (
                        <button
                          type="button"
                          className={`compare-row-copy${isCopied ? " is-copied" : ""}`}
                          onClick={() => copyToClipboard(translation.id, translationText!)}
                          aria-label={isCopied ? "Copied" : "Copy translation"}
                          title={isCopied ? "Copied" : "Copy"}
                        >
                          {isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="compare-translations-list">
                <div className="compare-translation-row compare-tafsir-picker">
                  <label className="compare-translation-label" htmlFor="compare-tafsir-edition">
                    Tafseer Edition
                  </label>
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
                <div className="compare-translation-row">
                  <div className="compare-translation-text compare-tafsir-text">
                    {showTafsirLoading
                      ? "Loading tafseer..."
                      : tafsirError
                        ? tafsirError
                        : tafsirText || "No tafseer available for this ayah."}
                  </div>
                </div>
              </div>
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
