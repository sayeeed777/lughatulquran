"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { MotionStyle } from "framer-motion";

type AyahTranslation = { text?: string };

type Ayah = {
  number: number;
  arabic?: string;
  translations?: Record<string, AyahTranslation>;
};

type Word = {
  arabic: string;
  translation?: string;
  audioUrl?: string;
};

type NowPlaying = { surah: number; ayah: number } | null;

type AyahCardProps = {
  ayah: Ayah;
  surahNumber: number;
  selectedTranslations?: string[] | string;
  isSaved?: boolean;
  hasNote?: boolean;
  isFocused?: boolean;
  nowPlaying?: NowPlaying;
  isAudioPaused?: boolean;
  words?: Word[];
  showWordByWord?: boolean;
  copiedKey?: string | null;
  verseKey: string;
  onFocus: (key: string) => void;
  onPlay: (surah: number, ayah: number) => void;
  onTogglePlay?: (surah: number, ayah: number) => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
  onOpenNote: (surah: number, ayah: number) => void;
  onCompare: (ayah: Ayah) => void;
  onCopyLink?: (surah: number, ayah: number) => void;
  formatArabic: (text: string) => string;
  index: number;
};

const AyahCard = memo(function AyahCard({
  ayah,
  surahNumber,
  selectedTranslations = ["en.arberry"],
  isSaved,
  hasNote,
  isFocused,
  nowPlaying,
  isAudioPaused,
  words = [],
  showWordByWord,
  copiedKey,
  verseKey,
  onFocus,
  onPlay,
  onTogglePlay,
  onToggleBookmark,
  onOpenNote,
  onCompare,
  onCopyLink,
  formatArabic,
  index
}: AyahCardProps) {
  // Support both array and single string for backwards compatibility
  const translationIds = Array.isArray(selectedTranslations) ? selectedTranslations : [selectedTranslations];
  const key = verseKey;
  const isNowPlaying =
    nowPlaying && nowPlaying.surah === surahNumber && nowPlaying.ayah === ayah.number;
  const isPlaying = isNowPlaying && !isAudioPaused;

  // Translation label map
  const translationLabels: Record<string, string> = {
    "en.sahih": "Sahih International",
    "en.arberry": "A.J. Arberry",
    "en.pickthall": "Pickthall",
    "en.yusufali": "Yusuf Ali"
  };

  const itemStyle: MotionStyle & Record<string, string | number> = { "--i": index };

  return (
    <motion.li
      id={`ayah-${ayah.number}`}
      className={`ayah-card${isFocused ? " focused" : ""}`}
      style={itemStyle}
      tabIndex={0}
      onClick={() => {
        onFocus(key);
        onPlay(surahNumber, ayah.number);
      }}
      onFocus={() => onFocus(key)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="ayah-header">
        <span className="ayah-number">Ayah {ayah.number}</span>
        <div className="ayah-actions">
          <button
            className={`action-icon-btn play-icon${isPlaying ? " playing" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onTogglePlay) {
                onTogglePlay(surahNumber, ayah.number);
              } else {
                onPlay(surahNumber, ayah.number);
              }
            }}
            aria-label={isPlaying ? "Pause ayah" : "Play ayah"}
            title={isPlaying ? "Pause ayah" : "Play ayah"}
          >
            {isPlaying ? (
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
            className={`action-icon-btn${isSaved ? " saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(surahNumber, ayah.number);
            }}
            aria-label={isSaved ? "Remove bookmark" : "Save bookmark"}
            title={isSaved ? "Remove bookmark" : "Save bookmark"}
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
            onClick={(e) => {
              e.stopPropagation();
              onOpenNote(surahNumber, ayah.number);
            }}
            aria-label={hasNote ? "Edit note" : "Add note"}
            title={hasNote ? "Edit note" : "Add note"}
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
          <button
            className="action-icon-btn is-compare"
            onClick={(e) => {
              e.stopPropagation();
              onCompare(ayah);
            }}
            aria-label="Compare translations"
            title="Compare translations"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="10" height="14" rx="2" />
              <path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
              <path d="M6 10h4M6 14h4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <p className="ayah-arabic" lang="ar" dir="rtl">
        {formatArabic(ayah.arabic || "")}
      </p>

      {/* Multiple translations display */}
      <div className="ayah-translations">
        {translationIds.map((translationId) => {
          const translation = ayah.translations?.[translationId];
          return (
            <div key={translationId} className="translation-item">
              {translationIds.length > 1 && (
                <span className="translation-label">
                  {translationLabels[translationId] || translationId}
                </span>
              )}
              <p className={`ayah-translation${translationIds.length > 1 ? " multi" : ""}`}>
                {translation?.text || "Translation unavailable."}
              </p>
            </div>
          );
        })}
      </div>
      {showWordByWord && words.length > 0 && (
        <motion.div className="word-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          {words.map((word, wordIndex) => (
            <div className="word-chip" key={`${key}-${wordIndex}`}>
              <span className="word-ar" lang="ar" dir="rtl">
                {word.arabic}
              </span>
              {word.translation && <span className="word-en">{word.translation}</span>}
            </div>
          ))}
        </motion.div>
      )}
    </motion.li>
  );
});

export default AyahCard;
