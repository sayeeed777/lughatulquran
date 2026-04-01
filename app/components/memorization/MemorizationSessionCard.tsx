"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { getMemorizationReviewPreview, type SchedulerOptions } from "../../lib/memorizationScheduler";
import type {
  MemorizationCard,
  MemorizationCardMode,
  MemorizationCardState,
  MemorizationRating
} from "../../lib/types";

type Props = {
  card: MemorizationCard;
  state: MemorizationCardState | null;
  showAnswer: boolean;
  autoPlayAudio?: boolean;
  onReveal: () => void;
  onRate: (rating: MemorizationRating) => void;
  onSuspend: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  leechThreshold?: number;
  schedulerOpts?: SchedulerOptions;
};

const PROMPT: Record<MemorizationCardMode, string> = {
  "arabic-to-meaning": "Recall the meaning",
  "meaning-to-arabic": "Recall the Arabic",
  "first-words": "Continue the ayah",
  "word-by-word-meaning": "Recall the word meaning"
};

const RATINGS: Array<{ r: MemorizationRating; label: string; key: string }> = [
  { r: "again", label: "Again", key: "1" },
  { r: "hard",  label: "Hard",  key: "2" },
  { r: "good",  label: "Good",  key: "3" },
  { r: "easy",  label: "Easy",  key: "4" }
];

export default function MemorizationSessionCard({
  card, state, showAnswer, autoPlayAudio = true, onReveal, onRate, onSuspend, onUndo, canUndo, leechThreshold = 8, schedulerOpts
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Card timer
  useEffect(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [card.id]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
  };

  const status = state?.status || "new";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const isWordMode = card.cardMode === "word-by-word-meaning";

  /* Reset and auto-play audio on new card */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (autoPlayAudio) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [card.id, autoPlayAudio]);

  /* Global keyboard shortcuts */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) return;
      // Ctrl+Z / Cmd+Z = undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && canUndo && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }
      if (!showAnswer && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        onReveal();
      }
      if (showAnswer) {
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx !== -1) { e.preventDefault(); onRate(RATINGS[idx].r); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAnswer, onReveal, onRate, onUndo, canUndo]);

  const playAudio = () => audioRef.current?.play().catch(() => {});

  const handleRevealKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (showAnswer || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    onReveal();
  };

  /* Front content by card mode */
  const front = () => {
    if (isWordMode) {
      return (
        <p className="mem-card-arabic mem-card-arabic--word" lang="ar" dir="rtl">
          {card.wordArabic || card.arabic}
        </p>
      );
    }
    if (card.cardMode === "meaning-to-arabic") {
      return <p className="mem-card-meaning">{card.englishMeaning}</p>;
    }
    if (card.cardMode === "first-words") {
      return (
        <>
          <p className="mem-card-arabic" lang="ar" dir="rtl">{card.firstWords}</p>
          <p className="mem-card-hint">Continue from these words…</p>
        </>
      );
    }
    return (
      <>
        <p className="mem-card-arabic" lang="ar" dir="rtl">{card.arabic}</p>
        <p className="mem-card-hint">What does this mean?</p>
      </>
    );
  };

  return (
    <div className="mem-flashcard">
      <audio ref={audioRef} src={card.audioUrl} preload="none" />

      {/* Header row */}
      <div className="mem-card-header">
        <div className="mem-card-header-left">
          <span className={`mem-status-dot ${status}`} />
          <span className="mem-card-verse">{card.verseKey}</span>
          <span className="mem-card-status-text">{statusLabel}</span>
          {state && state.lapses >= leechThreshold && <span className="mem-leech-badge">Leech</span>}
        </div>
        <div className="mem-card-header-right">
          <span className="mem-card-timer">{formatElapsed(elapsed)}</span>
          <button
            type="button"
            className="mem-icon-btn"
            onClick={playAudio}
            aria-label={isWordMode ? "Play word audio" : "Play audio"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/></svg>
          </button>
          {!showAnswer && (
            <button type="button" className="mem-icon-btn" onClick={onSuspend} aria-label="Hide this card from future sessions" title="Hide card">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Card surface */}
      <div
        className={`mem-card-body${!showAnswer ? " mem-card-body--front" : ""}`}
        onClick={!showAnswer ? onReveal : undefined}
        onKeyDown={handleRevealKey}
        role={!showAnswer ? "button" : undefined}
        tabIndex={!showAnswer ? 0 : undefined}
        aria-label={!showAnswer ? "Reveal answer" : undefined}
      >
        {!showAnswer ? (
          <div className="mem-card-front">
            {!isWordMode && <span className="mem-card-prompt-label">{PROMPT[card.cardMode]}</span>}
            {front()}
            <span className="mem-card-tap-hint">Tap card or press Space</span>
          </div>
        ) : (
          <div className="mem-card-back">
            {isWordMode ? (
              <>
                <div className="mem-answer-section">
                  <span className="mem-answer-label">Word</span>
                  <p className="mem-card-arabic mem-card-arabic--word" lang="ar" dir="rtl">
                    {card.wordArabic || card.arabic}
                  </p>
                </div>
                <div className="mem-answer-divider" />
                <div className="mem-answer-section">
                  <span className="mem-answer-label">Meaning</span>
                  <p className="mem-card-meaning">{card.wordMeaning || "Meaning unavailable."}</p>
                </div>
                {card.contextArabic && (
                  <>
                    <div className="mem-answer-divider" />
                    <div className="mem-answer-section">
                      <span className="mem-answer-label">Ayah context</span>
                      <p className="mem-card-context-arabic" lang="ar" dir="rtl">{card.contextArabic}</p>
                    </div>
                  </>
                )}
                {card.contextMeaning && (
                  <>
                    <div className="mem-answer-divider" />
                    <div className="mem-answer-section">
                      <span className="mem-answer-label">Ayah meaning</span>
                      <p className="mem-card-context-meaning">{card.contextMeaning}</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mem-answer-section">
                  <span className="mem-answer-label">Arabic</span>
                  <p className="mem-card-arabic" lang="ar" dir="rtl">{card.arabic}</p>
                </div>
                <div className="mem-answer-divider" />
                <div className="mem-answer-section">
                  <span className="mem-answer-label">Meaning</span>
                  <p className="mem-card-meaning">{card.englishMeaning}</p>
                </div>
                {card.transliteration && (
                  <>
                    <div className="mem-answer-divider" />
                    <div className="mem-answer-section">
                      <span className="mem-answer-label">Transliteration</span>
                      <p className="mem-card-translit">{card.transliteration}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!showAnswer ? (
        <div className="mem-card-actions">
          <button
            type="button"
            className="mem-btn mem-btn--primary mem-btn--lg mem-btn--full"
            onClick={onReveal}
          >
            Show Answer
          </button>
        </div>
      ) : (
        <div className="mem-rating-row">
          {RATINGS.map((opt) => (
            <button
              key={opt.r}
              type="button"
              className={`mem-rate-btn mem-rate-btn--${opt.r}`}
              onClick={() => onRate(opt.r)}
            >
              <span className="mem-rate-label">{opt.label}</span>
              <span className="mem-rate-interval">{getMemorizationReviewPreview(state || undefined, opt.r, schedulerOpts)}</span>
              <span className="mem-rate-key">{opt.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
