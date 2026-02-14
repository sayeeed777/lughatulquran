"use client";

import { useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioPlayer } from "../common";
import { ProgressRing, QuickPanel } from "./StudyComponents";
import StudyMemorizeModal from "./StudyMemorizeModal";
import StudyLexiconModals from "./StudyLexiconModals";
import { TAJWEED_LEGEND, TAFSIR_EDITIONS } from "./StudyModeHelpers";
import type { QuickPanelTab } from "./StudyQuickPanelContent";
import StudyQuickPanelContent from "./StudyQuickPanelContent";
import StudyAyahList from "./StudyAyahList";
import useStudyControls from "./useStudyControls";
import useWordLexicon from "./useWordLexicon";
import { AUDIO_RECITERS, ARABIC_FONTS } from "../../lib/constants";
import { verseKey, clamp } from "../../lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "../../lib/styleClasses";
import { useAudio, useBookmarkContext, useQuranData, useUIState, usePreferences } from "../../contexts";
import type { PlanSummary } from "../../hooks/home/useHomePlan";

type RailItem = {
  id: QuickPanelTab;
  label: string;
  icon: ReactNode;
};

type StudyModeViewProps = {
  reciterId: string;
  setReciterId: (value: string) => void;
  playbackRate: number;
  setPlaybackRate: (value: number) => void;
  planSummary: PlanSummary;
  onExit: () => void;
  onJumpToAyah: (surah: number, ayah: number) => void;
};

