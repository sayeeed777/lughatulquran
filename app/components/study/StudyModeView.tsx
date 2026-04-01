"use client";

import { useMemo, useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioPlayer } from "../common";
import { MemorizationApp } from "../memorization/MemorizationApp";
import { QuickPanel } from "./StudyComponents";
import StudyModeHeader from "./StudyModeHeader";
import StudyMemorizeModal from "./StudyMemorizeModal";
import StudyLexiconModals from "./StudyLexiconModals";
import StudyModeReadingArea from "./StudyModeReadingArea";
import StudyModeRail from "./StudyModeRail";
import { TAJWEED_LEGEND, TAFSIR_EDITIONS } from "./StudyModeHelpers";
import type { MushafPageLayout } from "./StudyModeTypes";
import StudyQuickPanelContent from "./StudyQuickPanelContent";
import useStudyControls from "./useStudyControls";
import useWordLexicon from "./useWordLexicon";
import type { StudyScopeAyah, StudyScopeMode, StudyScopeResponse } from "./StudyScopeTypes";
import { AUDIO_RECITERS, ARABIC_FONTS } from "../../lib/constants";
import { useLocalStorage, useReadingStats } from "../../hooks";
import { useDiscoveryTips } from "../../hooks/useDiscoveryTips";
import { verseKey, clamp } from "../../lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "../../lib/styleClasses";
import { fetchJSON } from "../../lib/apiClient";
import { useAudio, useBookmarkContext, useQuranData, useUIState, usePreferences, useActions } from "../../contexts";

type StudyModeViewProps = {
  onExit: () => void;
};

