"use client";

import { Fragment, memo, useCallback, useEffect, useRef, useState } from "react";
import type { Ayah, Word, NowPlaying } from "../../lib/types";
import { normalizeQuranDisplayArabic } from "../../lib/utils";

type AyahCardProps = {
  ayah: Ayah;
  surahNumber: number;
  selectedTranslations?: string[] | string;
  isSaved?: boolean;
  hasNote?: boolean;
  isFocused?: boolean;
  nowPlaying?: NowPlaying | null;
  activeWordPosition?: number | null;
  isAudioPaused?: boolean;
  words?: Word[];
  showWordByWord?: boolean;
  showTransliteration?: boolean;
  verseKey: string;
  onFocus: (key: string) => void;
  onPlay: (surah: number, ayah: number) => void;
  onTogglePlay?: (surah: number, ayah: number) => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
  onOpenNote: (surah: number, ayah: number) => void;
  onCompare: (ayah: Ayah) => void;
  onCopyLink?: (surah: number, ayah: number) => void;
  onShare?: (ayah: Ayah, surahNumber: number) => void;
  formatArabic: (text: string) => string;
};

const AyahCard = memo(function AyahCard({
  ayah,
  surahNumber,
  selectedTranslations = ["en-arberry"],
  isSaved,
  hasNote,
  isFocused,
  nowPlaying,
  activeWordPosition,
  isAudioPaused,
  words = [],
  showWordByWord,
  showTransliteration = false,
  verseKey,
  onFocus,
  onPlay,
  onTogglePlay,
  onToggleBookmark,
  onOpenNote,
  onCompare,
  onShare,
  formatArabic
}: AyahCardProps) {
  // Support both array and single string for backwards compatibility
  const translationIds = Array.isArray(selectedTranslations) ? selectedTranslations : [selectedTranslations];
  const key = verseKey;
  const isNowPlaying =
    nowPlaying && nowPlaying.surah === surahNumber && nowPlaying.ayah === ayah.number;
  const isPlaying = isNowPlaying && !isAudioPaused;
  const hasInteractiveWords = words.length > 0;
  const shouldSplitArabic = hasInteractiveWords;
  const formattedArabic = formatArabic(ayah.arabic || "");

  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const [tapPlayingPosition, setTapPlayingPosition] = useState<number | null>(null);

  const playWordAudio = useCallback((word: Word, position: number) => {
    if (!word.audioUrl) return;
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      wordAudioRef.current.src = "";
      wordAudioRef.current = null;
    }
    const audio = new Audio(word.audioUrl);
    wordAudioRef.current = audio;
    setTapPlayingPosition(position);
    const clear = () => {
      if (wordAudioRef.current === audio) {
        wordAudioRef.current = null;
      }
      setTapPlayingPosition((prev) => (prev === position ? null : prev));
    };
    audio.addEventListener("ended", clear);
    audio.addEventListener("error", clear);
    audio.play().catch(clear);
  }, []);

  useEffect(() => {
    return () => {
      if (wordAudioRef.current) {
        wordAudioRef.current.pause();
        wordAudioRef.current.src = "";
        wordAudioRef.current = null;
      }
    };
  }, []);

  // Translation label map
  const translationLabels: Record<string, string> = {
    "en-sahih": "Sahih International",
    "en-arberry": "A.J. Arberry",
    "en-pickthall": "Pickthall",
    "en-yusufali": "Yusuf Ali",
    "en-taqi-usmani": "Mufti Taqi Usmani",
    "en-haleem": "Abdel Haleem",
    "en-muhsin-khan": "Al-Hilali & Khan",
    "en-maarif-ul-quran": "Maarif-ul-Quran",
    "en-ahmedraza": "Kanz al-Iman (English)",
    "hi-hindi": "Hindi (Azizul Haq Al-Umari)",
    "si-naseem-ismail": "Sinhala (Naseem Ismail)",
    "fr-hamidullah": "French (Muhammad Hamidullah)",
    "de-bubenheim": "German (Bubenheim & Elyas)",
    "es-cortes": "Spanish (Julio Cortes)",
    "tr-ates": "Turkish (Suleyman Ates)",
    "bn-bengali": "Bangla (Muhiuddin Khan)",
    "bn-hoque": "Bangla (Zohurul Hoque)",
    "ur-kanzuliman": "Kanz al-Iman (Urdu)",
    "bayan-ul-quran": "Bayan-ul-Quran"
  };

  return (
    <li
      id={`ayah-${ayah.number}`}
      className={`ayah-card${isFocused ? " focused" : ""}`}
      tabIndex={0}
      onClick={() => {
        onFocus(key);
        onPlay(surahNumber, ayah.number);
      }}
      onFocus={() => onFocus(key)}
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
            className={`action-icon-btn ayah-note-btn${hasNote ? " saved" : ""}`}
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
          {onShare && (
            <button
              className="action-icon-btn ayah-share-btn"
              onClick={(e) => {
                e.stopPropagation();
                onShare(ayah, surahNumber);
              }}
              aria-label="Share ayah"
              title="Share ayah"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}
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
      {shouldSplitArabic ? (
        <p className="ayah-arabic ayah-arabic-highlightable" lang="ar" dir="rtl">
          {words.map((word, wordIndex) => {
            const position = Number(word.position) || wordIndex + 1;
            const isActiveWord = isPlaying && activeWordPosition === position;
            const isTapActive = tapPlayingPosition === position;
            return (
              <Fragment key={`${key}-arabic-word-${position}-${wordIndex}`}>
                <button
                  type="button"
                  className={`ayah-arabic-word${isActiveWord ? " active" : ""}${isTapActive ? " tap-playing" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    playWordAudio(word, position);
                  }}
                  aria-label={`Play word ${position}`}
                >
                  {normalizeQuranDisplayArabic(word.arabic)}
                </button>
                {wordIndex < words.length - 1 ? " " : null}
              </Fragment>
            );
          })}
        </p>
      ) : (
        <p className="ayah-arabic" lang="ar" dir="rtl">
          {formattedArabic}
        </p>
      )}
      {showTransliteration && ayah.transliteration ? (
        <p dir="auto" className="ayah-transliteration">
          {ayah.transliteration}
        </p>
      ) : null}

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
              <p dir="auto" className={`ayah-translation${translationIds.length > 1 ? " multi" : ""}`}>
                {translation?.text || "Translation unavailable."}
              </p>
            </div>
          );
        })}
      </div>
      {showWordByWord && words.length > 0 && (
        <div className="word-row">
          {words.map((word, wordIndex) => (
            <div className="word-chip" key={`${key}-${wordIndex}`}>
              <span className="word-ar" lang="ar" dir="rtl">
                {normalizeQuranDisplayArabic(word.arabic)}
              </span>
              {word.translation && <span className="word-en">{word.translation}</span>}
            </div>
          ))}
        </div>
      )}
    </li>
  );
});

export default AyahCard;
