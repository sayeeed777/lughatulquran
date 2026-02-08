"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Surah } from "../../lib/types";

type MemorizeMode = "single" | "range" | "surah";

type MemorizeDraft = {
  startAyah: number;
  endAyah: number;
  loops: number;
};

type StudyMemorizeModalProps = {
  isOpen: boolean;
  selectedSurah: Surah | null;
  memorizeMode: MemorizeMode;
  memorizeDraft: MemorizeDraft;
  memorizeActive: boolean;
  onClose: () => void;
  onApplyMode: (mode: MemorizeMode) => void;
  onUpdateStart: (value: number) => void;
  onUpdateEnd: (value: number) => void;
  onUpdateLoops: (delta: number) => void;
  onStartMemorize: (config: { startAyah?: number; endAyah?: number; loops?: number }) => void;
  onStopMemorize: () => void;
};

export default function StudyMemorizeModal({
  isOpen,
  selectedSurah,
  memorizeMode,
  memorizeDraft,
  memorizeActive,
  onClose,
  onApplyMode,
  onUpdateStart,
  onUpdateEnd,
  onUpdateLoops,
  onStartMemorize,
  onStopMemorize
}: StudyMemorizeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="memorize-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            className="memorize-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Repeat settings"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="memorize-modal-header">
              <div>
                <h3>Repeat Settings</h3>
                <p>{selectedSurah?.englishName || "Surah"}</p>
              </div>
              <button className="memorize-close" onClick={onClose} aria-label="Close" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="memorize-segmented">
              <button
                className={`memorize-segment${memorizeMode === "single" ? " active" : ""}`}
                onClick={() => onApplyMode("single")}
                type="button"
              >
                Single Verse
              </button>
              <button
                className={`memorize-segment${memorizeMode === "range" ? " active" : ""}`}
                onClick={() => onApplyMode("range")}
                type="button"
              >
                Range
              </button>
              <button
                className={`memorize-segment${memorizeMode === "surah" ? " active" : ""}`}
                onClick={() => onApplyMode("surah")}
                type="button"
              >
                Full Surah
              </button>
            </div>

            <div className="memorize-range">
              {memorizeMode === "surah" ? (
                <div className="memorize-range-summary">
                  {selectedSurah?.englishName || "Surah"} · {selectedSurah?.numberOfAyahs || 0} ayahs
                </div>
              ) : (
                <div className="memorize-range-grid">
                  <label>
                    <span>Start ayah</span>
                    <input
                      type="number"
                      min={1}
                      max={selectedSurah?.numberOfAyahs || 1}
                      value={memorizeDraft.startAyah}
                      onChange={(event) => onUpdateStart(Number(event.target.value))}
                    />
                  </label>
                  {memorizeMode === "range" && (
                    <label>
                      <span>End ayah</span>
                      <input
                        type="number"
                        min={memorizeDraft.startAyah}
                        max={selectedSurah?.numberOfAyahs || 1}
                        value={memorizeDraft.endAyah}
                        onChange={(event) => onUpdateEnd(Number(event.target.value))}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="memorize-steps">
              <div className="memorize-step-row">
                <span>Repeat range</span>
                <div className="memorize-stepper">
                  <button type="button" onClick={() => onUpdateLoops(-1)} aria-label="Decrease repeats">
                    -
                  </button>
                  <span className="stepper-value">
                    {memorizeDraft.loops === 0 ? "∞" : memorizeDraft.loops}
                  </span>
                  <button type="button" onClick={() => onUpdateLoops(1)} aria-label="Increase repeats">
                    +
                  </button>
                </div>
                <span className="stepper-suffix">times</span>
              </div>
              <p className="memorize-hint">Set repeats to 0 for infinite looping.</p>
            </div>

            <div className="memorize-footer">
              {memorizeActive && (
                <button
                  className="memorize-ghost"
                  onClick={() => {
                    onStopMemorize();
                    onClose();
                  }}
                  type="button"
                >
                  Stop
                </button>
              )}
              <button className="memorize-ghost" onClick={onClose} type="button">
                Cancel
              </button>
              <button
                className="memorize-primary"
                onClick={() => {
                  const startAyah = memorizeMode === "surah" ? 1 : memorizeDraft.startAyah;
                  const endAyah =
                    memorizeMode === "surah"
                      ? selectedSurah?.numberOfAyahs || startAyah
                      : memorizeMode === "single"
                        ? startAyah
                        : memorizeDraft.endAyah;
                  onStartMemorize({
                    startAyah,
                    endAyah,
                    loops: memorizeDraft.loops
                  });
                  onClose();
                }}
                type="button"
              >
                Start
              </button>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export type { MemorizeMode, MemorizeDraft, StudyMemorizeModalProps };
