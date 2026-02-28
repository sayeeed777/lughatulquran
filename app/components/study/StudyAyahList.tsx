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

type StudyAyahListProps = {
  ayahs: Ayah[];
  selectedSurahNumber: number;
  verseKey: (surah: number, ayah: number) => string;
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
};

export default function StudyAyahList({
  ayahs,
  selectedSurahNumber,
  verseKey,
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
  onToggleHifzMark
}: StudyAyahListProps) {
  const ayahCards = useMemo(
    () =>
      ayahs.map((ayah, index) => {
        const ayahNum = ayah.number;
        const key = verseKey(selectedSurahNumber || 0, ayahNum);
        const bookmarked = isBookmarked(selectedSurahNumber || 0, ayahNum);
        const noted = hasNote(selectedSurahNumber || 0, ayahNum);
        const isPlaying = nowPlaying?.surah === selectedSurahNumber && nowPlaying?.ayah === ayahNum;
        const isActivePlay = isPlaying && !isAudioPaused;
        const words = ayahNum ? wordsByAyahForStudy?.[ayahNum] || [] : [];
        const isFocused = focusedAyahKey === key;
        const isMarked = Boolean(studyMarks?.[key]);
        const isMemorized = Boolean(hifzMarks?.[key]);
        const translationText = ayah.translations?.[primaryTranslation]?.text || "";

        return (
          <StudyAyahCard
            key={key || `ayah-${index}`}
            ayahNumber={ayahNum}
            surahNumber={selectedSurahNumber || 0}
            verseKey={key}
            cardId={key || `ayah-${ayahNum}`}
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
              selectedWordDetails?.surah === selectedSurahNumber &&
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
          />
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
      verseKey,
      wordAudioUrl,
      wordsByAyahForStudy,
      effectiveWordLoading
    ]
  );

  return <div className="study-ayah-list">{ayahCards}</div>;
}
