"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  RootLexiconAyahOccurrence,
  RootLexiconPayload,
  SelectedWordDetails
} from "./StudyModeTypes";

const LANE_ABBREVIATION_GUIDE = [
  { code: "S", meaning: "as-Sihah (al-Jawhari)" },
  { code: "Msb", meaning: "al-Misbah al-Munir" },
  { code: "K", meaning: "al-Qamus al-Muhit" },
  { code: "*", meaning: "editorial emphasis marker in the source text" }
] as const;

type StudyLexiconModalsProps = {
  selectedWordDetails: SelectedWordDetails | null;
  isLaneModalOpen: boolean;
  isRootDetailsModalOpen: boolean;
  selectedRoot: string;
  selectedRootArabic: string;
  rootMeaningSummary: string;
  laneActionLabel: string;
  rootLexiconError: string | null;
  rootLexiconLoading: boolean;
  rootLexicon: RootLexiconPayload | null;
  onCloseWordDetails: () => void;
  onCloseLaneModal: () => void;
  onCloseRootDetailsModal: () => void;
  onOpenLaneLexicon: (root?: string) => void;
  onOpenRootDetails: (root?: string) => void;
  onPlayWordAudio: (audioUrl?: string) => void;
  onJumpToAyah: (surah: number, ayah: number) => void;
};

const parseReference = (value: string) => {
  const match = String(value || "").trim().match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
  if (!match) return null;
  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  if (!Number.isInteger(surah) || !Number.isInteger(ayah)) return null;
  if (surah < 1 || surah > 114 || ayah < 1) return null;
  return { surah, ayah };
};

