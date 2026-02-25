"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RootLexiconPayload, SelectedWordDetails } from "./StudyModeTypes";

const LANE_ABBREVIATION_GUIDE = [
  { code: "S", meaning: "as-Sihah (al-Jawhari)" },
  { code: "Msb", meaning: "al-Misbah al-Munir" },
  { code: "K", meaning: "al-Qamus al-Muhit" },
  { code: "*", meaning: "editorial emphasis marker in the source text" }
] as const;

type StudyLexiconModalsProps = {
  selectedWordDetails: SelectedWordDetails | null;
  isRootModalOpen: boolean;
  selectedRoot: string;
  selectedRootArabic: string;
  rootMeaningSummary: string;
  laneActionLabel: string;
  rootLexiconError: string | null;
  rootLexiconLoading: boolean;
  rootLexicon: RootLexiconPayload | null;
  onCloseWordDetails: () => void;
  onCloseRootModal: () => void;
  onOpenRootDetails: (root?: string) => void;
  onPlayWordAudio: (audioUrl?: string) => void;
  onJumpToAyah: (surah: number, ayah: number) => void;
};

export default function StudyLexiconModals({
  selectedWordDetails,
  isRootModalOpen,
  selectedRoot,
  selectedRootArabic,
  rootMeaningSummary,
  laneActionLabel,
  rootLexiconError,
  rootLexiconLoading,
  rootLexicon,
  onCloseWordDetails,
  onCloseRootModal,
  onOpenRootDetails,
  onPlayWordAudio,
  onJumpToAyah
}: StudyLexiconModalsProps) {
  const [showAbbreviationGuide, setShowAbbreviationGuide] = useState(false);

  const parseReference = (value: string) => {
    const match = String(value || "").trim().match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
    if (!match) return null;
    const surah = Number(match[1]);
    const ayah = Number(match[2]);
    if (!Number.isInteger(surah) || !Number.isInteger(ayah)) return null;
    if (surah < 1 || surah > 114 || ayah < 1) return null;
    return { surah, ayah };
  };

  useEffect(() => {
    if (!isRootModalOpen) {
      setShowAbbreviationGuide(false);
    }
  }, [isRootModalOpen]);

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
                <div>
                  <p className="study-lexicon-eyebrow">Word</p>
                  <h3>Word Details</h3>
                </div>
                <button className="study-lexicon-close" onClick={onCloseWordDetails} type="button">
                  ✕
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

                  <p className="study-lexicon-word" lang="ar" dir="rtl">
                    {selectedWordDetails.arabic}
                  </p>
                </div>

                {selectedWordDetails.translation ? (
                  <p className="study-lexicon-translation">{selectedWordDetails.translation}</p>
                ) : null}

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
                        onClick={() => onOpenRootDetails(selectedRoot)}
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

                  {selectedWordDetails.audioUrl ? (
                    <button
                      type="button"
                      className="study-word-audio-btn"
                      onClick={() => onPlayWordAudio(selectedWordDetails.audioUrl)}
                    >
                      Play word audio
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedWordDetails && isRootModalOpen ? (
        <div className="study-lexicon-backdrop root-layer" onClick={onCloseRootModal}>
          <div
            className="study-lexicon-modal root-modal"
            onClick={(event) => event.stopPropagation()}
          >
              <div className="study-lexicon-header">
                <div>
                  <p className="study-lexicon-eyebrow">Lane Lexicon</p>
                  <h3>{selectedWordDetails.rootArabic || rootLexicon?.rootArabic || "Root"}</h3>
                </div>
                <button className="study-lexicon-close" onClick={onCloseRootModal} type="button">
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
                                  onCloseRootModal();
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
    </>
  );
}
