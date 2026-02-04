"use client";

import { motion } from "framer-motion";

export default function AyahCard({
  ayah,
  surahNumber,
  selectedTranslation,
  isSaved,
  hasNote,
  isFocused,
  words,
  showWordByWord,
  copiedKey,
  verseKey,
  onFocus,
  onPlay,
  onToggleBookmark,
  onOpenNote,
  onCompare,
  onCopyLink,
  formatArabic,
  index
}) {
  const translation = ayah.translations?.[selectedTranslation];
  const key = verseKey;

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
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(surahNumber, ayah.number);
            }}
          >
            Play
          </button>
          <button
            className={`action-btn${isSaved ? " saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(surahNumber, ayah.number);
            }}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            className={`action-btn${hasNote ? " saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenNote(surahNumber, ayah.number);
            }}
          >
            {hasNote ? "Edit note" : "Add note"}
          </button>
          <button
            className="compare-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCompare(ayah);
            }}
          >
            Compare
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
