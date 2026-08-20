"use client";

import { ALL_TRANSLATIONS } from "../../lib/constants";
import { fetchJSON } from "../../lib/apiClient";
import {
  cleanTafsirText,
  getTafsirParagraphDirection,
  splitTafsirParagraphs
} from "../../lib/tafsirText";
import { normalizeQuranDisplayArabic, verseKey } from "../../lib/utils";
import { useQuranData, useUIState } from "../../contexts";
import { useLocalStorage } from "../../hooks";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TAFSIR_EDITIONS } from "../study/StudyModeHelpers";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CopyIcon
} from "../common/Icons";
import ReaderTafsirEditionPicker from "./ReaderTafsirEditionPicker";

type CompareAllPayload = {
  translations?: Record<string, { text?: string }>;
};

type TafsirPayload = {
  text?: string;
  error?: string;
};

type CompareTab = "translations" | "tafsir";

const TAFSIR_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

const getTafsirCacheKey = (edition: string, surah: number, ayah: number) =>
  `tafsir:v3:${edition}:${surah}:${ayah}`;

const getTafsirUrl = (edition: string, surah: number, ayah: number) =>
  `/api/tafsir?edition=${encodeURIComponent(edition)}&surah=${surah}&ayah=${ayah}`;

export default function CompareModal() {
  const { selectedSurah, surahData } = useQuranData();
  const { selectedAyah, setSelectedAyah, setFocusedAyahKey } = useUIState();
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
  const [loadedTafsirKey, setLoadedTafsirKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<CompareTab>("translations");
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const suppressScrollSaveRef = useRef(false);
  const restoreFrameRef = useRef<number | null>(null);
  const isOpen = Boolean(selectedSurahNumber && selectedAyahNumber);
  const currentScrollKey = isOpen
    ? `${selectedSurahNumber}:${selectedAyahNumber}:${activeTab}`
    : null;

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

  const saveCurrentScrollPosition = useCallback(() => {
    if (!currentScrollKey || !scrollRef.current) return;
    scrollPositionsRef.current[currentScrollKey] = scrollRef.current.scrollTop;
  }, [currentScrollKey]);

  const changeActiveTab = useCallback(
    (tab: CompareTab) => {
      if (tab === activeTab) return;
      saveCurrentScrollPosition();
      setActiveTab(tab);
    },
    [activeTab, saveCurrentScrollPosition]
  );

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !currentScrollKey) return;

    suppressScrollSaveRef.current = true;
    el.scrollTop = scrollPositionsRef.current[currentScrollKey] ?? 0;
    updateThumb();

    if (restoreFrameRef.current !== null) {
      window.cancelAnimationFrame(restoreFrameRef.current);
    }
    restoreFrameRef.current = window.requestAnimationFrame(() => {
      restoreFrameRef.current = window.requestAnimationFrame(() => {
        suppressScrollSaveRef.current = false;
        restoreFrameRef.current = null;
      });
    });

    return () => {
      if (restoreFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreFrameRef.current);
        restoreFrameRef.current = null;
      }
      suppressScrollSaveRef.current = true;
    };
  }, [currentScrollKey, loading, payload, tafsirLoading, tafsirText, updateThumb]);

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
      activeTab !== "tafsir" ||
      !isTafsirEditionLoaded ||
      !selectedAyahNumber ||
      !selectedSurahNumber
    ) {
      return;
    }

    const controller = new AbortController();
    const key = getTafsirCacheKey(tafsirEdition, selectedSurahNumber, selectedAyahNumber);
    if (loadedTafsirKey === key) {
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
        setLoadedTafsirKey(key);
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
  }, [
    activeTab,
    isTafsirEditionLoaded,
    loadedTafsirKey,
    selectedAyahNumber,
    selectedSurahNumber,
    tafsirEdition
  ]);

  useEffect(() => {
    if (
      activeTabRef.current === "tafsir" ||
      !isTafsirEditionLoaded ||
      !selectedAyahNumber ||
      !selectedSurahNumber
    ) {
      return;
    }

    const controller = new AbortController();
    const key = getTafsirCacheKey(tafsirEdition, selectedSurahNumber, selectedAyahNumber);
    setLoadedTafsirKey(null);
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
        setLoadedTafsirKey(key);
        setTafsirText(cleanTafsirText(data.text || ""));
      })
      .catch(() => {
        // Prefetch is best-effort; the visible Tafsir tab fetch reports errors.
      });

    return () => {
      controller.abort();
    };
  }, [isTafsirEditionLoaded, selectedAyahNumber, selectedSurahNumber, tafsirEdition]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateThumb);
    observer.observe(el);
    updateThumb();
    return () => {
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
        changeActiveTab("translations");
      } else if (e.key === "ArrowRight") {
        changeActiveTab("tafsir");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeActiveTab, onClose, selectedAyahNumber]);

  if (!selectedAyah || !selectedSurah) {
    return null;
  }

  const formatArabic = (text?: string) => normalizeQuranDisplayArabic(text ?? "");
  const allTranslations = payload?.translations || {};
  const availableTranslations = ALL_TRANSLATIONS.filter(
    (translation) =>
      Boolean(allTranslations?.[translation.id]?.text) ||
      Boolean(selectedAyah.translations?.[translation.id]?.text)
  );
  const selectedTafsirEdition =
    TAFSIR_EDITIONS.find((edition) => edition.id === tafsirEdition) || TAFSIR_EDITIONS[0];
  const tafsirParagraphs = splitTafsirParagraphs(tafsirText);
  const surahAyahs = surahData?.ayahs || [];
  const previousAyah = surahAyahs.find((ayah) => ayah.number === selectedAyah.number - 1);
  const nextAyah = surahAyahs.find((ayah) => ayah.number === selectedAyah.number + 1);
  const currentTafsirKey =
    selectedSurahNumber && selectedAyahNumber
      ? getTafsirCacheKey(tafsirEdition, selectedSurahNumber, selectedAyahNumber)
      : null;
  const showTafsirLoading =
    tafsirLoading ||
    (
      activeTab === "tafsir" &&
      Boolean(currentTafsirKey) &&
      loadedTafsirKey !== currentTafsirKey &&
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

  const navigateToAyah = (ayah: typeof selectedAyah | undefined) => {
    if (!ayah) return;
    saveCurrentScrollPosition();
    setSelectedAyah(ayah);
    setFocusedAyahKey(verseKey(selectedSurah.number, ayah.number));
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
          <div className="compare-header-actions">
            <button
              className="compare-nav-icon"
              onClick={() => navigateToAyah(previousAyah)}
              aria-label="Previous ayah"
              title="Previous ayah"
              type="button"
              disabled={!previousAyah}
            >
              <ChevronLeftIcon size={18} />
            </button>
            <button
              className="compare-nav-icon"
              onClick={() => navigateToAyah(nextAyah)}
              aria-label="Next ayah"
              title="Next ayah"
              type="button"
              disabled={!nextAyah}
            >
              <ChevronRightIcon size={18} />
            </button>
            <button
              className="compare-close-icon"
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <CloseIcon size={18} />
            </button>
          </div>
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
            onClick={() => changeActiveTab("translations")}
          >
            Translations
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "tafsir"}
            className={`compare-tab${activeTab === "tafsir" ? " active" : ""}`}
            onClick={() => changeActiveTab("tafsir")}
          >
            Tafsir
          </button>
        </div>
        <div className="compare-scroll-wrap">
          {activeTab === "tafsir" && (
            <div className="compare-tafsir-picker">
              <span className="compare-translation-label">Tafsir edition</span>
              <ReaderTafsirEditionPicker
                editions={TAFSIR_EDITIONS}
                value={tafsirEdition}
                onChange={setTafsirEdition}
              />
            </div>
          )}
          <div
            className="compare-body"
            ref={scrollRef}
            onScroll={() => {
              if (!suppressScrollSaveRef.current) {
                saveCurrentScrollPosition();
              }
              updateThumb();
            }}
          >
            <div className="compare-arabic-hero compare-arabic-hero--mobile">
              <p className="ayah-arabic" lang="ar" dir="rtl">
                {formatArabic(selectedAyah.arabic)}
              </p>
            </div>
            {activeTab === "translations" ? (
              <div className="compare-translations-list" aria-busy={loading}>
                {error && (
                  <p className="compare-translation-status error" role="alert">
                    {error}
                  </p>
                )}
                {loading ? (
                  <div className="compare-translation-loading" role="status" aria-label="Loading translations">
                    {Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className="compare-translation-row compare-translation-skeleton">
                        <span className="compare-skeleton-label" />
                        <span className="compare-skeleton-line" />
                        <span className="compare-skeleton-line short" />
                      </div>
                    ))}
                  </div>
                ) : availableTranslations.length > 0 ? (
                  availableTranslations.map((translation) => {
                    const translationText =
                      allTranslations?.[translation.id]?.text ||
                      selectedAyah.translations?.[translation.id]?.text ||
                      "";
                    const isCopied = copiedId === translation.id;

                    return (
                      <div key={translation.id} className="compare-translation-row">
                        <p className="compare-translation-label">{translation.label}</p>
                        <p dir="auto" className="compare-translation-text">
                          {translationText}
                        </p>
                        <button
                          type="button"
                          className={`compare-row-copy${isCopied ? " is-copied" : ""}`}
                          onClick={() => copyToClipboard(translation.id, translationText)}
                          aria-label={isCopied ? "Copied" : `Copy ${translation.label} translation`}
                          title={isCopied ? "Copied" : "Copy"}
                        >
                          {isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                        </button>
                      </div>
                    );
                  })
                ) : !error ? (
                  <p className="compare-translation-status">No translations are available for this ayah.</p>
                ) : null}
              </div>
            ) : (
              <div className="compare-tafsir-content">
                <article
                  className="compare-tafsir-text"
                  lang={selectedTafsirEdition.language}
                  dir={selectedTafsirEdition.direction}
                  aria-busy={showTafsirLoading}
                >
                  {showTafsirLoading ? (
                    <div className="compare-tafsir-loading" role="status" aria-label="Loading Tafsir">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : tafsirError ? (
                    <p className="compare-tafsir-message error" role="alert">
                      {tafsirError}
                    </p>
                  ) : tafsirParagraphs.length > 0 ? (
                    tafsirParagraphs.map((paragraph, index) => {
                      const direction = getTafsirParagraphDirection(
                        paragraph,
                        selectedTafsirEdition.direction
                      );
                      const isArabicQuote =
                        selectedTafsirEdition.direction === "ltr" && direction === "rtl";

                      return (
                        <p
                          key={`${tafsirEdition}-${index}`}
                          className={isArabicQuote ? "compare-tafsir-quote" : undefined}
                          dir={direction}
                        >
                          {paragraph}
                        </p>
                      );
                    })
                  ) : (
                    <p className="compare-tafsir-message">No Tafsir is available for this ayah.</p>
                  )}
                </article>
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
