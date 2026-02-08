"use client";

import { memo } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

type StudyWord = {
  arabic: string;
  translation?: string;
  audioUrl?: string;
};

type StudyAyahCardProps = {
  ayahNumber: number;
  animationDelay: number;
  cardId: string;
  isActivePlay: boolean;
  isFocused: boolean;
  isDimmed: boolean;
  arabicContent: ReactNode;
  translationText: string;
  showTranslation: boolean;
  isMushafView: boolean;
  fontScaleArabic: number;
  fontScaleTranslation: number;
  showWordByWord: boolean;
  words: StudyWord[];
  wordLoading: boolean;
  wordAudioUrl: string | null;
  isBookmarked: boolean;
  hasNote: boolean;
  resolveWordAudioUrl: (audioUrl?: string) => string;
  onFocusAyah: () => void;
  onOpenMemorize: () => void;
  onTogglePlay: () => void;
  onToggleBookmark: () => void;
  onOpenNote: () => void;
  onWordAudio: (audioUrl?: string) => void;
};

function StudyAyahCardComponent({
  ayahNumber,
  animationDelay,
  cardId,
  isActivePlay,
  isFocused,
  isDimmed,
  arabicContent,
  translationText,
  showTranslation,
  isMushafView,
  fontScaleArabic,
  fontScaleTranslation,
  showWordByWord,
  words,
  wordLoading,
  wordAudioUrl,
  isBookmarked,
  hasNote,
  resolveWordAudioUrl,
  onFocusAyah,
  onOpenMemorize,
  onTogglePlay,
  onToggleBookmark,
  onOpenNote,
  onWordAudio
}: StudyAyahCardProps) {
  return (
    <motion.article
      id={`ayah-${ayahNumber}`}
      className={`study-ayah-card${isActivePlay ? " playing" : ""}${isFocused ? " focused" : ""}${isDimmed ? " dimmed" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      onClick={onFocusAyah}
      onFocus={onFocusAyah}
      tabIndex={0}
    >
      <div className="study-ayah-content">
        <div className="ayah-header study-ayah-header">
          <span className="ayah-number">Ayah {ayahNumber}</span>
          <div className="ayah-actions">
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
        <p
          className="study-ayah-arabic"
          lang="ar"
          dir="rtl"
          style={{ fontSize: `calc(2rem * ${fontScaleArabic || 1})` }}
        >
          {arabicContent}
        </p>
        {!isMushafView && showTranslation && translationText && (
          <p
            className="study-ayah-translation"
            style={{ fontSize: `calc(1rem * ${fontScaleTranslation || 1})` }}
          >
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
