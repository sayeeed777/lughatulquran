"use client";

import { useMemo } from "react";
import StudyAyahCard from "./StudyAyahCard";
import { renderTajweedMarkup } from "./StudyModeHelpers";
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

type StudyAyahListProps = {
  ayahs: StudyAyahItem[];
  selectedSurahNumber: number;
  surahByNumber: Map<number, { englishName: string; name: string }>;
  verseKey: (surah: number, ayah: number) => string;
  viewMode: "surah" | "juz" | "page";
  scopeLabel?: string;
  nowPlaying: { surah: number; ayah: number } | null;
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
  const ayahCards = useMemo(
    () =>
      ayahs.map((ayah, index) => {
        const ayahNum = ayah.number;
        const effectiveSurahNumber = ayah.surahNumber || selectedSurahNumber || 0;
        const key = ayah.verseKey || verseKey(effectiveSurahNumber, ayahNum);
        const bookmarked = isBookmarked(effectiveSurahNumber, ayahNum);
        const noted = hasNote(effectiveSurahNumber, ayahNum);
        const isPlaying = nowPlaying?.surah === effectiveSurahNumber && nowPlaying?.ayah === ayahNum;
        const isActivePlay = isPlaying && !isAudioPaused;
        const words = effectiveSurahNumber === selectedSurahNumber && ayahNum
          ? wordsByAyahForStudy?.[ayahNum] || []
          : [];
        const isFocused = focusedAyahKey === key;
        const isMarked = Boolean(studyMarks?.[key]);
        const isMemorized = Boolean(hifzMarks?.[key]);
        const translationText = ayah.translations?.[primaryTranslation]?.text || "";
        const previousSurahNumber = ayahs[index - 1]?.surahNumber || selectedSurahNumber || 0;
        const showSectionHeader = viewMode !== "surah" && index === 0
          ? true
          : viewMode !== "surah" && previousSurahNumber !== effectiveSurahNumber;
        const surahMeta = surahByNumber.get(effectiveSurahNumber);

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
              isFocused={isFocused}
              isMarked={isMarked}
              isDimmed={Boolean(dimNonFocused && focusedAyahKey && !isFocused)}
              showTajweed={showTajweed}
              arabicContent={
                showTajweed && ayah.arabicTajweed ? renderTajweedMarkup(ayah.arabicTajweed) : ayah.arabic || ""
              }
              translationText={translationText}
              showTranslation={showTranslation}
              transliterationText={ayah.transliteration || ""}
              showTransliteration={showTransliteration}
              isMushafView={isMushafView}
              showWordByWord={showWordByWord}
              words={words}
              wordLoading={effectiveWordLoading}
              wordAudioUrl={wordAudioUrl}
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
      ayahs,
      dimNonFocused,
      focusedAyahKey,
      hasNote,
      isAudioPaused,
      isBookmarked,
      isMushafView,
      nowPlaying,
      onFocusAyahKey,
      onOpenMemorize,
      onOpenNote,
      onOpenTafsir,
      onToggleBookmark,
      onTogglePlay,
      onToggleStudyMarkByKey,
      onWordAudio,
      onWordSelect,
      primaryTranslation,
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
      surahByNumber,
      studyMarks,
      hifzMarks,
      onToggleHifzMark,
      showHifzMode,
      viewMode,
      verseKey,
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
