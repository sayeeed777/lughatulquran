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
  ThemeChooser,
  SettingsIcon
} from "./components";
import { AUDIO_RECITERS, ARABIC_FONTS, FONT_SCALE } from "./lib/constants";
import { verseKey, clamp, getAudioUrl, getLocalDateString } from "./lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "./lib/styleClasses";
import { useHomeController } from "./hooks/useHomeController";
import { ThemeProvider, AudioProvider, BookmarkProvider } from "./contexts";

export default function Home() {
  const [isPrayerPanelOpen, setIsPrayerPanelOpen] = useState(false);

  const { data, audio, bookmarks, preferences, ui, actions } = useHomeController();

  // Derive audio values needed by providers
  const audioSrc = audio.nowPlaying
    ? getAudioUrl(audio.selectedReciter.baseUrl, audio.nowPlaying.surah, audio.nowPlaying.ayah)
    : null;
  const reciterLabel = audio.selectedReciter.label;

  // Render
  if (ui.readingMode) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={preferences.theme} isLightTheme={preferences.isLightTheme} setTheme={preferences.setTheme}>
        <BookmarkProvider
          bookmarks={bookmarks.bookmarks}
          notes={bookmarks.notes}
          toggleBookmark={bookmarks.toggleBookmark}
          sortedBookmarks={bookmarks.sortedBookmarks}
          sortedNotes={bookmarks.sortedNotes}
          noteTarget={bookmarks.noteTarget}
          noteDraft={bookmarks.noteDraft}
          setNoteDraft={bookmarks.setNoteDraft}
          openNote={bookmarks.openNote}
          saveNote={bookmarks.saveNote}
          closeNote={bookmarks.closeNote}
        >
          <AudioProvider
            nowPlaying={audio.nowPlaying}
            isAutoPlaying={audio.isAutoPlaying}
            isAudioPaused={audio.isAudioPaused}
            audioSrc={audioSrc}
            reciterLabel={reciterLabel}
            nowPlayingLabel={audio.nowPlayingLabel}
            handlePlaySurah={audio.handlePlaySurah}
            handleStopAutoPlay={audio.handleStopAutoPlay}
            handleAudioEnded={audio.handleAudioEnded}
            handlePlayAyah={audio.handlePlayAyah}
            handleToggleAyah={audio.handleToggleAyah}
          >
            <StudyModeView
              selectedSurah={data.selectedSurah}
              surahData={data.surahData}
              filteredAyahs={data.filteredAyahs}
              reciters={AUDIO_RECITERS}
              reciterId={audio.reciterId}
              setReciterId={audio.setReciterId}
              arabicFonts={ARABIC_FONTS}
              arabicFontId={preferences.arabicFontId}
              setArabicFontId={preferences.setArabicFontId}
              selectedTranslations={preferences.selectedTranslations}
              readingPlan={preferences.readingPlan}
              planSummary={actions.planSummary}
              focusedAyahKey={ui.focusedAyahKey}
              setFocusedAyahKey={ui.setFocusedAyahKey}
              fontScale={preferences.fontScale}
              setFontScale={preferences.setFontScale}
              playbackRate={audio.playbackRate}
              setPlaybackRate={audio.setPlaybackRate}
              wordByAyah={data.wordByAyah}
              wordLoading={data.wordLoading}
              onExit={() => ui.setReadingMode(false)}
              memorizeConfig={preferences.memorizeConfig}
              setMemorizeConfig={preferences.setMemorizeConfig}
              onStartMemorize={preferences.startMemorize}
              onStopMemorize={preferences.stopMemorize}
              onJumpToAyah={actions.jumpToAyah}
              surahByNumber={data.surahByNumber}
              verseKey={verseKey}
              clamp={clamp}
            />
            <NoteModal
              noteTarget={bookmarks.noteTarget}
              noteDraft={bookmarks.noteDraft}
              setNoteDraft={bookmarks.setNoteDraft}
              surahByNumber={data.surahByNumber}
              onSave={bookmarks.saveNote}
              onClose={bookmarks.closeNote}
            />
          </AudioProvider>
        </BookmarkProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const appTypographyClasses = `${getArabicScaleClass(preferences.fontScale.arabic)} ${getTranslationScaleClass(
    preferences.fontScale.translation
  )} ${getArabicFontClass(preferences.arabicFontId)}`;

  const continueSession = preferences.studySession || (preferences.lastRead
    ? {
      surah: preferences.lastRead.surah,
      ayah: preferences.lastRead.ayah,
      surahName: preferences.lastRead.surahName,
      updatedAt: preferences.lastRead.timestamp
    }
    : null);

  const handleContinueSession = () => {
    if (!continueSession) return;
    if (preferences.studySession?.reciterId) {
      audio.setReciterId(preferences.studySession.reciterId);
    }
    if (preferences.studySession?.fontScale) {
      preferences.setFontScale({
        arabic: clamp(
          Number(preferences.studySession.fontScale.arabic) || 1,
          FONT_SCALE.min.arabic,
          FONT_SCALE.max.arabic
        ),
        translation: clamp(
          Number(preferences.studySession.fontScale.translation) || 1,
          FONT_SCALE.min.translation,
          FONT_SCALE.max.translation
        )
      });
    }
    if (Number.isFinite(preferences.studySession?.playbackRate)) {
      audio.setPlaybackRate(clamp(Number(preferences.studySession?.playbackRate) || 1, 0.75, 1.25));
    }
    actions.jumpToAyah(continueSession.surah, continueSession.ayah);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={preferences.theme} isLightTheme={preferences.isLightTheme} setTheme={preferences.setTheme}>
        <BookmarkProvider
          bookmarks={bookmarks.bookmarks}
          notes={bookmarks.notes}
          toggleBookmark={bookmarks.toggleBookmark}
          sortedBookmarks={bookmarks.sortedBookmarks}
          sortedNotes={bookmarks.sortedNotes}
          noteTarget={bookmarks.noteTarget}
          noteDraft={bookmarks.noteDraft}
          setNoteDraft={bookmarks.setNoteDraft}
          openNote={bookmarks.openNote}
          saveNote={bookmarks.saveNote}
          closeNote={bookmarks.closeNote}
        >
          <AudioProvider
            nowPlaying={audio.nowPlaying}
            isAutoPlaying={audio.isAutoPlaying}
            isAudioPaused={audio.isAudioPaused}
            audioSrc={audioSrc}
            reciterLabel={reciterLabel}
            nowPlayingLabel={audio.nowPlayingLabel}
            handlePlaySurah={audio.handlePlaySurah}
            handleStopAutoPlay={audio.handleStopAutoPlay}
            handleAudioEnded={audio.handleAudioEnded}
            handlePlayAyah={audio.handlePlayAyah}
            handleToggleAyah={audio.handleToggleAyah}
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
                  <button className="action-btn mobile-only" onClick={() => ui.setReadingMode(true)}>
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
                    <ThemeChooser />
                    <button
                      className="header-icon-btn"
                      onClick={() => {
                        ui.setSettingsTab("display");
                        ui.setShowMobileSettings(true);
                      }}
                      aria-label="Settings"
                    >
                      <SettingsIcon />
                    </button>
                  </div>
                  <button className="action-btn desktop-only" onClick={() => ui.setReadingMode(true)}>
                    Study mode
                  </button>
                </div>
              </div>

              <section className="content">
                <SectionErrorBoundary title="Surah list unavailable">
                  <SurahList
                    loading={data.loadingSurahs}
                    error={data.surahsError}
                    selectedSurah={data.selectedSurah}
                    onSelectSurah={actions.handleSelectSurah}
                    query={ui.query}
                    setQuery={ui.setQuery}
                    filteredSurahs={data.filteredSurahs}
                    onRetry={actions.retryData}
                    onOpenPrayer={() => setIsPrayerPanelOpen(true)}
                    onOpenSettings={() => {
                      ui.setSettingsTab("display");
                      ui.setShowMobileSettings(true);
                    }}
                  />
                </SectionErrorBoundary>

                <SectionErrorBoundary title="Reader unavailable">
                  <ReaderPanel
                    selectedSurah={data.selectedSurah}
                    surahData={data.surahData}
                    filteredAyahs={data.filteredAyahs}
                    surahs={data.surahs}
                    filteredSurahs={data.filteredSurahs}
                    query={ui.query}
                    setQuery={ui.setQuery}
                    reciters={AUDIO_RECITERS}
                    reciterId={audio.reciterId}
                    setReciterId={audio.setReciterId}
                    arabicFonts={ARABIC_FONTS}
                    arabicFontId={preferences.arabicFontId}
                    setArabicFontId={preferences.setArabicFontId}
                    selectedTranslations={preferences.selectedTranslations}
                    setSelectedTranslations={preferences.setSelectedTranslations}
                    ayahQuery={ui.ayahQuery}
                    setAyahQuery={ui.setAyahQuery}
                    goToAyahInput={ui.goToAyahInput}
                    setGoToAyahInput={ui.setGoToAyahInput}
                    handleGoToAyah={actions.handleGoToAyah}
                    showWordByWord={preferences.showWordByWord}
                    setShowWordByWord={preferences.setShowWordByWord}
                    showMobileSettings={ui.showMobileSettings}
                    setShowMobileSettings={ui.setShowMobileSettings}
                    showMobileSearch={ui.showMobileSearch}
                    setShowMobileSearch={ui.setShowMobileSearch}
                    settingsTab={ui.settingsTab}
                    setSettingsTab={ui.setSettingsTab}
                    wordLoading={data.wordLoading}
                    wordError={data.wordError}
                    wordByAyah={data.wordByAyah}
                    fontScale={preferences.fontScale}
                    setFontScale={preferences.setFontScale}
                    focusedAyahKey={ui.focusedAyahKey}
                    setFocusedAyahKey={ui.setFocusedAyahKey}
                    prayerSettings={preferences.prayerSettings}
                    setPrayerSettings={preferences.setPrayerSettings}
                    nextPrayerPreview={preferences.nextPrayerPreview}
                    hasPrayerLocation={preferences.hasPrayerLocation}
                    error={data.surahDataError}
                    onRetry={actions.retryData}
                    loadingSurahData={data.loadingSurahData}
                    onCompare={actions.handleCompare}
                    onCopyLink={actions.copyAyahLink}
                    onSelectSurah={actions.handleSelectSurah}
                    verseKey={verseKey}
                    clamp={clamp}
                  />
                </SectionErrorBoundary>

                <SectionErrorBoundary title="Study panel unavailable">
                  <StudyPanel
                    surahs={data.surahs}
                    surahByNumber={data.surahByNumber}
                    readingPlan={preferences.readingPlan}
                    setReadingPlan={preferences.setReadingPlan}
                    planSummary={actions.planSummary}
                    onJumpToAyah={actions.jumpToAyah}
                    formatRangeLabel={actions.formatRangeLabel}
                    getLocalDateString={getLocalDateString}
                    continueSession={continueSession}
                    onContinueSession={handleContinueSession}
                  />
                </SectionErrorBoundary>
              </section>

              <CompareModal
                selectedAyah={ui.selectedAyah}
                selectedSurah={data.selectedSurah}
                selectedAyahKey={
                  data.selectedSurah && ui.selectedAyah ? `${data.selectedSurah.number}:${ui.selectedAyah.number}` : null
                }
                taqiCache={data.taqiCache}
                taqiLoading={data.taqiLoading}
                onClose={() => ui.setSelectedAyah(null)}
              />

              <NoteModal
                noteTarget={bookmarks.noteTarget}
                noteDraft={bookmarks.noteDraft}
                setNoteDraft={bookmarks.setNoteDraft}
                surahByNumber={data.surahByNumber}
                onSave={bookmarks.saveNote}
                onClose={bookmarks.closeNote}
              />

              <PrayerPanel
                isOpen={isPrayerPanelOpen}
                onClose={() => setIsPrayerPanelOpen(false)}
                prayerSettings={preferences.prayerSettings}
                setPrayerSettings={preferences.setPrayerSettings}
                nextPrayerPreview={preferences.nextPrayerPreview}
                hasPrayerLocation={preferences.hasPrayerLocation}
              />

              <KeyboardShortcutsHelp isOpen={ui.showShortcuts} onClose={() => ui.setShowShortcuts(false)} />
            </main>
          </AudioProvider>
        </BookmarkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
