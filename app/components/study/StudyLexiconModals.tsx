"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { RootLexiconPayload, SelectedWordDetails } from "./StudyModeTypes";

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
  onPlayWordAudio
}: StudyLexiconModalsProps) {
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

      <AnimatePresence>
        {selectedWordDetails && isRootModalOpen && (
          <motion.div
            className="study-lexicon-backdrop root-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseRootModal}
          >
            <motion.div
              className="study-lexicon-modal root-modal"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
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
                    <div className="study-lexicon-meta-grid">
                      <div className="study-lexicon-meta-item">
                        <span className="study-lexicon-label">Arabic</span>
                        <span className="study-lexicon-value">
                          {rootLexicon?.rootArabic || selectedWordDetails.rootArabic || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="study-lexicon-section">
                      <h4>Core Meanings</h4>
                      {rootLexicon?.coreMeanings?.length ? (
                        <div className="study-lexicon-chip-row">
                          {rootLexicon.coreMeanings.map((meaning) => (
                            <span key={meaning} className="study-lexicon-chip">
                              {meaning}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="study-lexicon-unavailable">No Lane meanings found for this root.</p>
                      )}
                    </div>

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
                          {rootLexicon.references.map((ref) => (
                            <span key={ref} className="study-lexicon-ref">
                              {ref}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="study-lexicon-unavailable">No references found.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
