"use client";

import { memo, useEffect, useRef } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode
} from "react";
import { motion } from "framer-motion";

type StudyWord = {
  arabic: string;
  translation?: string;
  audioUrl?: string;
  position?: number;
  lemma?: string;
  root?: string;
  rootArabic?: string;
};

type StudyAyahCardProps = {
  ayahNumber: number;
  animationDelay: number;
  cardId: string;
  isActivePlay: boolean;
  isFocused: boolean;
  isMarked: boolean;
  isDimmed: boolean;
  arabicContent: ReactNode;
  translationText: string;
  showTranslation: boolean;
  isMushafView: boolean;
  showWordByWord: boolean;
  words: StudyWord[];
  wordLoading: boolean;
  wordAudioUrl: string | null;
  selectedWordPosition?: number | null;
  isBookmarked: boolean;
  hasNote: boolean;
  resolveWordAudioUrl: (audioUrl?: string) => string;
  onFocusAyah: () => void;
  onOpenMemorize: () => void;
  onTogglePlay: () => void;
  onToggleBookmark: () => void;
  onOpenTafsir: () => void;
  onOpenNote: () => void;
  onToggleStudyMark: () => void;
  onWordSelect: (word: StudyWord, ayahNumber: number, wordIndex: number) => void;
  onWordAudio: (audioUrl?: string) => void;
};

function StudyAyahCardComponent({
  ayahNumber,
  animationDelay,
  cardId,
  isActivePlay,
  isFocused,
  isMarked,
  isDimmed,
  arabicContent,
  translationText,
  showTranslation,
  isMushafView,
  showWordByWord,
  words,
  wordLoading,
  wordAudioUrl,
  selectedWordPosition,
  isBookmarked,
  hasNote,
  resolveWordAudioUrl,
  onFocusAyah,
  onOpenMemorize,
  onTogglePlay,
  onToggleBookmark,
  onOpenTafsir,
  onOpenNote,
  onToggleStudyMark,
  onWordSelect,
  onWordAudio
}: StudyAyahCardProps) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    return target instanceof Element && Boolean(
      target.closest("button, a, input, textarea, select, [role='button']")
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onToggleStudyMark();
    }, 450);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointerStartRef.current || !longPressTimerRef.current) return;
    const dx = event.clientX - pointerStartRef.current.x;
    const dy = event.clientY - pointerStartRef.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearLongPressTimer();
    }
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
  };

  const handleCardClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return;
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onFocusAyah();
  };

  useEffect(() => {
    return () => clearLongPressTimer();
  }, []);

  return (
    <motion.article
      id={`ayah-${ayahNumber}`}
      className={`study-ayah-card${isActivePlay ? " playing" : ""}${isFocused ? " focused" : ""}${isMarked ? " marked" : ""}${isDimmed ? " dimmed" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      onClick={handleCardClick}
      onFocus={onFocusAyah}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      tabIndex={0}
    >
      <div className="study-ayah-content">
        <div className="ayah-header study-ayah-header">
          <span className="ayah-number">Ayah {ayahNumber}</span>
          <div className="ayah-actions study-ayah-actions">
            <button
              className="action-icon-btn memorize-icon"
              onClick={(event) => {
                event.stopPropagation();
                onOpenMemorize();
              }}
              aria-label="Memorize / Repeat"
              title="Memorize / Repeat"
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M17 2l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 12v-2a4 4 0 0 1 4-4h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 22l-4-4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 14v2a4 4 0 0 1-4 4H3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={`action-icon-btn play-icon${isActivePlay ? " playing" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                onTogglePlay();
              }}
              aria-label={isActivePlay ? "Pause ayah" : "Play ayah"}
              title={isActivePlay ? "Pause ayah" : "Play ayah"}
              type="button"
            >
              {isActivePlay ? (
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
            <button
              className={`action-icon-btn${isBookmarked ? " saved" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBookmark();
              }}
              aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
              title={isBookmarked ? "Remove bookmark" : "Save bookmark"}
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 3h12a2 2 0 0 1 2 2v16l-8-5-8 5V5a2 2 0 0 1 2-2z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="action-icon-btn"
              onClick={(event) => {
                event.stopPropagation();
                onOpenTafsir();
              }}
              aria-label="Open tafsir"
              title="Open tafsir"
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 4h14a2 2 0 0 1 2 2v13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 4v13a2 2 0 0 0 2 2h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 8h8M8 12h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={`action-icon-btn${hasNote ? " saved" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                onOpenNote();
              }}
              aria-label={hasNote ? "Edit note" : "Add note"}
              title={hasNote ? "Edit note" : "Add note"}
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 20h9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        {words.length > 0 ? (
          <div
            className="study-ayah-arabic study-ayah-arabic-interactive"
            lang="ar"
            dir="rtl"
          >
            {words.map((word, wordIndex) => {
              const position = Number(word.position) || wordIndex + 1;
              const isSelected = selectedWordPosition === position;
              return (
                <button
                  key={`${cardId}-arabic-word-${position}`}
                  type="button"
                  className={`study-ayah-word-trigger${isSelected ? " active" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onWordSelect(word, ayahNumber, wordIndex);
                  }}
                >
                  {word.arabic}
                </button>
              );
            })}
          </div>
        ) : (
          <p
            className="study-ayah-arabic"
            lang="ar"
            dir="rtl"
          >
            {arabicContent}
          </p>
        )}
        {!isMushafView && showTranslation && translationText && (
          <p className="study-ayah-translation">
            {translationText}
          </p>
        )}
        {showWordByWord && (
          <div className="study-word-row">
            {wordLoading && words.length === 0 && <span className="meta">Loading words...</span>}
            {words.map((word, wordIndex) => {
              const resolvedAudioUrl = resolveWordAudioUrl(word.audioUrl);
              return (
                <button
                  key={`${cardId}-${wordIndex}`}
                  className={`study-word-chip${resolvedAudioUrl && wordAudioUrl === resolvedAudioUrl ? " playing" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onWordAudio(word.audioUrl);
                  }}
                  type="button"
                >
                  <span className="word-ar" lang="ar" dir="rtl">
                    {word.arabic}
                  </span>
                  {word.translation && <span className="word-en">{word.translation}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.article>
  );
}

const StudyAyahCard = memo(StudyAyahCardComponent);

export default StudyAyahCard;
export type { StudyAyahCardProps, StudyWord };
