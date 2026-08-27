"use client";

import { useMemo } from "react";
import StudyAyahCard from "./StudyAyahCard";
import { renderTajweedMarkup } from "./StudyModeHelpers";
import { normalizeQuranDisplayArabic } from "../../lib/utils";
import type {
  SelectedWordDetails,
  StudyMarks,
  Word,
  WordByAyah
} from "./StudyModeTypes";
import type { Ayah } from "../../lib/types";

type StudyAyahItem = Ayah & {
  surahNumber?: number;
  verseKey?: string;
};

// Keep the empty word collection referentially stable so playback/focus
// updates do not invalidate every memoized ayah card when word-by-word data is
// hidden or unavailable.
const EMPTY_STUDY_WORDS: Word[] = [];

type StudyAyahListProps = {
  ayahs: StudyAyahItem[];
  selectedSurahNumber: number;
  surahByNumber: Map<number, { englishName: string; name: string }>;
  verseKey: (surah: number, ayah: number) => string;
  viewMode: "surah" | "juz" | "page";
  scopeLabel?: string;
  nowPlaying: { surah: number; ayah: number } | null;
  activeWordPosition: number | null;
  isAudioPaused: boolean;
  focusedAyahKey: string | null;
  dimNonFocused: boolean;
  studyMarks: StudyMarks;
  primaryTranslation: string;
  showTajweed: boolean;
  showTranslation: boolean;
  showTransliteration: boolean;
  isMushafView: boolean;
  showWordByWord: boolean;
  wordsByAyahForStudy: WordByAyah;
  effectiveWordLoading: boolean;
  wordAudioUrl: string | null;
  selectedWordDetails: SelectedWordDetails | null;
  isBookmarked: (surah: number, ayah: number) => boolean;
  hasNote: (surah: number, ayah: number) => unknown;
  resolveWordAudioUrl: (audioUrl?: string) => string;
  onFocusAyahKey: (key: string) => void;
  onOpenMemorize: (ayahNumber: number) => void;
  onTogglePlay: (surah: number, ayah: number) => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
  onOpenTafsir: (key: string) => void;
  onOpenNote: (surah: number, ayah: number) => void;
  onWordSelect: (word: Word, ayahNumber: number, wordIndex: number) => void;
  onWordAudio: (audioUrl?: string) => void;
  onToggleStudyMarkByKey: (key: string) => void;
  hifzMarks: StudyMarks;
  onToggleHifzMark: (key: string) => void;
  showHifzMode: boolean;
};

