"use client";

import {
  SurahList,
  ReaderPanel,
  StudyPanel,
  StudyModeView,
  CompareModal,
  NoteModal,
  ErrorBoundary,
  SectionErrorBoundary,
  KeyboardShortcutsHelp,
  SearchIcon,
  ThemeIcon,
  SettingsIcon
} from "./components";
import { AUDIO_RECITERS, ARABIC_FONTS, FONT_SCALE } from "./lib/constants";
import { verseKey, clamp, getAudioUrl, getLocalDateString } from "./lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "./lib/styleClasses";
import { useHomeController } from "./hooks/useHomeController";

export default function Home() {
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

  // Render
  if (readingMode) {
    return (
      <ErrorBoundary>
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
          bookmarks={bookmarks}
          notes={notes}
          sortedBookmarks={sortedBookmarks}
          sortedNotes={sortedNotes}
          readingPlan={readingPlan}
          planSummary={planSummary}
          focusedAyahKey={focusedAyahKey}
          setFocusedAyahKey={setFocusedAyahKey}
          fontScale={fontScale}
          setFontScale={setFontScale}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          nowPlaying={nowPlaying}
          isAutoPlaying={isAutoPlaying}
          isAudioPaused={isAudioPaused}
          wordByAyah={wordByAyah}
          wordLoading={wordLoading}
          audioSrc={
            nowPlaying
              ? getAudioUrl(selectedReciter.baseUrl, nowPlaying.surah, nowPlaying.ayah)
              : null
          }
          reciterLabel={selectedReciter.label}
          onExit={() => setReadingMode(false)}
          onPlayAyah={handlePlayAyah}
          onTogglePlay={handleToggleAyah}
          onStopAutoPlay={handleStopAutoPlay}
          onPlaySurah={handlePlaySurah}
          onAudioEnded={handleAudioEnded}
          memorizeConfig={memorizeConfig}
          setMemorizeConfig={setMemorizeConfig}
          onStartMemorize={startMemorize}
          onStopMemorize={stopMemorize}
          onToggleBookmark={toggleBookmark}
          onOpenNote={openNote}
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
              <p className="logo-title">Quran</p>
              <p className="logo-sub">Reader</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="action-btn mobile-only" onClick={() => setReadingMode(true)}>
              Study mode
            </button>
            <div className="topbar-icon-btns desktop-only">
              <button
                className="header-icon-btn"
                onClick={() => setShowMobileSearch(true)}
                aria-label="Search"
              >
                <SearchIcon />
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
                onClick={() => setShowMobileSettings(true)}
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
              surahs={surahs}
              loading={loadingSurahs}
              error={surahsError}
              selectedSurah={selectedSurah}
              onSelectSurah={handleSelectSurah}
              query={query}
              setQuery={setQuery}
              filteredSurahs={filteredSurahs}
              onRetry={retryData}
              onOpenSearch={() => setShowMobileSearch(true)}
              onOpenSettings={() => setShowMobileSettings(true)}
              onToggleTheme={toggleTheme}
              theme={theme}
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
              wordLoading={wordLoading}
              wordError={wordError}
              wordByAyah={wordByAyah}
              fontScale={fontScale}
              setFontScale={setFontScale}
              bookmarks={bookmarks}
              notes={notes}
              focusedAyahKey={focusedAyahKey}
              setFocusedAyahKey={setFocusedAyahKey}
              copiedKey={copiedKey}
              nowPlaying={nowPlaying}
              audioSrc={
                nowPlaying
                  ? getAudioUrl(selectedReciter.baseUrl, nowPlaying.surah, nowPlaying.ayah)
                  : null
              }
              nowPlayingLabel={nowPlayingLabel}
              reciterLabel={selectedReciter.label}
              error={surahDataError}
              onRetry={retryData}
              loadingSurahData={loadingSurahData}
              isAutoPlaying={isAutoPlaying}
              isAudioPaused={isAudioPaused}
              onPlaySurah={handlePlaySurah}
              onStopAutoPlay={handleStopAutoPlay}
              onAudioEnded={handleAudioEnded}
              onPlay={handlePlayAyah}
              onTogglePlay={handleToggleAyah}
              onToggleBookmark={toggleBookmark}
              onOpenNote={openNote}
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
              sortedBookmarks={sortedBookmarks}
              sortedNotes={sortedNotes}
              onJumpToAyah={jumpToAyah}
              onToggleBookmark={toggleBookmark}
              onOpenNote={openNote}
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

        <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </main>
    </ErrorBoundary>
  );
}
