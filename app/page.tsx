"use client";

import { useState } from "react";
import {
  SurahList,
  ReaderPanel,
  StudyPanel,
  StudyModeView,
  PrayerPanel,
  CompareModal,
  NoteModal,
  ErrorBoundary,
  SectionErrorBoundary,
  KeyboardShortcutsHelp,
  ClockIcon,
  ThemeIcon,
  SettingsIcon
} from "./components";
import { AUDIO_RECITERS, ARABIC_FONTS, FONT_SCALE } from "./lib/constants";
import { verseKey, clamp, getAudioUrl, getLocalDateString } from "./lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "./lib/styleClasses";
import { useHomeController } from "./hooks/useHomeController";
import { ThemeProvider, AudioProvider, BookmarkProvider } from "./contexts";

export default function Home() {
  const [isPrayerPanelOpen, setIsPrayerPanelOpen] = useState(false);

  const {
    surahs,
    loadingSurahs,
    surahsError,
    surahByNumber,
    selectedSurah,
    surahData,
    loadingSurahData,
    surahDataError,
    bookmarks,
    notes,
    toggleBookmark,
    openNote,
    saveNote,
    readingPlan,
    setReadingPlan,
    fontScale,
    setFontScale,
    playbackRate,
    setPlaybackRate,
    lastRead,
    studySession,
    memorizeConfig,
    setMemorizeConfig,
    focusedAyahKey,
    setFocusedAyahKey,
    nowPlaying,
    isAutoPlaying,
    isAudioPaused,
    handlePlaySurah,
    handleStopAutoPlay,
    handleAudioEnded,
    handlePlayAyah,
    handleToggleAyah,
    startMemorize,
    stopMemorize,
    reciterId,
    setReciterId,
    selectedReciter,
    arabicFontId,
    setArabicFontId,
    query,
    setQuery,
    selectedTranslations,
    setSelectedTranslations,
    selectedAyah,
    setSelectedAyah,
    ayahQuery,
    setAyahQuery,
    goToAyahInput,
    setGoToAyahInput,
    showWordByWord,
    setShowWordByWord,
    copiedKey,
    noteTarget,
    noteDraft,
    setNoteDraft,
    closeNote,
    readingMode,
    setReadingMode,
    showShortcuts,
    setShowShortcuts,
    showMobileSettings,
    setShowMobileSettings,
    showMobileSearch,
    setShowMobileSearch,
    settingsTab,
    setSettingsTab,
    prayerSettings,
    setPrayerSettings,
    nextPrayerPreview,
    hasPrayerLocation,
    theme,
    isLightTheme,
    toggleTheme,
    wordByAyah,
    wordLoading,
    wordError,
    taqiCache,
    taqiLoading,
    retryData,
    filteredSurahs,
    filteredAyahs,
    sortedBookmarks,
    sortedNotes,
    planSummary,
    formatRangeLabel,
    nowPlayingLabel,
    handleSelectSurah,
    handleGoToAyah,
    jumpToAyah,
    copyAyahLink,
    handleCompare
  } = useHomeController();

  // Derive audio values needed by providers
  const audioSrc = nowPlaying
    ? getAudioUrl(selectedReciter.baseUrl, nowPlaying.surah, nowPlaying.ayah)
    : null;
  const reciterLabel = selectedReciter.label;

  // Render
  if (readingMode) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme} isLightTheme={isLightTheme} toggleTheme={toggleTheme}>
        <BookmarkProvider
          bookmarks={bookmarks}
          notes={notes}
          toggleBookmark={toggleBookmark}
          sortedBookmarks={sortedBookmarks}
          sortedNotes={sortedNotes}
          noteTarget={noteTarget}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          openNote={openNote}
          saveNote={saveNote}
          closeNote={closeNote}
        >
          <AudioProvider
            nowPlaying={nowPlaying}
            isAutoPlaying={isAutoPlaying}
            isAudioPaused={isAudioPaused}
            audioSrc={audioSrc}
            reciterLabel={reciterLabel}
            nowPlayingLabel={nowPlayingLabel}
            handlePlaySurah={handlePlaySurah}
            handleStopAutoPlay={handleStopAutoPlay}
            handleAudioEnded={handleAudioEnded}
            handlePlayAyah={handlePlayAyah}
            handleToggleAyah={handleToggleAyah}
          >
            <StudyModeView
              selectedSurah={selectedSurah}
              surahData={surahData}
              filteredAyahs={filteredAyahs}
              reciters={AUDIO_RECITERS}
              reciterId={reciterId}
              setReciterId={setReciterId}
              arabicFonts={ARABIC_FONTS}
              arabicFontId={arabicFontId}
              setArabicFontId={setArabicFontId}
              selectedTranslations={selectedTranslations}
              readingPlan={readingPlan}
              planSummary={planSummary}
              focusedAyahKey={focusedAyahKey}
              setFocusedAyahKey={setFocusedAyahKey}
              fontScale={fontScale}
              setFontScale={setFontScale}
              playbackRate={playbackRate}
              setPlaybackRate={setPlaybackRate}
              wordByAyah={wordByAyah}
              wordLoading={wordLoading}
              onExit={() => setReadingMode(false)}
              memorizeConfig={memorizeConfig}
              setMemorizeConfig={setMemorizeConfig}
              onStartMemorize={startMemorize}
              onStopMemorize={stopMemorize}
              onJumpToAyah={jumpToAyah}
              surahByNumber={surahByNumber}
              verseKey={verseKey}
              clamp={clamp}
            />
            <NoteModal
              noteTarget={noteTarget}
              noteDraft={noteDraft}
              setNoteDraft={setNoteDraft}
              surahByNumber={surahByNumber}
              onSave={saveNote}
              onClose={closeNote}
            />
          </AudioProvider>
        </BookmarkProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const appTypographyClasses = `${getArabicScaleClass(fontScale.arabic)} ${getTranslationScaleClass(
    fontScale.translation
  )} ${getArabicFontClass(arabicFontId)}`;

  const continueSession = studySession || (lastRead
    ? {
      surah: lastRead.surah,
      ayah: lastRead.ayah,
      surahName: lastRead.surahName,
      updatedAt: lastRead.timestamp
    }
    : null);

  const handleContinueSession = () => {
    if (!continueSession) return;
    if (studySession?.reciterId) {
      setReciterId(studySession.reciterId);
    }
    if (studySession?.fontScale) {
      setFontScale({
        arabic: clamp(
          Number(studySession.fontScale.arabic) || 1,
          FONT_SCALE.min.arabic,
          FONT_SCALE.max.arabic
        ),
        translation: clamp(
          Number(studySession.fontScale.translation) || 1,
          FONT_SCALE.min.translation,
          FONT_SCALE.max.translation
        )
      });
    }
    if (Number.isFinite(studySession?.playbackRate)) {
      setPlaybackRate(clamp(Number(studySession?.playbackRate) || 1, 0.75, 1.25));
    }
    jumpToAyah(continueSession.surah, continueSession.ayah);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme} isLightTheme={isLightTheme} toggleTheme={toggleTheme}>
        <BookmarkProvider
          bookmarks={bookmarks}
          notes={notes}
          toggleBookmark={toggleBookmark}
          sortedBookmarks={sortedBookmarks}
          sortedNotes={sortedNotes}
          noteTarget={noteTarget}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          openNote={openNote}
          saveNote={saveNote}
          closeNote={closeNote}
        >
          <AudioProvider
            nowPlaying={nowPlaying}
            isAutoPlaying={isAutoPlaying}
            isAudioPaused={isAudioPaused}
            audioSrc={audioSrc}
            reciterLabel={reciterLabel}
            nowPlayingLabel={nowPlayingLabel}
            handlePlaySurah={handlePlaySurah}
            handleStopAutoPlay={handleStopAutoPlay}
            handleAudioEnded={handleAudioEnded}
            handlePlayAyah={handlePlayAyah}
            handleToggleAyah={handleToggleAyah}
          >
            <main className={`app ${appTypographyClasses}`}>
              <div className="topbar">
                <div className="logo">
                  <div className="logo-mark" aria-hidden="true">
                    <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                      <path
                        d="M12 18c6-3 14-4 20-4s14 1 20 4v28c-6-3-14-4-20-4s-14 1-20 4V18Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <path d="M32 14v28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <path
                        d="M20 24h12M20 32h12M20 40h12"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="logo-text">
                    <h1 className="logo-title">Open<span className="logo-highlight">Furqan</span></h1>
                  </div>
                </div>
                <div className="topbar-actions">
                  <button className="action-btn mobile-only" onClick={() => setReadingMode(true)}>
                    Study mode
                  </button>
                  <div className="topbar-icon-btns desktop-only">
                    <button
                      className="header-icon-btn"
                      onClick={() => setIsPrayerPanelOpen(true)}
                      aria-label="Prayer times"
                    >
                      <ClockIcon />
                    </button>
                    <button
                      className="header-icon-btn"
                      onClick={toggleTheme}
                      aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
                    >
                      <ThemeIcon isLight={isLightTheme} />
                    </button>
                    <button
                      className="header-icon-btn"
                      onClick={() => {
                        setSettingsTab("display");
                        setShowMobileSettings(true);
                      }}
                      aria-label="Settings"
                    >
                      <SettingsIcon />
                    </button>
                  </div>
                  <button className="action-btn desktop-only" onClick={() => setReadingMode(true)}>
                    Study mode
                  </button>
                </div>
              </div>

              <section className="content">
                <SectionErrorBoundary title="Surah list unavailable">
                  <SurahList
                    loading={loadingSurahs}
                    error={surahsError}
                    selectedSurah={selectedSurah}
                    onSelectSurah={handleSelectSurah}
                    query={query}
                    setQuery={setQuery}
                    filteredSurahs={filteredSurahs}
                    onRetry={retryData}
                    onOpenPrayer={() => setIsPrayerPanelOpen(true)}
                    onOpenSettings={() => {
                      setSettingsTab("display");
                      setShowMobileSettings(true);
                    }}
                  />
                </SectionErrorBoundary>

                <SectionErrorBoundary title="Reader unavailable">
                  <ReaderPanel
                    selectedSurah={selectedSurah}
                    surahData={surahData}
                    filteredAyahs={filteredAyahs}
                    surahs={surahs}
                    filteredSurahs={filteredSurahs}
                    query={query}
                    setQuery={setQuery}
                    reciters={AUDIO_RECITERS}
                    reciterId={reciterId}
                    setReciterId={setReciterId}
                    arabicFonts={ARABIC_FONTS}
                    arabicFontId={arabicFontId}
                    setArabicFontId={setArabicFontId}
                    selectedTranslations={selectedTranslations}
                    setSelectedTranslations={setSelectedTranslations}
                    ayahQuery={ayahQuery}
                    setAyahQuery={setAyahQuery}
                    goToAyahInput={goToAyahInput}
                    setGoToAyahInput={setGoToAyahInput}
                    handleGoToAyah={handleGoToAyah}
                    showWordByWord={showWordByWord}
                    setShowWordByWord={setShowWordByWord}
                    showMobileSettings={showMobileSettings}
                    setShowMobileSettings={setShowMobileSettings}
                    showMobileSearch={showMobileSearch}
                    setShowMobileSearch={setShowMobileSearch}
                    settingsTab={settingsTab}
                    setSettingsTab={setSettingsTab}
                    wordLoading={wordLoading}
                    wordError={wordError}
                    wordByAyah={wordByAyah}
                    fontScale={fontScale}
                    setFontScale={setFontScale}
                    focusedAyahKey={focusedAyahKey}
                    setFocusedAyahKey={setFocusedAyahKey}
                    prayerSettings={prayerSettings}
                    setPrayerSettings={setPrayerSettings}
                    nextPrayerPreview={nextPrayerPreview}
                    hasPrayerLocation={hasPrayerLocation}
                    error={surahDataError}
                    onRetry={retryData}
                    loadingSurahData={loadingSurahData}
                    onCompare={handleCompare}
                    onCopyLink={copyAyahLink}
                    onSelectSurah={handleSelectSurah}
                    verseKey={verseKey}
                    clamp={clamp}
                  />
                </SectionErrorBoundary>

                <SectionErrorBoundary title="Study panel unavailable">
                  <StudyPanel
                    surahs={surahs}
                    surahByNumber={surahByNumber}
                    readingPlan={readingPlan}
                    setReadingPlan={setReadingPlan}
                    planSummary={planSummary}
                    onJumpToAyah={jumpToAyah}
                    formatRangeLabel={formatRangeLabel}
                    getLocalDateString={getLocalDateString}
                    continueSession={continueSession}
                    onContinueSession={handleContinueSession}
                  />
                </SectionErrorBoundary>
              </section>

              <CompareModal
                selectedAyah={selectedAyah}
                selectedSurah={selectedSurah}
                selectedAyahKey={
                  selectedSurah && selectedAyah ? `${selectedSurah.number}:${selectedAyah.number}` : null
                }
                taqiCache={taqiCache}
                taqiLoading={taqiLoading}
                onClose={() => setSelectedAyah(null)}
              />

              <NoteModal
                noteTarget={noteTarget}
                noteDraft={noteDraft}
                setNoteDraft={setNoteDraft}
                surahByNumber={surahByNumber}
                onSave={saveNote}
                onClose={closeNote}
              />

              <PrayerPanel
                isOpen={isPrayerPanelOpen}
                onClose={() => setIsPrayerPanelOpen(false)}
                prayerSettings={prayerSettings}
                setPrayerSettings={setPrayerSettings}
                nextPrayerPreview={nextPrayerPreview}
                hasPrayerLocation={hasPrayerLocation}
              />

              <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
            </main>
          </AudioProvider>
        </BookmarkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
