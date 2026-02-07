"use client";

import type { CSSProperties } from "react";
import {
  SurahList,
  ReaderPanel,
  StudyPanel,
  StudyModeView,
  CompareModal,
  NoteModal,
  ErrorBoundary,
  SectionErrorBoundary,
  LastReadCard,
  KeyboardShortcutsHelp
} from "./components";
import { AUDIO_RECITERS, ARABIC_FONTS } from "./lib/constants";
import { verseKey, clamp, getAudioUrl, getLocalDateString } from "./lib/utils";
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
    lastRead,
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
    selectedArabicFont,
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

  const mainStyle: CSSProperties & Record<string, string | number> = {
    "--arabic-scale": fontScale.arabic,
    "--translation-scale": fontScale.translation,
    "--font-arabic": selectedArabicFont?.css || ""
  };

  return (
    <ErrorBoundary>
      <main className="app" style={mainStyle}>
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <button
                className="header-icon-btn"
                onClick={toggleTheme}
                aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
              >
                {isLightTheme ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m4.93 19.07 1.41-1.41" />
                    <path d="m17.66 6.34 1.41-1.41" />
                  </svg>
                )}
              </button>
              <button
                className="header-icon-btn"
                onClick={() => setShowMobileSettings(true)}
                aria-label="Settings"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 2.09V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09A1.65 1.65 0 0 0 21.91 11H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <section className="dashboard">
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
              lastRead={lastRead}
            />
          </SectionErrorBoundary>
        </section>

        {!selectedSurah && lastRead && (
          <LastReadCard
            lastRead={lastRead}
            onContinue={() => jumpToAyah(lastRead.surah, lastRead.ayah)}
          />
        )}

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
