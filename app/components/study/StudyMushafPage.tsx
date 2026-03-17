"use client";

import { useEffect, useMemo, useState } from "react";
import type { MushafPageLayout } from "./StudyModeTypes";
import { TOTAL_MUSHAF_PAGES } from "./StudyModeTypes";

const qcfFontCache = new Set<number>();

const getQcfFontName = (page: number) => `QCF2${String(page).padStart(3, "0")}`;
const getQcfFontUrl = (page: number) =>
  `/fonts/qcf-v2/p${page}.woff2`;

type StudyScopeAyah = {
  surahNumber: number;
  number: number;
  verseKey: string;
};

type StudyMushafPageProps = {
  layout: MushafPageLayout;
  ayahs: StudyScopeAyah[];
  focusedAyahKey: string | null;
  dimNonFocused: boolean;
  nowPlaying: { surah: number; ayah: number } | null;
  isAudioPaused: boolean;
  hideToolbar?: boolean;
  onFocusAyahKey: (key: string) => void;
  onTogglePlay: (surah: number, ayah: number) => void;
  onSelectPage: (page: number) => void;
};

export default function StudyMushafPage({
  layout,
  ayahs,
  focusedAyahKey,
  dimNonFocused,
  nowPlaying,
  isAudioPaused,
  hideToolbar,
  onFocusAyahKey,
  onTogglePlay,
  onSelectPage
}: StudyMushafPageProps) {
  const ayahOrder = useMemo(
    () => new Map(ayahs.map((ayah, index) => [ayah.verseKey, index + 1])),
    [ayahs]
  );
  const ayahByKey = useMemo(
    () => new Map(ayahs.map((ayah) => [ayah.verseKey, ayah])),
    [ayahs]
  );
  const fallbackAyah = ayahs[0] || null;
  const activeAyah = (focusedAyahKey ? ayahByKey.get(focusedAyahKey) : null) || fallbackAyah;
  const activeAyahPlaying = Boolean(
    activeAyah &&
    nowPlaying?.surah === activeAyah.surahNumber &&
    nowPlaying?.ayah === activeAyah.number &&
    !isAudioPaused
  );
  const pageSummary = `${layout.versesCount} ayahs · ${layout.firstVerseKey} - ${layout.lastVerseKey}`;

  const isCenterAlignedPage = layout.pageNumber <= 2;

  const hasQcfGlyphs = useMemo(
    () => layout.lines.some((line) => line.segments.some((s) => s.glyph)),
    [layout]
  );

  const [qcfFontName, setQcfFontName] = useState<string | null>(() => {
    if (!hasQcfGlyphs) return null;
    const name = getQcfFontName(layout.pageNumber);
    return qcfFontCache.has(layout.pageNumber) ? name : null;
  });

  useEffect(() => {
    if (!hasQcfGlyphs) return;
    const page = layout.pageNumber;
    const name = getQcfFontName(page);

    if (qcfFontCache.has(page)) {
      setQcfFontName(name);
      return;
    }

    let cancelled = false;
    const font = new FontFace(name, `url(${getQcfFontUrl(page)})`, {
      display: "block",
      style: "normal",
      weight: "400",
    });

    font
      .load()
      .then((loaded) => {
        if (cancelled) return;
        document.fonts.add(loaded);
        qcfFontCache.add(page);
        setQcfFontName(name);
      })
      .catch(() => {
        // Font failed to load — fall back to regular text
      });

    return () => {
      cancelled = true;
    };
  }, [layout.pageNumber, hasQcfGlyphs]);

  return (
    <section className="study-mushaf-page" aria-label={`Mushaf page ${layout.pageNumber}`}>
      {activeAyah && !hideToolbar && (
        <div className="study-mushaf-toolbar study-mushaf-toolbar-top">
          <div className="study-mushaf-toolbar-copy study-mushaf-page-picker-block">
            <span className="study-mushaf-toolbar-kicker">Page</span>
            <div className="study-mushaf-page-picker">
              <button
                type="button"
                className="study-mushaf-page-nav"
                onClick={() => onSelectPage(Math.max(1, layout.pageNumber - 1))}
                disabled={layout.pageNumber <= 1}
                aria-label="Previous page"
                title="Previous page"
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

              <label className="study-mushaf-page-select-wrap">
                <span className="sr-only">Choose page</span>
                <select
                  className="study-mushaf-page-select"
                  value={layout.pageNumber}
                  onChange={(event) => onSelectPage(Number(event.target.value))}
                  aria-label="Choose page"
                >
                  {Array.from({ length: TOTAL_MUSHAF_PAGES }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Page {index + 1}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="study-mushaf-page-nav"
                onClick={() => onSelectPage(Math.min(TOTAL_MUSHAF_PAGES, layout.pageNumber + 1))}
                disabled={layout.pageNumber >= TOTAL_MUSHAF_PAGES}
                aria-label="Next page"
                title="Next page"
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
          </div>

          <div className="study-mushaf-toolbar-copy study-mushaf-focus-block">
            <span className="study-mushaf-toolbar-kicker">Page summary</span>
            <span className="study-mushaf-toolbar-title">{pageSummary}</span>
          </div>

          <button
            type="button"
            className={`action-icon-btn play-icon${activeAyahPlaying ? " playing" : ""}`}
            onClick={() => onTogglePlay(activeAyah.surahNumber, activeAyah.number)}
            aria-label={activeAyahPlaying ? "Pause ayah" : "Play ayah"}
            title={activeAyahPlaying ? "Pause ayah" : "Play ayah"}
          >
            {activeAyahPlaying ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="6,4 20,12 6,20" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      )}

      <div className="study-page-sheet study-page-sheet-mushaf">
        <div className={`study-mushaf-inner${qcfFontName ? " qcf-ready" : ""}`} lang="ar" dir="rtl">
          {layout.lines.map((line, lineIdx) => {
            const isLastLine = lineIdx === layout.lines.length - 1;
            const isShortLine = line.segments.length <= 3;
            const shouldCenter = isCenterAlignedPage || (isLastLine && isShortLine);

            return (
            <p
              key={line.lineNumber}
              className={`study-mushaf-line${shouldCenter ? " center-align" : ""}`}
              style={qcfFontName ? { fontFamily: `"${qcfFontName}", sans-serif` } : undefined}
            >
              {line.segments.map((segment, index) => {
                const isFocused = focusedAyahKey === segment.verseKey;
                const isPlaying =
                  nowPlaying?.surah === segment.surahNumber &&
                  nowPlaying?.ayah === segment.ayahNumber &&
                  !isAudioPaused;
                const isDimmed = Boolean(dimNonFocused && focusedAyahKey && !isFocused);
                const useGlyph = qcfFontName && segment.glyph;

                if (segment.type === "marker") {
                  return (
                    <button
                      key={`${line.lineNumber}-${index}-${segment.verseKey}-marker`}
                      type="button"
                      className={`study-mushaf-marker study-focus-track${isFocused ? " focused" : ""}${isPlaying ? " playing" : ""}${isDimmed ? " dimmed" : ""}`}
                      data-scope-index={ayahOrder.get(segment.verseKey) || 0}
                      data-verse-key={segment.verseKey}
                      data-ayah-number={segment.ayahNumber}
                      onClick={() => onFocusAyahKey(segment.verseKey)}
                      aria-label={`Ayah ${segment.ayahNumber}`}
                      title={`Ayah ${segment.ayahNumber}`}
                    >
                      {useGlyph ? (
                        <span aria-hidden="true">{segment.glyph}</span>
                      ) : (
                        segment.text
                      )}
                    </button>
                  );
                }

                return (
                  <span
                    key={`${line.lineNumber}-${index}-${segment.verseKey}-word`}
                    className={`study-mushaf-word${isFocused ? " focused" : ""}${isPlaying ? " playing" : ""}${isDimmed ? " dimmed" : ""}`}
                    data-verse-key={segment.verseKey}
                  >
                    {useGlyph ? (
                      <span aria-hidden="true">{segment.glyph}</span>
                    ) : (
                      segment.text
                    )}
                  </span>
                );
              })}
            </p>
            );
          })}
        </div>

        <div className="study-mushaf-footer" aria-hidden="true">
          <span className="study-mushaf-page-number">{layout.pageNumber}</span>
        </div>
      </div>
    </section>
  );
}