export default function StudyModeView({
  onExit
}: StudyModeViewProps) {
  // Consume from contexts
  const {
    surahs,
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
    showStudyTransliteration,
    setShowStudyTransliteration,
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
    reciterBaseUrl,
    nowPlayingPage,
    reciterId,
    surahPageStart,
    surahPageEnd,
    setReciterId,
    playbackRate,
    setPlaybackRate,
    handleStopAutoPlay: onStopAutoPlay,
    handlePlaySurah: onPlaySurah,
    handlePlayAyah: onPlayAyah,
    handleAudioEnded: onAudioEnded,
    handleToggleAyah: onTogglePlay
  } = useAudio();
  const { planSummary, jumpToAyah: onJumpToAyah } = useActions();
  const {
    bookmarks,
    notes,
    sortedBookmarks,
    sortedNotes,
    toggleBookmark: onToggleBookmark,
    openNote: onOpenNote
  } = useBookmarkContext();
  const { todayStats, weeklyData, weekTotal, stats, surahProgress, recordVerseRead } = useReadingStats();

  // Discovery tips
  const [hasOpenedTools, setHasOpenedTools] = useState(false);
  const surahCount = Object.keys(surahProgress || {}).length;
  const { activeTip, dismiss: dismissTip } = useDiscoveryTips({
    toolsOpened: hasOpenedTools,
    surahCount,
  });

  // Support both array and single string for backwards compatibility
  const translationIds = Array.isArray(selectedTranslations)
    ? selectedTranslations
    : [selectedTranslations];
  const primaryTranslation = translationIds[0] || "en-arberry";
  const translationKey = translationIds.join(",");

  const [studyScopeMode, setStudyScopeMode] = useLocalStorage<StudyScopeMode>(
    "quran_study_scope_mode",
    "surah"
  );
  const [studyJuzNumber, setStudyJuzNumber] = useLocalStorage<number>("quran_study_juz_number", 1);
  const [studyPageNumber, setStudyPageNumber] = useLocalStorage<number>("quran_study_page_number", 1);
  const [showMemorizationPreview, setShowMemorizationPreview] = useState(false);
  const [scopedAyahs, setScopedAyahs] = useState<StudyScopeAyah[]>([]);
  const [scopeMeta, setScopeMeta] = useState<StudyScopeResponse["scope"] | null>(null);
  const [scopeLayout, setScopeLayout] = useState<MushafPageLayout | null>(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);

  // Swipe navigation for page/juz scope on mobile
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);
  const handleSwipeStart = useCallback((e: ReactTouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = { startX: t.clientX, startY: t.clientY };
  }, []);
  const handleSwipeEnd = useCallback((e: ReactTouchEvent) => {
    if (!swipeRef.current || studyScopeMode === "surah") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.current.startX;
    const dy = t.clientY - swipeRef.current.startY;
    swipeRef.current = null;
    // Only trigger if horizontal swipe is dominant and long enough
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    if (studyScopeMode === "page") {
      // RTL: swipe left = next page, swipe right = prev page
      if (dx < 0) setStudyPageNumber(Math.min(604, studyPageNumber + 1));
      else setStudyPageNumber(Math.max(1, studyPageNumber - 1));
    } else {
      if (dx < 0) setStudyJuzNumber(Math.min(30, studyJuzNumber + 1));
      else setStudyJuzNumber(Math.max(1, studyJuzNumber - 1));
    }
  }, [studyScopeMode, studyPageNumber, studyJuzNumber, setStudyPageNumber, setStudyJuzNumber]);

  const selectedSurahNumber = selectedSurah?.number || 0;
  const surahAyahs = useMemo<StudyScopeAyah[]>(
    () =>
      (filteredAyahs || surahData?.ayahs || []).map((ayah) => ({
        ...ayah,
        surahNumber: selectedSurahNumber,
        verseKey: verseKey(selectedSurahNumber, ayah.number)
      })),
    [filteredAyahs, selectedSurahNumber, surahData?.ayahs]
  );

  const activeScopeValue = studyScopeMode === "page" ? studyPageNumber : studyJuzNumber;

  useEffect(() => {
    if (studyScopeMode === "surah") {
      setScopeLoading(false);
      setScopeError(null);
      setScopeMeta(null);
      setScopeLayout(null);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (translationKey) {
      params.set("translations", translationKey);
    }
    if (showStudyTransliteration && studyScopeMode === "juz") {
      params.set("transliteration", "1");
    }

    const url = `/api/${studyScopeMode}/${activeScopeValue}${params.toString() ? `?${params.toString()}` : ""}`;
    const cacheKey = `study-scope:v3:${studyScopeMode}:${activeScopeValue}:${translationKey}:${showStudyTransliteration ? 1 : 0}`;

    setScopeLoading(true);
    setScopeError(null);

    fetchJSON<StudyScopeResponse>(url, {
      ttl: 30 * 60 * 1000,
      retries: 1,
      retryDelay: 300,
      persist: true,
      staleWhileRevalidate: true,
      cacheKey,
      signal: controller.signal
    })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setScopedAyahs(Array.isArray(payload?.ayahs) ? payload.ayahs : []);
        setScopeMeta(payload?.scope || null);
        setScopeLayout(payload?.layout || null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Failed to load study scope.";
        setScopeError(message);
        setScopedAyahs([]);
        setScopeMeta(null);
        setScopeLayout(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setScopeLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    activeScopeValue,
    showStudyTransliteration,
    studyScopeMode,
    translationKey
  ]);

  const displayAyahs = studyScopeMode === "surah" ? surahAyahs : scopedAyahs;
  const totalAyahs = displayAyahs.length;
  const isPageScope = studyScopeMode === "page";
  const isSurahScope = studyScopeMode === "surah";
  const hasMushafLayout = Boolean(isPageScope && scopeLayout?.lines?.length);

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
    showHifzMode,
    setShowHifzMode,
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
    searchHasRun,
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
    hifzMarks,
    toggleHifzMark,
    markHifzRange,
    clearHifzSurah,
    scrollContainerRef,
    scrollToVerseKey
  } = useStudyControls({
    ayahsLength: totalAyahs,
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

  useEffect(() => {
    if (!displayAyahs.length) return;
    const hasFocusedAyah = focusedAyahKey
      ? displayAyahs.some((ayah) => ayah.verseKey === focusedAyahKey)
      : false;
    if (hasFocusedAyah) return;
    setFocusedAyahKey(displayAyahs[0].verseKey);
  }, [displayAyahs, focusedAyahKey, setFocusedAyahKey]);

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

  // Track verse reading when currentAyahIndex changes
  const lastTrackedAyahRef = useRef(0);
  useEffect(() => {
    if (!isSurahScope) return;
    if (currentAyahIndex > 0 && selectedSurahNumber > 0 && currentAyahIndex !== lastTrackedAyahRef.current) {
      lastTrackedAyahRef.current = currentAyahIndex;
      recordVerseRead(selectedSurahNumber, currentAyahIndex);
    }
  }, [currentAyahIndex, isSurahScope, selectedSurahNumber, recordVerseRead]);

  const onOpenTafsirFromAyah = useCallback(
    (key: string) => {
      setFocusedAyahKey(key);
      setQuickPanelTab("tafsir");
      setShowQuickPanel(true);
    },
    [setFocusedAyahKey, setQuickPanelTab, setShowQuickPanel]
  );

  const jumpToStudyAyah = useCallback(
    (surah: number, ayah: number) => {
      if (!isSurahScope) {
        setStudyScopeMode("surah");
      }
      onJumpToAyah(surah, ayah);
      scrollToVerseKey(verseKey(surah, ayah));
    },
    [isSurahScope, onJumpToAyah, setStudyScopeMode, scrollToVerseKey]
  );

  const handleStudyAyahPlay = useCallback(
    (surah: number, ayah: number) => {
      if (studyScopeMode === "surah") {
        onTogglePlay(surah, ayah);
        return;
      }

      if (nowPlaying?.surah === surah && nowPlaying?.ayah === ayah) {
        onStopAutoPlay();
        return;
      }

      onPlayAyah(surah, ayah);
    },
    [nowPlaying?.ayah, nowPlaying?.surah, onPlayAyah, onStopAutoPlay, onTogglePlay, studyScopeMode]
  );

  const activeScopeLabel = isSurahScope
    ? selectedSurah?.englishName || "Surah"
    : scopeMeta?.label || (isPageScope ? `Page ${studyPageNumber}` : `Juz ${studyJuzNumber}`);
  const activeScopeMeta = isSurahScope
    ? `${selectedSurah?.englishNameTranslation || ""} · ${totalAyahs} Ayahs`
    : `${totalAyahs} ayahs · ${scopeMeta?.firstVerseKey || ""}${scopeMeta?.lastVerseKey ? ` - ${scopeMeta.lastVerseKey}` : ""}`;
  const currentScopeAyah = displayAyahs[Math.max(0, currentAyahIndex - 1)] || null;
  const toggleMemorizationPreview = useCallback(() => {
    setShowQuickPanel(false);
    onStopAutoPlay();
    setShowMemorizationPreview((previous) => !previous);
  }, [onStopAutoPlay, setShowQuickPanel]);

  return (
    <div
      className={`study-mode-container${(isMushafView || isPageScope) ? " mushaf-view" : ""}${isPageScope ? " page-scope" : ""}${scriptStyle === "naskh" ? " script-naskh" : ""
        } ${studyTypographyClasses}`}
    >
      {/* Ambient Background */}
      <div className="study-ambient-bg" />

      {!showMemorizationPreview && (
        <StudyModeHeader
          showControls={showControls}
          onExit={onExit}
          isSurahScope={isSurahScope}
          isPageScope={isPageScope}
          surahs={surahs}
          selectedSurah={selectedSurah}
          activeScopeLabel={activeScopeLabel}
          activeScopeMeta={activeScopeMeta}
          studyPageNumber={studyPageNumber}
          setStudyPageNumber={setStudyPageNumber}
          studyJuzNumber={studyJuzNumber}
          setStudyJuzNumber={setStudyJuzNumber}
          jumpToStudyAyah={jumpToStudyAyah}
          progress={progress}
          readingTime={readingTime}
          formatTime={formatTime}
        />
      )}

      {showMemorizationPreview ? (
        <div className="study-reading-area study-reading-area-preview" ref={scrollContainerRef}>
          <MemorizationApp embedded reciterId={reciterId} onBack={toggleMemorizationPreview} />
        </div>
      ) : (
        <StudyModeReadingArea
          scrollContainerRef={scrollContainerRef}
          onSwipeStart={handleSwipeStart}
          onSwipeEnd={handleSwipeEnd}
          isSurahScope={isSurahScope}
          isPageScope={isPageScope}
          selectedSurah={selectedSurah}
          activeScopeLabel={activeScopeLabel}
          activeScopeMeta={activeScopeMeta}
          scopeLoading={scopeLoading}
          scopeError={scopeError}
          hasMushafLayout={hasMushafLayout}
          scopeLayout={scopeLayout}
          displayAyahs={displayAyahs}
          focusedAyahKey={focusedAyahKey}
          dimNonFocused={dimNonFocused}
          nowPlaying={nowPlaying}
          isAudioPaused={isAudioPaused}
          onFocusAyahKey={setFocusedAyahKey}
          onTogglePlay={handleStudyAyahPlay}
          onSelectPage={setStudyPageNumber}
          selectedSurahNumber={selectedSurahNumber}
          surahByNumber={surahByNumber}
          studyScopeMode={studyScopeMode}
          studyMarks={studyMarks}
          primaryTranslation={primaryTranslation}
          showTajweed={showTajweed}
          showTranslation={showTranslation}
          showStudyTransliteration={showStudyTransliteration}
          isMushafView={isMushafView}
          showWordByWord={showWordByWord}
          wordsByAyahForStudy={wordsByAyahForStudy}
          effectiveWordLoading={effectiveWordLoading}
          wordAudioUrl={wordAudioUrl}
          selectedWordDetails={selectedWordDetails}
          isBookmarked={isBookmarked}
          hasNote={hasNote}
          resolveWordAudioUrl={resolveWordAudioUrl}
          onOpenMemorize={openMemorizeModal}
          onToggleBookmark={onToggleBookmark}
          onOpenTafsir={onOpenTafsirFromAyah}
          onOpenNote={onOpenNote}
          onWordSelect={handleWordSelect}
          onWordAudio={handleWordAudio}
          onToggleStudyMarkByKey={toggleStudyMark}
          hifzMarks={hifzMarks}
          onToggleHifzMark={toggleHifzMark}
          showHifzMode={showHifzMode}
          verseKey={verseKey}
        />
      )}

      {/* Audio Player */}
      {!showMemorizationPreview ? (
        <AudioPlayer
          reciterId={reciterId}
          reciterLabel={reciterLabel}
          reciterBaseUrl={reciterBaseUrl}
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
          nowPlayingPage={nowPlayingPage}
          surahPageStart={surahPageStart}
          surahPageEnd={surahPageEnd}
          showPlayerBar={false}
          memorizeActive={Boolean(memorizeConfig?.active)}
          memorizeStartAyah={memorizeConfig?.startAyah}
          memorizeEndAyah={memorizeConfig?.endAyah}
          memorizeLoops={memorizeConfig?.loops}
          memorizeRemaining={memorizeConfig?.remaining}
        />
      ) : null}


      {/* Study Rail */}
      {!showMemorizationPreview ? (
        <StudyModeRail
          activeTab={quickPanelTab}
          isOpen={showQuickPanel}
          onSelectTab={(tab) => {
            if (tab === "memorization") {
              toggleMemorizationPreview();
              return;
            }
            if (showQuickPanel && quickPanelTab === tab) {
              setShowQuickPanel(false);
              return;
            }
            setQuickPanelTab(tab);
            setShowQuickPanel(true);
            if (tab === "tool") {
              setHasOpenedTools(true);
              dismissTip();
            }
          }}
        />
      ) : null}


      {/* Quick Panel */}
      {!showMemorizationPreview ? (
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
            onJumpToAyah={jumpToStudyAyah}
            onClosePanel={() => setShowQuickPanel(false)}
            formatTime={formatTime}
            showTranslation={showTranslation}
            setShowTranslation={setShowTranslation}
            studyScopeMode={studyScopeMode}
            setStudyScopeMode={setStudyScopeMode}
            studyJuzNumber={studyJuzNumber}
            setStudyJuzNumber={setStudyJuzNumber}
            studyPageNumber={studyPageNumber}
            setStudyPageNumber={setStudyPageNumber}
            showStudyTransliteration={showStudyTransliteration}
            setShowStudyTransliteration={setShowStudyTransliteration}
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
            showHifzMode={showHifzMode}
            setShowHifzMode={setShowHifzMode}
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
            onUseCurrentAyah={() => currentScopeAyah?.verseKey && setFocusedAyahKey(currentScopeAyah.verseKey)}
            tafsirLoading={tafsirLoading}
            tafsirError={tafsirError}
            tafsirText={tafsirText}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            runSearch={runSearch}
            searchLoading={searchLoading}
            searchError={searchError}
            searchHasRun={searchHasRun}
            searchResults={searchResults}
            onOpenNote={onOpenNote}
            todayVersesRead={todayStats.versesRead}
            weekTotal={weekTotal}
            currentStreak={stats.currentStreak}
            weeklyData={weeklyData}
            surahProgress={surahProgress}
            hifzMarks={hifzMarks}
            totalAyahs={totalAyahs}
            markHifzRange={markHifzRange}
            clearHifzSurah={clearHifzSurah}
          />
        </QuickPanel>
      ) : null}

      {!showMemorizationPreview ? (
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
          onJumpToAyah={jumpToStudyAyah}
        />
      ) : null}

      {!showMemorizationPreview ? (
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
      ) : null}

      {/* Hidden audio element for word audio */}
      {!showMemorizationPreview ? <audio ref={wordAudioRef} hidden /> : null}

      <AnimatePresence>
        {activeTip && !showMemorizationPreview && (
          <motion.div
            className="discovery-tip"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <span className="discovery-tip-text">{activeTip.message}</span>
            <button
              className="discovery-tip-dismiss"
              onClick={dismissTip}
              aria-label="Dismiss tip"
              type="button"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