export default function StudyAyahList({
  ayahs,
  selectedSurahNumber,
  surahByNumber,
  verseKey,
  viewMode,
  scopeLabel,
  nowPlaying,
  activeWordPosition,
  isAudioPaused,
  focusedAyahKey,
  dimNonFocused,
  studyMarks,
  primaryTranslation,
  showTajweed,
  showTranslation,
  showTransliteration,
  isMushafView,
  showWordByWord,
  wordsByAyahForStudy,
  effectiveWordLoading,
  wordAudioUrl,
  selectedWordDetails,
  isBookmarked,
  hasNote,
  resolveWordAudioUrl,
  onFocusAyahKey,
  onOpenMemorize,
  onTogglePlay,
  onToggleBookmark,
  onOpenTafsir,
  onOpenNote,
  onWordSelect,
  onWordAudio,
  onToggleStudyMarkByKey,
  hifzMarks,
  onToggleHifzMark,
  showHifzMode
}: StudyAyahListProps) {
  // Tajweed markup produces React nodes. Prepare it only when the Quran data or
  // display settings change so audio/focus updates can preserve prop identity
  // for every unaffected memoized card in long Surahs.
  const preparedAyahs = useMemo(
    () =>
      ayahs.map((ayah, index) => {
        const ayahNum = ayah.number;
        const effectiveSurahNumber = ayah.surahNumber || selectedSurahNumber || 0;
        const key = ayah.verseKey || verseKey(effectiveSurahNumber, ayahNum);
        const previousSurahNumber = ayahs[index - 1]?.surahNumber || selectedSurahNumber || 0;
        const showSectionHeader = viewMode !== "surah" && (
          index === 0 || previousSurahNumber !== effectiveSurahNumber
        );

        return {
          ayah,
          ayahNum,
          effectiveSurahNumber,
          key,
          showSectionHeader,
          surahMeta: surahByNumber.get(effectiveSurahNumber),
          arabicContent: showTajweed && ayah.arabicTajweed
            ? renderTajweedMarkup(ayah.arabicTajweed)
            : normalizeQuranDisplayArabic(ayah.arabic || ""),
          translationText: ayah.translations?.[primaryTranslation]?.text || ""
        };
      }),
    [
      ayahs,
      primaryTranslation,
      selectedSurahNumber,
      showTajweed,
      surahByNumber,
      verseKey,
      viewMode
    ]
  );

  const ayahCards = useMemo(
    () =>
      preparedAyahs.map((preparedAyah, index) => {
        const {
          ayah,
          ayahNum,
          effectiveSurahNumber,
          key,
          showSectionHeader,
          surahMeta,
          arabicContent,
          translationText
        } = preparedAyah;
        const bookmarked = isBookmarked(effectiveSurahNumber, ayahNum);
        const noted = hasNote(effectiveSurahNumber, ayahNum);
        const isPlaying = nowPlaying?.surah === effectiveSurahNumber && nowPlaying?.ayah === ayahNum;
        const isActivePlay = isPlaying && !isAudioPaused;
        const words = effectiveSurahNumber === selectedSurahNumber && ayahNum
          ? wordsByAyahForStudy?.[ayahNum] || EMPTY_STUDY_WORDS
          : EMPTY_STUDY_WORDS;
        const isFocused = focusedAyahKey === key;
        const isMarked = Boolean(studyMarks?.[key]);
        const isMemorized = Boolean(hifzMarks?.[key]);
        const activeCardWordAudioUrl = showWordByWord && wordAudioUrl && words.some(
          (word) => resolveWordAudioUrl(word.audioUrl) === wordAudioUrl
        )
          ? wordAudioUrl
          : null;

        return (
          <div key={key || `ayah-${index}`}>
            {showSectionHeader && (
              <div className={`study-scope-section${viewMode === "page" ? " page-mode" : ""}`}>
                <span className="study-scope-section-kicker">
                  {viewMode === "page" ? scopeLabel || "Page" : "Surah"}
                </span>
                <h3 className="study-scope-section-title">
                  {surahMeta?.englishName || `Surah ${effectiveSurahNumber}`}
                </h3>
                {surahMeta?.name && (
                  <p className="study-scope-section-arabic" lang="ar" dir="rtl">
                    {surahMeta.name}
                  </p>
                )}
              </div>
            )}
            <StudyAyahCard
              ayahNumber={ayahNum}
              surahNumber={effectiveSurahNumber}
              verseKey={key}
              cardId={`ayah-${effectiveSurahNumber}-${ayahNum}`}
              scopeIndex={index + 1}
              viewMode={viewMode}
              isActivePlay={isActivePlay}
              activeWordPosition={
                isPlaying
                  ? activeWordPosition
                  : null
              }
              isFocused={isFocused}
              isMarked={isMarked}
              isDimmed={Boolean(dimNonFocused && focusedAyahKey && !isFocused)}
              showTajweed={showTajweed}
              arabicContent={arabicContent}
              translationText={translationText}
              showTranslation={showTranslation}
              transliterationText={ayah.transliteration || ""}
              showTransliteration={showTransliteration}
              isMushafView={isMushafView}
              showWordByWord={showWordByWord}
              words={words}
              wordLoading={effectiveWordLoading}
              wordAudioUrl={activeCardWordAudioUrl}
              selectedWordPosition={
                selectedWordDetails?.surah === effectiveSurahNumber &&
                  selectedWordDetails?.ayah === ayahNum
                  ? selectedWordDetails.position
                  : null
              }
              isBookmarked={Boolean(bookmarked)}
              hasNote={Boolean(noted)}
              resolveWordAudioUrl={resolveWordAudioUrl}
              onFocusAyahKey={onFocusAyahKey}
              onOpenMemorize={onOpenMemorize}
              onTogglePlay={onTogglePlay}
              onToggleBookmark={onToggleBookmark}
              onOpenTafsir={onOpenTafsir}
              onOpenNote={onOpenNote}
              onWordSelect={onWordSelect}
              onWordAudio={onWordAudio}
              onToggleStudyMarkByKey={onToggleStudyMarkByKey}
              isMemorized={isMemorized}
              onToggleHifzMark={onToggleHifzMark}
              showHifzMode={showHifzMode}
            />
          </div>
        );
      }),
    [
      dimNonFocused,
      focusedAyahKey,
      hasNote,
      isAudioPaused,
      isBookmarked,
      isMushafView,
      nowPlaying,
      activeWordPosition,
      onFocusAyahKey,
      onOpenMemorize,
      onOpenNote,
      onOpenTafsir,
      onToggleBookmark,
      onTogglePlay,
      onToggleStudyMarkByKey,
      onWordAudio,
      onWordSelect,
      preparedAyahs,
      resolveWordAudioUrl,
      scopeLabel,
      selectedSurahNumber,
      selectedWordDetails?.ayah,
      selectedWordDetails?.position,
      selectedWordDetails?.surah,
      showTajweed,
      showTranslation,
      showTransliteration,
      showWordByWord,
      studyMarks,
      hifzMarks,
      onToggleHifzMark,
      showHifzMode,
      viewMode,
      wordAudioUrl,
      wordsByAyahForStudy,
      effectiveWordLoading
    ]
  );

  return (
    <div className={`study-ayah-list${viewMode === "page" ? " page-mode" : ""}`}>
      {viewMode === "page" ? (
        <section className="study-page-sheet">
          {ayahCards}
        </section>
      ) : ayahCards}
    </div>
  );
}
