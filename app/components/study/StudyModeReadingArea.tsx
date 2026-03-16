"use client";

import type { RefObject, TouchEvent as ReactTouchEvent } from "react";
import type { NowPlaying, Surah } from "../../lib/types";
import StudyAyahList from "./StudyAyahList";
import StudyMushafPage from "./StudyMushafPage";
import type { MushafPageLayout, SelectedWordDetails, StudyMarks, Word, WordByAyah } from "./StudyModeTypes";
import type { StudyScopeAyah } from "./StudyScopeTypes";

type StudyModeReadingAreaProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onSwipeStart: (event: ReactTouchEvent) => void;
  onSwipeEnd: (event: ReactTouchEvent) => void;
  isSurahScope: boolean;
  isPageScope: boolean;
  selectedSurah: Surah | null;
  activeScopeLabel: string;
  activeScopeMeta: string;
  scopeLoading: boolean;
  scopeError: string | null;
  hasMushafLayout: boolean;
  scopeLayout: MushafPageLayout | null;
  displayAyahs: StudyScopeAyah[];
  focusedAyahKey: string | null;
  dimNonFocused: boolean;
  nowPlaying: NowPlaying | null;
  isAudioPaused: boolean;
  onFocusAyahKey: (key: string) => void;
  onTogglePlay: (surah: number, ayah: number) => void;
  onSelectPage: (page: number) => void;
  selectedSurahNumber: number;
  surahByNumber: Map<number, { englishName: string; name: string }>;
  studyScopeMode: "surah" | "juz" | "page";
  studyMarks: StudyMarks;
  primaryTranslation: string;
  showTajweed: boolean;
  showTranslation: boolean;
  showStudyTransliteration: boolean;
  isMushafView: boolean;
  showWordByWord: boolean;
  wordsByAyahForStudy: WordByAyah;
  effectiveWordLoading: boolean;
  wordAudioUrl: string | null;
  selectedWordDetails: SelectedWordDetails | null;
  isBookmarked: (surah: number, ayah: number) => boolean;
  hasNote: (surah: number, ayah: number) => unknown;
  resolveWordAudioUrl: (audioUrl?: string) => string;
  onOpenMemorize: (ayahNumber: number) => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
  onOpenTafsir: (key: string) => void;
  onOpenNote: (surah: number, ayah: number) => void;
  onWordSelect: (word: Word, ayahNumber: number, wordIndex: number) => void;
  onWordAudio: (audioUrl?: string) => void;
  onToggleStudyMarkByKey: (key: string) => void;
  hifzMarks: StudyMarks;
  onToggleHifzMark: (key: string) => void;
  showHifzMode: boolean;
  verseKey: (surah: number, ayah: number) => string;
};

export default function StudyModeReadingArea({
  scrollContainerRef,
  onSwipeStart,
  onSwipeEnd,
  isSurahScope,
  isPageScope,
  selectedSurah,
  activeScopeLabel,
  activeScopeMeta,
  scopeLoading,
  scopeError,
  hasMushafLayout,
  scopeLayout,
  displayAyahs,
  focusedAyahKey,
  dimNonFocused,
  nowPlaying,
  isAudioPaused,
  onFocusAyahKey,
  onTogglePlay,
  onSelectPage,
  selectedSurahNumber,
  surahByNumber,
  studyScopeMode,
  studyMarks,
  primaryTranslation,
  showTajweed,
  showTranslation,
  showStudyTransliteration,
  isMushafView,
  showWordByWord,
  wordsByAyahForStudy,
  effectiveWordLoading,
  wordAudioUrl,
  selectedWordDetails,
  isBookmarked,
  hasNote,
  resolveWordAudioUrl,
  onOpenMemorize,
  onToggleBookmark,
  onOpenTafsir,
  onOpenNote,
  onWordSelect,
  onWordAudio,
  onToggleStudyMarkByKey,
  hifzMarks,
  onToggleHifzMark,
  showHifzMode,
  verseKey
}: StudyModeReadingAreaProps) {
  return (
    <div
      className="study-reading-area"
      ref={scrollContainerRef}
      onTouchStart={onSwipeStart}
      onTouchEnd={onSwipeEnd}
    >
      {isSurahScope ? (
        <>
          <div className="study-surah-opening">
            <span className="study-arabic-name" lang="ar" dir="rtl">
              {selectedSurah?.name}
            </span>
            <div className="study-opening-decoration">
              <span className="decoration-line" />
              <span className="decoration-dot" />
              <span className="decoration-line" />
            </div>
          </div>

          {selectedSurah?.number !== 1 && selectedSurah?.number !== 9 && (
            <div className="study-bismillah" lang="ar" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}
        </>
      ) : !isPageScope ? (
        <div className="study-surah-opening scope-opening">
          <span className="study-arabic-name">{activeScopeLabel}</span>
          <div className="study-opening-decoration">
            <span className="decoration-line" />
            <span className="decoration-dot" />
            <span className="decoration-line" />
          </div>
          <p className="study-scope-meta">{activeScopeMeta}</p>
        </div>
      ) : null}

      {!isSurahScope && scopeLoading && <p className="status">Loading {activeScopeLabel.toLowerCase()}...</p>}
      {!isSurahScope && scopeError && <p className="status error">{scopeError}</p>}

      {hasMushafLayout && scopeLayout ? (
        <StudyMushafPage
          layout={scopeLayout}
          ayahs={displayAyahs.map((ayah) => ({
            surahNumber: ayah.surahNumber || 0,
            number: ayah.number,
            verseKey: ayah.verseKey || verseKey(ayah.surahNumber || 0, ayah.number)
          }))}
          focusedAyahKey={focusedAyahKey}
          dimNonFocused={dimNonFocused}
          nowPlaying={nowPlaying}
          isAudioPaused={isAudioPaused}
          onFocusAyahKey={onFocusAyahKey}
          onTogglePlay={onTogglePlay}
          onSelectPage={onSelectPage}
        />
      ) : (
        <StudyAyahList
          ayahs={displayAyahs}
          selectedSurahNumber={selectedSurahNumber}
          surahByNumber={surahByNumber}
          verseKey={verseKey}
          viewMode={studyScopeMode}
          scopeLabel={activeScopeLabel}
          nowPlaying={nowPlaying}
          isAudioPaused={isAudioPaused}
          focusedAyahKey={focusedAyahKey}
          dimNonFocused={dimNonFocused}
          studyMarks={studyMarks}
          primaryTranslation={primaryTranslation}
          showTajweed={showTajweed}
          showTranslation={isPageScope ? false : showTranslation}
          showTransliteration={isPageScope ? false : showStudyTransliteration}
          isMushafView={isPageScope ? true : isMushafView}
          showWordByWord={isSurahScope ? showWordByWord : false}
          wordsByAyahForStudy={wordsByAyahForStudy}
          effectiveWordLoading={effectiveWordLoading}
          wordAudioUrl={wordAudioUrl}
          selectedWordDetails={selectedWordDetails}
          isBookmarked={isBookmarked}
          hasNote={hasNote}
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
          hifzMarks={hifzMarks}
          onToggleHifzMark={onToggleHifzMark}
          showHifzMode={isSurahScope && showHifzMode}
        />
      )}

      {!scopeLoading && !scopeError && displayAyahs.length > 0 && (
        <div className="study-surah-end">
          <div className="study-end-decoration">
            <span className="decoration-star">✦</span>
          </div>
          <p className="study-end-text">{isSurahScope ? "End of Surah" : `End of ${activeScopeLabel}`}</p>
        </div>
      )}
    </div>
  );
}