export default function StudyModeView({
  reciterId,
  setReciterId,
  playbackRate,
  setPlaybackRate,
  planSummary,
  onExit,
  onJumpToAyah
}: StudyModeViewProps) {
  // Consume from contexts
  const {
    selectedSurah,
    surahData,
    filteredAyahs,
    wordByAyah,
    wordLoading,
    surahByNumber
  } = useQuranData();
  const { focusedAyahKey, setFocusedAyahKey } = useUIState();
  const {
    arabicFontId,
    setArabicFontId,
    selectedTranslations,
    fontScale,
    setFontScale,
    memorizeConfig,
    startMemorize: onStartMemorize,
    stopMemorize: onStopMemorize
  } = usePreferences();
  const {
    nowPlaying,
    isAutoPlaying,
    isAudioPaused,
    audioSrc,
    reciterLabel,
    handleStopAutoPlay: onStopAutoPlay,
    handlePlaySurah: onPlaySurah,
    handleAudioEnded: onAudioEnded,
    handleToggleAyah: onTogglePlay
  } = useAudio();
  const {
    bookmarks,
    notes,
    sortedBookmarks,
    sortedNotes,
    toggleBookmark: onToggleBookmark,
    openNote: onOpenNote
  } = useBookmarkContext();
  // Support both array and single string for backwards compatibility
  const translationIds = Array.isArray(selectedTranslations)
    ? selectedTranslations
    : [selectedTranslations];
  const primaryTranslation = translationIds[0] || "en.arberry";

  const ayahs = useMemo(
    () => filteredAyahs || surahData?.ayahs || [],
    [filteredAyahs, surahData?.ayahs]
  );
  const selectedSurahNumber = selectedSurah?.number || 0;
  const totalAyahs = ayahs.length;

  const {
    showControls,
    showQuickPanel,
    setShowQuickPanel,
    quickPanelTab,
    setQuickPanelTab,
    readingTime,
    currentAyahIndex,
    progress,
    goalTarget,
    goalProgress,
    setGoalPerDay,
    showTajweed,
    setShowTajweed,
    showTajweedLegend,
    setShowTajweedLegend,
    showWordByWord,
    setShowWordByWord,
    isMushafView,
    setIsMushafView,
    scriptStyle,
    setScriptStyle,
    showTranslation,
    setShowTranslation,
    dimNonFocused,
    setDimNonFocused,
    autoScrollPlaying,
    setAutoScrollPlaying,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    runSearch,
    tafsirEdition,
    tafsirText,
    tafsirLoading,
    tafsirError,
    handleChangeTafsirEdition,
    focusedAyahNumber,
    showMemorizeModal,
    memorizeMode,
    memorizeDraft,
    openMemorizeModal,
    closeMemorizeModal,
    applyMemorizeMode,
    updateMemorizeStart,
    updateMemorizeEnd,
    updateMemorizeLoops,
    studyMarks,
    toggleStudyMark,
    scrollContainerRef
  } = useStudyControls({
    ayahsLength: ayahs.length,
    selectedSurah,
    focusedAyahKey,
    clamp,
    memorizeConfig
  });

  const {
    wordAudioRef,
    wordAudioUrl,
    selectedWordDetails,
    isRootModalOpen,
    rootLexicon,
    rootLexiconLoading,
    rootLexiconError,
    wordsByAyahForStudy,
    effectiveWordLoading,
    resolveWordAudioUrl,
    handleWordAudio,
    handleWordSelect,
    closeWordDetails,
    openRootDetails,
    closeRootModal,
    selectedRoot,
    selectedRootArabic,
    rootMeaningSummary,
    laneActionLabel
  } = useWordLexicon({
    selectedSurahNumber,
    wordByAyah,
    wordLoading
  });

  const railItems = useMemo<RailItem[]>(
    () => [
      {
        id: "study",
        label: "Study",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4h14a2 2 0 0 1 2 2v13" />
            <path d="M4 4v13a2 2 0 0 0 2 2h14" />
          </svg>
        )
      },
      {
        id: "tool",
        label: "Tool",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 6.5 17.5 3.5a2.121 2.121 0 1 1 3 3l-3.01 3.01" />
            <path d="M12.5 8.5 4 17v3h3l8.5-8.5" />
            <path d="M7 12H3" />
            <path d="M21 21h-4" />
            <path d="M14 14h-2" />
          </svg>
        )
      },
      {
        id: "tafsir",
        label: "Tafsir",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4h14a2 2 0 0 1 2 2v13" />
            <path d="M4 4v13a2 2 0 0 0 2 2h14" />
            <path d="M8 7h8" />
            <path d="M8 11h6" />
          </svg>
        )
      },
      {
        id: "search",
        label: "Search",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )
      },
      {
        id: "notes",
        label: "Notes",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        )
      }
    ],
    []
  );

  const isBookmarked = useCallback(
    (surah: number, ayah: number) => bookmarks?.includes(verseKey(surah, ayah)),
    [bookmarks]
  );
  const hasNote = useCallback(
    (surah: number, ayah: number) => notes?.[verseKey(surah, ayah)],
    [notes]
  );

  const studyTypographyClasses = `${getArabicScaleClass(fontScale.arabic)} ${getTranslationScaleClass(
    fontScale.translation
  )} ${getArabicFontClass(arabicFontId)}`;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onOpenTafsirFromAyah = useCallback(
    (key: string) => {
      setFocusedAyahKey(key);
      setQuickPanelTab("tafsir");
      setShowQuickPanel(true);
    },
    [setFocusedAyahKey, setQuickPanelTab, setShowQuickPanel]
  );

  return (
    <div
      className={`study-mode-container${isMushafView ? " mushaf-view" : ""}${scriptStyle === "naskh" ? " script-naskh" : ""
        } ${studyTypographyClasses}`}
    >
      {/* Ambient Background */}
      <div className="study-ambient-bg" />

      {/* Top Header - Minimal */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            className="study-header"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="study-header-left">
              <button className="study-back-btn" onClick={onExit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="study-surah-info">
                <h1 className="study-surah-name">{selectedSurah?.englishName}</h1>
                <span className="study-surah-meta">
                  {selectedSurah?.englishNameTranslation} · {totalAyahs} Ayahs
                </span>
              </div>
            </div>

            <div className="study-header-center">
              <div className="study-progress-indicator">
                <ProgressRing progress={progress} />
                <span className="progress-text">{progress}%</span>
              </div>
            </div>

            <div className="study-header-right">
              <div className="study-reading-time">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>{formatTime(readingTime)}</span>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}
      <div className="study-reading-area" ref={scrollContainerRef}>
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

        <StudyAyahList
          ayahs={ayahs}
          selectedSurahNumber={selectedSurahNumber}
          verseKey={verseKey}
          nowPlaying={nowPlaying}
          isAudioPaused={isAudioPaused}
          focusedAyahKey={focusedAyahKey}
          dimNonFocused={dimNonFocused}
          studyMarks={studyMarks}
          primaryTranslation={primaryTranslation}
          showTajweed={showTajweed}
          showTranslation={showTranslation}
          isMushafView={isMushafView}
          showWordByWord={showWordByWord}
          wordsByAyahForStudy={wordsByAyahForStudy}
          effectiveWordLoading={effectiveWordLoading}
          wordAudioUrl={wordAudioUrl}
          selectedWordDetails={selectedWordDetails}
          isBookmarked={isBookmarked}
          hasNote={hasNote}
          resolveWordAudioUrl={resolveWordAudioUrl}
          onFocusAyahKey={setFocusedAyahKey}
          onOpenMemorize={openMemorizeModal}
          onTogglePlay={onTogglePlay}
          onToggleBookmark={onToggleBookmark}
          onOpenTafsir={onOpenTafsirFromAyah}
          onOpenNote={onOpenNote}
          onWordSelect={handleWordSelect}
          onWordAudio={handleWordAudio}
          onToggleStudyMarkByKey={toggleStudyMark}
        />

        <div className="study-surah-end">
          <div className="study-end-decoration">
            <span className="decoration-star">✦</span>
          </div>
          <p className="study-end-text">End of Surah</p>
        </div>
      </div>

      {/* Audio Player */}
      <AudioPlayer
        reciterLabel={reciterLabel}
        nowPlayingLabel={nowPlaying ? `Ayah ${nowPlaying.ayah}` : ""}
        audioSrc={audioSrc}
        isAutoPlaying={isAutoPlaying}
        isAudioPaused={isAudioPaused}
        playbackRate={playbackRate}
        onPlaySurah={onPlaySurah}
        onStopAutoPlay={onStopAutoPlay}
        onAudioEnded={onAudioEnded}
        selectedSurah={selectedSurah}
        nowPlaying={nowPlaying}
        showPlayerBar={false}
      />


      {/* Study Rail */}
      <div className="study-rail">
        {railItems.map((item) => (
          <button
            key={item.id}
            className={`study-rail-btn${quickPanelTab === item.id && showQuickPanel ? " active" : ""}`}
            onClick={() => {
              if (showQuickPanel && quickPanelTab === item.id) {
                setShowQuickPanel(false);
                return;
              }
              setQuickPanelTab(item.id);
              setShowQuickPanel(true);
            }}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>


      {/* Quick Panel */}
      <QuickPanel
        isOpen={showQuickPanel}
        onClose={() => setShowQuickPanel(false)}
        title={quickPanelTab.charAt(0).toUpperCase() + quickPanelTab.slice(1)}
      >
        <StudyQuickPanelContent
          tab={quickPanelTab}
          readingTime={readingTime}
          progress={progress}
          sortedBookmarks={sortedBookmarks}
          sortedNotes={sortedNotes}
          goalTarget={goalTarget}
          goalProgress={goalProgress}
          setGoalPerDay={setGoalPerDay}
          planSummary={planSummary}
          surahByNumber={surahByNumber}
          onJumpToAyah={onJumpToAyah}
          onClosePanel={() => setShowQuickPanel(false)}
          formatTime={formatTime}
          showTranslation={showTranslation}
          setShowTranslation={setShowTranslation}
          dimNonFocused={dimNonFocused}
          setDimNonFocused={setDimNonFocused}
          autoScrollPlaying={autoScrollPlaying}
          setAutoScrollPlaying={setAutoScrollPlaying}
          fontScale={fontScale}
          setFontScale={setFontScale}
          clamp={clamp}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          arabicFonts={ARABIC_FONTS}
          arabicFontId={arabicFontId}
          setArabicFontId={setArabicFontId}
          reciters={AUDIO_RECITERS}
          reciterId={reciterId}
          setReciterId={setReciterId}
          showTajweed={showTajweed}
          setShowTajweed={setShowTajweed}
          showTajweedLegend={showTajweedLegend}
          setShowTajweedLegend={setShowTajweedLegend}
          showWordByWord={showWordByWord}
          setShowWordByWord={setShowWordByWord}
          isMushafView={isMushafView}
          setIsMushafView={setIsMushafView}
          scriptStyle={scriptStyle}
          setScriptStyle={setScriptStyle}
          tajweedLegend={TAJWEED_LEGEND}
          tafsirEdition={String(tafsirEdition)}
          tafsirEditions={TAFSIR_EDITIONS}
          onChangeTafsirEdition={handleChangeTafsirEdition}
          selectedSurahNumber={selectedSurah?.number || 0}
          selectedSurahName={selectedSurah?.englishName || "Surah"}
          focusedAyahNumber={focusedAyahNumber}
          currentAyahIndex={currentAyahIndex}
          onUseCurrentAyah={() =>
            setFocusedAyahKey(verseKey(selectedSurah?.number || 0, currentAyahIndex))
          }
          tafsirLoading={tafsirLoading}
          tafsirError={tafsirError}
          tafsirText={tafsirText}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          runSearch={runSearch}
          searchLoading={searchLoading}
          searchError={searchError}
          searchResults={searchResults}
          onOpenNote={onOpenNote}
        />
      </QuickPanel>

      <StudyLexiconModals
        selectedWordDetails={selectedWordDetails}
        isRootModalOpen={isRootModalOpen}
        selectedRoot={selectedRoot}
        selectedRootArabic={selectedRootArabic}
        rootMeaningSummary={rootMeaningSummary}
        laneActionLabel={laneActionLabel}
        rootLexiconError={rootLexiconError}
        rootLexiconLoading={rootLexiconLoading}
        rootLexicon={rootLexicon}
        onCloseWordDetails={closeWordDetails}
        onCloseRootModal={closeRootModal}
        onOpenRootDetails={openRootDetails}
        onPlayWordAudio={handleWordAudio}
      />

      <StudyMemorizeModal
        isOpen={showMemorizeModal}
        selectedSurah={selectedSurah}
        memorizeMode={memorizeMode}
        memorizeDraft={memorizeDraft}
        memorizeActive={Boolean(memorizeConfig?.active)}
        onClose={closeMemorizeModal}
        onApplyMode={applyMemorizeMode}
        onUpdateStart={updateMemorizeStart}
        onUpdateEnd={updateMemorizeEnd}
        onUpdateLoops={updateMemorizeLoops}
        onStartMemorize={onStartMemorize}
        onStopMemorize={onStopMemorize}
      />

      {/* Hidden audio element for word audio */}
      <audio ref={wordAudioRef} hidden />
    </div>
  );
}