const stripMarkup = (value: string) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const renderHighlightedAyah = (value?: string) => {
  const source = String(value || "").trim();
  if (!source) return null;
  const regex = /<a[^>]*class=(["'])highlight-text\1[^>]*>(.*?)<\/a>/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(source))) {
    const before = stripMarkup(source.slice(lastIndex, match.index));
    if (before) {
      nodes.push(<span key={`plain-${index}`}>{before} </span>);
      index += 1;
    }

    const highlighted = stripMarkup(match[2] || "");
    if (highlighted) {
      nodes.push(
        <span key={`mark-${index}`} className="study-root-ayah-highlight">
          {highlighted}
        </span>
      );
      nodes.push(<span key={`space-${index}`}> </span>);
      index += 1;
    }
    lastIndex = match.index + match[0].length;
  }

  const after = stripMarkup(source.slice(lastIndex));
  if (after) {
    nodes.push(<span key={`tail-${index}`}>{after}</span>);
  }

  return nodes.length ? nodes : stripMarkup(source);
};

const stripRootCountParagraph = (html?: string | null) => {
  const content = String(html || "").trim();
  if (!content) return "";

  return content
    .replace(/(?:<br\s*\/?>\s*){2}Of this root,[\s\S]*$/i, "")
    .trim();
};

const normalizeLexHtml = (html?: string | null) =>
  String(html || "")
    .replace(/<br\s*\/?>\s*;/gi, "; ")
    .trim();

const LexHtmlBlock = ({ html }: { html?: string | null }) => {
  const content = normalizeLexHtml(html);
  if (!content) return null;
  return <div className="study-root-lex-html" dangerouslySetInnerHTML={{ __html: content }} />;
};

export default function StudyLexiconModals({
  selectedWordDetails,
  isLaneModalOpen,
  isRootDetailsModalOpen,
  selectedRoot,
  selectedRootArabic,
  rootMeaningSummary,
  laneActionLabel,
  rootLexiconError,
  rootLexiconLoading,
  rootLexicon,
  onCloseWordDetails,
  onCloseLaneModal,
  onCloseRootDetailsModal,
  onOpenLaneLexicon,
  onOpenRootDetails,
  onPlayWordAudio,
  onJumpToAyah
}: StudyLexiconModalsProps) {
  const [showAbbreviationGuide, setShowAbbreviationGuide] = useState(false);
  const [selectedLexEntryId, setSelectedLexEntryId] = useState("");

  useEffect(() => {
    if (!isLaneModalOpen) {
      setShowAbbreviationGuide(false);
    }
  }, [isLaneModalOpen]);

  const coreMeaningChips = useMemo(() => {
    const laneChips = (rootLexicon?.coreMeanings || [])
      .map((value) => value.trim())
      .filter(Boolean);
    if (laneChips.length) return laneChips.slice(0, 8);

    const rootMeaning = (rootLexicon?.rootMeaning || "").trim();
    if (!rootMeaning) return [];

    const pieces = rootMeaning
      .replace(/\([^)]*\)/g, " ")
      .replace(/\s+/g, " ")
      .split(/[,;/]|(?:\s+-\s+)|\.\s+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => value.replace(/^to\s+/i, ""))
      .map((value) => value.replace(/\s+/g, " "));

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const piece of pieces) {
      const key = piece.toLowerCase();
      if (!piece || seen.has(key)) continue;
      seen.add(key);
      unique.push(piece.length > 42 ? `${piece.slice(0, 39).trim()}...` : piece);
      if (unique.length >= 6) break;
    }
    return unique;
  }, [rootLexicon?.coreMeanings, rootLexicon?.rootMeaning]);

  const explorerStats = useMemo(() => {
    const stats = rootLexicon?.stats;
    if (!stats) return [];
    return [
      { label: "Occurrences", value: stats.totalOccurrences },
      { label: "Forms", value: stats.derivativeCount },
      { label: "Surahs", value: stats.surahCount },
      { label: "Ayahs", value: stats.ayahCount }
    ];
  }, [rootLexicon?.stats]);

  const ayahsBySurah = useMemo(() => {
    const grouped = new Map<number, RootLexiconAyahOccurrence[]>();
    for (const item of rootLexicon?.ayahOccurrences || []) {
      if (!Number.isInteger(item.surah) || !Number.isInteger(item.ayah)) continue;
      const current = grouped.get(item.surah) || [];
      if (!current.some((existing) => existing.ayah === item.ayah)) {
        current.push(item);
      }
      grouped.set(item.surah, current);
    }

    for (const [surah, ayahItems] of grouped.entries()) {
      grouped.set(
        surah,
        [...ayahItems].sort((a, b) => a.ayah - b.ayah)
      );
    }

    return grouped;
  }, [rootLexicon?.ayahOccurrences]);

  const rootExplorerUnavailable =
    !rootLexiconLoading &&
    !rootLexiconError &&
    rootLexicon?.rootExplorerAvailable === false;

  const lexSnapshot = rootLexicon?.lexSnapshot || null;

  const definitionEntries = useMemo(
    () => (lexSnapshot?.entries || []).filter((entry) => !entry.isRoot),
    [lexSnapshot?.entries]
  );

  const activeLexEntry = useMemo(() => {
    if (!definitionEntries.length) return null;
    return (
      definitionEntries.find((entry) => entry.id === selectedLexEntryId) ||
      definitionEntries.find((entry) => entry.id === lexSnapshot?.mainEntryId) ||
      definitionEntries.find((entry) => entry.isMain) ||
      definitionEntries[0] ||
      null
    );
  }, [definitionEntries, lexSnapshot?.mainEntryId, selectedLexEntryId]);

  useEffect(() => {
    if (!isRootDetailsModalOpen) return;
    const nextEntryId =
      definitionEntries.find((entry) => entry.id === lexSnapshot?.mainEntryId)?.id ||
      definitionEntries.find((entry) => entry.isMain)?.id ||
      definitionEntries[0]?.id ||
      "";
    setSelectedLexEntryId(nextEntryId);
  }, [definitionEntries, isRootDetailsModalOpen, lexSnapshot?.mainEntryId]);

  const activeLexHtml = activeLexEntry?.definitionHtml || lexSnapshot?.mainDefinitionHtml || "";
  const lexSnapshotUnavailable =
    !rootLexiconLoading &&
    !rootLexiconError &&
    rootLexicon?.rootExplorerAvailable &&
    !lexSnapshot;

  return (
    <>
      <AnimatePresence>
        {selectedWordDetails && (
          <motion.div
            className="study-lexicon-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseWordDetails}
          >
            <motion.div
              className="study-lexicon-modal"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="study-lexicon-header">
                <h3>Word Details</h3>
                <button className="study-lexicon-close" onClick={onCloseWordDetails} type="button" aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="study-lexicon-body">
                <div className="study-lexicon-top-row">
                  {selectedRoot ? (
                    <button
                      type="button"
                      className="study-lexicon-root-focus"
                      onClick={() => onOpenRootDetails(selectedRoot)}
                    >
                      <span className="study-lexicon-root-heading">Root (جذر)</span>
                      <span className="study-lexicon-root-arabic" lang="ar" dir="rtl">
                        {selectedRootArabic || "—"}
                      </span>
                    </button>
                  ) : (
                    <div className="study-lexicon-root-focus is-unavailable">
                      <span className="study-lexicon-root-heading">Root (جذر)</span>
                      <span className="study-lexicon-unavailable">Unavailable</span>
                    </div>
                  )}

                  <div className="study-lexicon-word-block">
                    <div className="study-lexicon-word-row">
                      {selectedWordDetails.audioUrl ? (
                        <button
                          type="button"
                          className="study-word-audio-icon"
                          onClick={() => onPlayWordAudio(selectedWordDetails.audioUrl)}
                          aria-label="Play word audio"
                          title="Play word audio"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor" stroke="none" />
                            <path d="M15.5 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
                            <path d="M17.8 7a7 7 0 0 1 0 10" strokeLinecap="round" />
                          </svg>
                        </button>
                      ) : null}
                      <p className="study-lexicon-word" lang="ar" dir="rtl">
                        {selectedWordDetails.arabic}
                      </p>
                    </div>
                    {selectedWordDetails.translation ? (
                      <p className="study-lexicon-translation">{selectedWordDetails.translation}</p>
                    ) : null}
                  </div>
                </div>

                <div className="study-lexicon-summary-grid">
                  <div className="study-lexicon-summary-item">
                    <span className="study-lexicon-label">Root Meaning</span>
                    <p className="study-lexicon-summary-text">{rootMeaningSummary}</p>
                  </div>
                  <div className="study-lexicon-summary-item">
                    <span className="study-lexicon-label">Lane Lexicon</span>
                    {selectedRoot ? (
                      <button
                        type="button"
                        className="study-lane-open-btn"
                        onClick={() => onOpenLaneLexicon(selectedRoot)}
                      >
                        {laneActionLabel}
                      </button>
                    ) : (
                      <p className="study-lexicon-summary-text">No root available for this word.</p>
                    )}
                  </div>
                </div>

                {rootLexiconError && selectedRoot ? (
                  <p className="study-lexicon-unavailable">{rootLexiconError}</p>
                ) : null}

                <div className="study-lexicon-actions">
                  {selectedRoot ? (
                    <button
                      type="button"
                      className="study-root-link study-root-insight-btn"
                      onClick={() => onOpenRootDetails(selectedRoot)}
                    >
                      Open root details
                    </button>
                  ) : (
                    <span className="study-lexicon-unavailable">Root unavailable</span>
                  )}

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedWordDetails && isLaneModalOpen ? (
        <div className="study-lexicon-backdrop root-layer" onClick={onCloseLaneModal}>
          <div
            className="study-lexicon-modal root-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="study-lexicon-header">
              <div>
                <p className="study-lexicon-eyebrow">Lane Lexicon</p>
                <h3>{selectedWordDetails.rootArabic || rootLexicon?.rootArabic || "Root"}</h3>
              </div>
              <button className="study-lexicon-close" onClick={onCloseLaneModal} type="button">
                ✕
              </button>
            </div>

            <div className="study-lexicon-body">
              {rootLexiconLoading ? <p className="study-lexicon-unavailable">Loading lexicon...</p> : null}
              {!rootLexiconLoading && rootLexiconError ? (
                <p className="study-lexicon-unavailable">{rootLexiconError}</p>
              ) : null}
              {!rootLexiconLoading && !rootLexiconError && (
                <>
                  <div className="study-lexicon-meta-row">
                    <div className="study-lexicon-meta-grid">
                      <div className="study-lexicon-meta-item">
                        <span className="study-lexicon-label">Arabic</span>
                        <span className="study-lexicon-value">
                          {rootLexicon?.rootArabic || selectedWordDetails.rootArabic || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="study-lexicon-guide">
                      <button
                        type="button"
                        className={`study-lexicon-guide-toggle${showAbbreviationGuide ? " is-open" : ""}`}
                        onClick={() => setShowAbbreviationGuide((prev) => !prev)}
                        aria-expanded={showAbbreviationGuide}
                      >
                        <span>Guide</span>
                        <span className="study-lexicon-guide-caret" aria-hidden="true">
                          ▾
                        </span>
                      </button>
                      {showAbbreviationGuide ? (
                        <div className="study-lexicon-guide-popover">
                          <div className="study-lexicon-guide-grid">
                            {LANE_ABBREVIATION_GUIDE.map((item) => (
                              <div key={item.code} className="study-lexicon-guide-item">
                                <span className="study-lexicon-guide-code">{item.code}</span>
                                <span className="study-lexicon-guide-meaning">{item.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {coreMeaningChips.length > 0 ? (
                    <div className="study-lexicon-section">
                      <h4>Core Meanings</h4>
                      <div className="study-lexicon-chip-row">
                        {coreMeaningChips.map((meaning) => (
                          <span key={meaning} className="study-lexicon-chip">
                            {meaning}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="study-lexicon-section">
                    <h4>Dictionary Definitions</h4>
                    {rootLexicon?.definitions?.length ? (
                      <ul className="study-lexicon-list">
                        {rootLexicon.definitions.map((definition, index) => (
                          <li key={`${index}-${definition.slice(0, 16)}`}>{definition}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="study-lexicon-unavailable">
                        Add a Lane lexicon JSON to see dictionary definitions here.
                      </p>
                    )}
                  </div>

                  <div className="study-lexicon-section">
                    <h4>Qur&apos;anic References</h4>
                    {rootLexicon?.references?.length ? (
                      <div className="study-lexicon-ref-grid">
                        {rootLexicon.references.map((ref, index) => {
                          const parsed = parseReference(ref);
                          if (!parsed) {
                            return (
                              <span key={`${ref}-${index}`} className="study-lexicon-ref">
                                {ref}
                              </span>
                            );
                          }

                          return (
                            <button
                              key={`${ref}-${index}`}
                              type="button"
                              className="study-lexicon-ref is-link"
                              onClick={() => {
                                onCloseLaneModal();
                                onJumpToAyah(parsed.surah, parsed.ayah);
                              }}
                              aria-label={`Go to Surah ${parsed.surah}, Ayah ${parsed.ayah}`}
                              title={`Go to ${parsed.surah}:${parsed.ayah}`}
                            >
                              {ref}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="study-lexicon-unavailable">No references found.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isRootDetailsModalOpen ? (
        <div className="study-lexicon-backdrop root-layer" onClick={onCloseRootDetailsModal}>
          <div
            className="study-lexicon-modal root-explorer-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="study-lexicon-header">
              <h3>Root Details</h3>
              <button className="study-lexicon-close" onClick={onCloseRootDetailsModal} type="button" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="study-lexicon-body">
              {rootLexiconLoading ? <p className="study-lexicon-unavailable">Loading root details...</p> : null}
              {!rootLexiconLoading && rootLexiconError ? (
                <p className="study-lexicon-unavailable">{rootLexiconError}</p>
              ) : null}
              {!rootLexiconLoading && !rootLexiconError && (
                <>
                  <div className="study-root-explorer-hero">
                    <div className="study-root-explorer-hero-header">
                      <div className="study-root-explorer-root-block">
                        <span className="study-lexicon-label">Root</span>
                        <span className="study-root-explorer-root" lang="ar" dir="rtl">
                          {rootLexicon?.rootArabic || selectedRootArabic || "—"}
                        </span>
                      </div>
                      <div className="study-root-explorer-summary-block">
                        <span className="study-lexicon-label">Root Meaning</span>
                        <p className="study-root-explorer-summary">
                          {rootLexicon?.rootMeaning || rootMeaningSummary}
                        </p>
                      </div>
                    </div>

                    {explorerStats.length ? (
                      <div className="study-root-explorer-stats">
                        {explorerStats.map((item) => (
                          <div key={item.label} className="study-root-explorer-stat">
                            <span className="study-lexicon-label">{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {lexSnapshot?.rootDefinitionHtml ? (
                    <div className="study-lexicon-section">
                      <h4>Root Lexicon</h4>
                      <div className="study-root-lex-panel">
                        <LexHtmlBlock html={stripRootCountParagraph(lexSnapshot.rootDefinitionHtml)} />
                      </div>
                    </div>
                  ) : null}

                  {definitionEntries.length || activeLexHtml ? (
                    <div className="study-lexicon-section">
                      <h4>Word Definitions</h4>

                      {lexSnapshot?.wordGrammar || lexSnapshot?.derivativeNote ? (
                        <div className="study-root-lex-notes">
                          {lexSnapshot?.wordGrammar ? (
                            <span className="study-root-lex-note">{lexSnapshot.wordGrammar}</span>
                          ) : null}
                          {lexSnapshot?.derivativeNote ? (
                            <span className="study-root-lex-note is-wide">{lexSnapshot.derivativeNote}</span>
                          ) : null}
                        </div>
                      ) : null}

                      {definitionEntries.length ? (
                        <div className="study-root-lex-entry-row" role="tablist" aria-label="Root word forms">
                          {definitionEntries.map((entry) => {
                            const isActive = activeLexEntry?.id === entry.id;
                            return (
                              <button
                                key={entry.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`study-root-lex-entry${isActive ? " is-active" : ""}`}
                                onClick={() => setSelectedLexEntryId(entry.id)}
                              >
                                <span lang="ar" dir="rtl">
                                  {entry.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {activeLexHtml ? (
                        <div className="study-root-lex-panel">
                          <LexHtmlBlock html={activeLexHtml} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {rootLexicon?.derivatives?.length ? (
                    <div className="study-lexicon-section">
                      <h4>Derived Forms</h4>
                      <div className="study-root-derivative-grid">
                        {rootLexicon.derivatives.map((item) => (
                          <div key={`${item.form}-${item.count}`} className="study-root-derivative-card">
                            <span className="study-root-derivative-form" lang="ar" dir="rtl">
                              {item.form}
                            </span>
                            <span className="study-root-derivative-count">{item.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {rootLexicon?.surahOccurrences?.length ? (
                    <div className="study-lexicon-section">
                      <h4>Surah Breakdown</h4>
                      <div className="study-root-surah-list">
                        {rootLexicon.surahOccurrences.map((item) => {
                          const ayahItems = ayahsBySurah.get(item.surah) || [];
                          const visibleAyahItems = ayahItems.slice(0, 2);
                          const remainingAyahs = Math.max(ayahItems.length - visibleAyahItems.length, 0);
                          const visibleDerivatives = item.derivatives.slice(0, 4);
                          const hiddenDerivativeCount = Math.max(item.derivatives.length - visibleDerivatives.length, 0);

                          return (
                            <div key={item.surah} className="study-root-surah-card">
                              <div className="study-root-surah-header">
                                <div className="study-root-surah-heading">
                                  <span className="study-root-surah-name">
                                    {item.surah}. {item.surahName}
                                  </span>
                                </div>
                                <span className="study-root-surah-total">{item.totalRootInSurah}x</span>
                              </div>
                              {visibleAyahItems.length ? (
                                <div className="study-root-surah-preview-list">
                                  {visibleAyahItems.map((ayahItem) => (
                                    <button
                                      key={`${item.surah}:${ayahItem.ayah}`}
                                      type="button"
                                      className="study-root-surah-preview"
                                      onClick={() => {
                                        onCloseRootDetailsModal();
                                        onJumpToAyah(ayahItem.surah, ayahItem.ayah);
                                      }}
                                    >
                                      <span className="study-root-surah-preview-ref">
                                        {ayahItem.surah}:{ayahItem.ayah}
                                      </span>
                                      <span
                                        className="study-root-surah-preview-text"
                                        lang="ar"
                                        dir="rtl"
                                      >
                                        {renderHighlightedAyah(ayahItem.highlightedHtml || ayahItem.text)}
                                      </span>
                                    </button>
                                  ))}
                                  {remainingAyahs ? (
                                    <span className="study-root-surah-preview-more">
                                      +{remainingAyahs} more ayahs
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="study-lexicon-chip-row study-root-surah-chip-row">
                                {visibleDerivatives.map((derivative) => (
                                <span
                                  key={`${item.surah}-${derivative.form}-${derivative.count}`}
                                  className="study-root-surah-chip"
                                >
                                  <span lang="ar" dir="rtl">
                                    {derivative.form}
                                  </span>
                                  <span>{derivative.count}x</span>
                                </span>
                                ))}
                                {hiddenDerivativeCount ? (
                                  <span className="study-root-surah-chip is-summary">
                                    +{hiddenDerivativeCount} more forms
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {rootExplorerUnavailable ? (
                    <p className="study-lexicon-unavailable">
                      No saved root snapshot exists for this root yet.
                    </p>
                  ) : null}

                  {lexSnapshotUnavailable ? (
                    <p className="study-lexicon-unavailable">
                      No saved word-definition snapshot exists for this root yet.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
