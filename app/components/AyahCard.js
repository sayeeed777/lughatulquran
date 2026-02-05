"use client";

import { motion } from "framer-motion";

export default function AyahCard({
  ayah,
  surahNumber,
  selectedTranslation,
  isSaved,
  hasNote,
  isFocused,
  nowPlaying,
  isAudioPaused,
  words,
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
}) {
  const translation = ayah.translations?.[selectedTranslation];
  const key = verseKey;
  const isNowPlaying =
    nowPlaying &&
    nowPlaying.surah === surahNumber &&
    nowPlaying.ayah === ayah.number;
  const isPlaying = isNowPlaying && !isAudioPaused;

  return (
    <motion.li
      id={`ayah-${ayah.number}`}
      className={`ayah-card${isFocused ? " focused" : ""}`}
      style={{ "--i": index }}
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
        {formatArabic(ayah.arabic)}
      </p>
      <p className="ayah-translation">
        {translation?.text || "Translation unavailable."}
      </p>
      {showWordByWord && words.length > 0 && (
        <motion.div
          className="word-row"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          {words.map((word, wordIndex) => (
            <div className="word-chip" key={`${key}-${wordIndex}`}>
              <span className="word-ar" lang="ar" dir="rtl">
                {word.arabic}
              </span>
              {word.translation && (
                <span className="word-en">{word.translation}</span>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </motion.li>
  );
}
