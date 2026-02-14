"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import AyahCard from "./AyahCard";
import { AudioPlayer, ProgressBar, BackToTop, InlineError } from "../common";
import BismillahBanner from "./BismillahBanner";
import { SettingsModal } from "../modals";
import { AyahListSkeleton } from "../skeletons";
import { ALL_TRANSLATIONS, NO_BISMILLAH_SURAHS, AUDIO_RECITERS, ARABIC_FONTS } from "../../lib/constants";
import { verseKey, clamp } from "../../lib/utils";
import { useAudio, useBookmarkContext, useQuranData, useUIState, usePreferences, useActions } from "../../contexts";

export default function ReaderPanel() {
  // Consume from contexts
  const {
    selectedSurah,
    surahData,
    filteredAyahs,
    surahs,
    filteredSurahs,
    wordByAyah,
    wordLoading,
    wordError,
    loadingSurahData,
    surahDataError: error
  } = useQuranData();
  const {
    query,
    setQuery,
    ayahQuery,
    setAyahQuery,
    goToAyahInput,
    setGoToAyahInput,
    showMobileSettings,
    setShowMobileSettings,
    showMobileSearch,
    setShowMobileSearch,
    settingsTab,
    setSettingsTab,
    focusedAyahKey,
    setFocusedAyahKey
  } = useUIState();
  const {
    arabicFontId,
    setArabicFontId,
    selectedTranslations,
    setSelectedTranslations,
    showWordByWord,
    setShowWordByWord,
    fontScale,
    setFontScale,
    prayerSettings,
    setPrayerSettings,
    nextPrayerPreview,
    hasPrayerLocation
  } = usePreferences();
  const {
    nowPlaying,
    isAutoPlaying,
    isAudioPaused,
    audioSrc,
    reciterLabel,
    nowPlayingLabel,
    reciterId,
    setReciterId,
    handlePlaySurah: onPlaySurah,
    handleStopAutoPlay: onStopAutoPlay,
    handleAudioEnded: onAudioEnded,
    handlePlayAyah: onPlay,
    handleToggleAyah: onTogglePlay
  } = useAudio();
  const { bookmarks, notes, toggleBookmark: onToggleBookmark, openNote: onOpenNote } = useBookmarkContext();
  const {
    handleGoToAyah,
    retryData: onRetry,
    handleCompare: onCompare,
    copyAyahLink: onCopyLink,
    handleSelectSurah: onSelectSurah
  } = useActions();
  const formatArabic = (text?: string) => text ?? "";
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // -- Deferred Rendering State --
  const [visibleCount, setVisibleCount] = useState(15);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setIsMobileViewport(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Reset visible count when surah changes or filter updates.
  // Mobile starts with a chunk; desktop renders all.
  useEffect(() => {
    let targetCount = isMobileViewport ? 24 : filteredAyahs.length;

    // Deep link support: Ensure focused ayah is visible immediately
    if (focusedAyahKey) {
      const parts = focusedAyahKey.split(":");
      if (parts.length === 2) {
        const ayahNum = parseInt(parts[1] ?? "", 10);
        if (!isNaN(ayahNum)) {
          targetCount = Math.max(targetCount, ayahNum + 8);
        }
      }
    }

    setVisibleCount(Math.min(filteredAyahs.length, targetCount));
  }, [selectedSurah?.number, filteredAyahs.length, focusedAyahKey, isMobileViewport]);

  const isMobileSettingsOpen = showMobileSettings;
  const isMobileSearchOpen = showMobileSearch;
  const openMobileSettings = setShowMobileSettings;
  const openMobileSearch = setShowMobileSearch;
  const currentAyahNumber = useMemo(() => {
    if (!selectedSurah || !filteredAyahs?.length) return 0;

    if (focusedAyahKey) {
      const parts = String(focusedAyahKey).split(":");
      const ayah = Number(parts[1]);
      if (Number.isFinite(ayah) && ayah > 0) {
        return ayah;
      }
    }

    if (nowPlaying?.surah === selectedSurah.number && Number.isFinite(nowPlaying?.ayah)) {
      return nowPlaying.ayah;
    }

    return 1;
  }, [filteredAyahs?.length, focusedAyahKey, nowPlaying, selectedSurah]);

  useEffect(() => {
    if (!isMobileViewport) return;
    if (!filteredAyahs.length) return;
    const minimumVisible = Math.min(filteredAyahs.length, Math.max(visibleCount, currentAyahNumber + 10));
    if (minimumVisible !== visibleCount) {
      setVisibleCount(minimumVisible);
    }
  }, [currentAyahNumber, filteredAyahs.length, isMobileViewport, visibleCount]);

  useEffect(() => {
    if (!isMobileViewport) return;
    if (visibleCount >= filteredAyahs.length) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisibleCount((prev) => Math.min(filteredAyahs.length, prev + 28));
      },
      {
        root: null,
        rootMargin: "240px 0px",
        threshold: 0.01
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredAyahs.length, isMobileViewport, visibleCount]);
  const mobileSurahResults = useMemo(() => {
    const list = query?.trim() ? filteredSurahs : surahs;
    if (!Array.isArray(list)) return [];
    return list.slice(0, 12);
  }, [filteredSurahs, query, surahs]);
  const isAyahSearchDisabled = !selectedSurah;

  return (
    <section className="panel reader-panel">
      <div className="panel-header">
        <div>
          <h2>
            {selectedSurah ? (
              <>
                <span className="surah-title-english">{selectedSurah.englishName}</span>
                <span className="surah-title-arabic" lang="ar" dir="rtl">
                  ({selectedSurah.name})
                </span>
              </>
            ) : (
              "Choose a Surah"
            )}
          </h2>
          {selectedSurah && (
            <p className="meta">
              {selectedSurah.englishNameTranslation} -{" " + selectedSurah.numberOfAyahs} ayahs -{" " +
                selectedSurah.revelationType}
            </p>
          )}
        </div>
      </div>

      {/* Quick Controls Row */}
      {selectedSurah && (
        <div className="quick-controls-row">
          <div className="sliders-row">
            <div className="quick-slider">
              <span>Arabic</span>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={fontScale.arabic}
                onChange={(e) =>
                  setFontScale((prev) => ({
                    ...prev,
                    arabic: Number(e.target.value)
                  }))
                }
              />
            </div>
            <div className="quick-slider">
              <span>Translation</span>
              <input
                type="range"
                min="0.9"
                max="1.4"
                step="0.05"
                value={fontScale.translation}
                onChange={(e) =>
                  setFontScale((prev) => ({
                    ...prev,
                    translation: Number(e.target.value)
                  }))
                }
              />
            </div>
          </div>
          {isAutoPlaying ? (
            <button className="action-btn stop-btn" onClick={onStopAutoPlay}>
              ◼ Stop
            </button>
          ) : (
            <button className="action-btn play-btn" onClick={() => onPlaySurah(1)}>
              ▶ Play Surah
            </button>
          )}
        </div>
      )}

      {/* Apple-Style Settings Modal */}
      <SettingsModal
        isOpen={isMobileSettingsOpen}
        onClose={() => openMobileSettings(false)}
        initialTab={settingsTab}
        onTabChange={setSettingsTab}
        translations={ALL_TRANSLATIONS}
        selectedTranslations={selectedTranslations}
        setSelectedTranslations={setSelectedTranslations}
        fontScale={fontScale}
        setFontScale={setFontScale}
        reciters={AUDIO_RECITERS}
        reciterId={reciterId}
        setReciterId={setReciterId}
        arabicFonts={ARABIC_FONTS}
        arabicFontId={arabicFontId}
        setArabicFontId={setArabicFontId}
        prayerSettings={prayerSettings}
        setPrayerSettings={setPrayerSettings}
        nextPrayerPreview={nextPrayerPreview}
        hasPrayerLocation={hasPrayerLocation}
        clamp={clamp}
      />

      {/* Mobile Search Modal */}
      {isMobileSearchOpen && (
        <div className="mobile-settings-overlay" onClick={() => openMobileSearch(false)}>
          <div className="mobile-settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-settings-header">
              <h3>Search</h3>
              <button className="close-btn" onClick={() => openMobileSearch(false)}>
                ✕
              </button>
            </div>
            <div className="mobile-settings-body">
              <div className="setting-group">
                <label className="setting-label">Search Surahs</label>
                <input
                  type="text"
                  className="mobile-input"
                  placeholder="Type surah name or number"
                  value={query || ""}
                  onChange={(event) => setQuery?.(event.target.value)}
                />
                <div className="mobile-surah-results">
                  {mobileSurahResults.length ? (
                    mobileSurahResults.map((surah) => (
                      <button
                        key={surah.number}
                        className={`surah-item mobile-surah-item${selectedSurah?.number === surah.number ? " active" : ""
                          }`}
                        onClick={() => {
                          onSelectSurah?.(surah);
                          openMobileSearch(false);
                        }}
                      >
                        <span className="surah-number">{surah.number}</span>
                        <span className="surah-names">
                          <span className="surah-english">{surah.englishName}</span>
                          <span className="surah-translation">{surah.englishNameTranslation}</span>
                        </span>
                        <span className="surah-arabic" lang="ar" dir="rtl">
                          {surah.name}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="meta">No surahs found.</p>
                  )}
                </div>
              </div>
              <div className="setting-group">
                <label className="setting-label">Search Ayahs</label>
                <input
                  type="text"
                  className="mobile-input"
                  placeholder={
                    isAyahSearchDisabled
                      ? "Select a surah first"
                      : "Ayah number or word in translation"
                  }
                  value={ayahQuery || ""}
                  onChange={(event) => setAyahQuery(event.target.value)}
                  disabled={isAyahSearchDisabled}
                />
              </div>
              <div className="setting-group">
                <label className="setting-label">Go to Ayah</label>
                <div className="mobile-go-ayah">
                  <input
                    type="number"
                    className="mobile-input"
                    min={1}
                    max={selectedSurah?.numberOfAyahs || 1}
                    placeholder={
                      isAyahSearchDisabled ? "Select a surah first" : "Ayah number"
                    }
                    value={goToAyahInput || ""}
                    onChange={(event) => setGoToAyahInput(event.target.value)}
                    disabled={isAyahSearchDisabled}
                  />
                  <button
                    className="action-btn"
                    onClick={() => {
                      handleGoToAyah();
                      openMobileSearch(false);
                    }}
                    disabled={isAyahSearchDisabled}
                  >
                    Go
                  </button>
                </div>
              </div>
              <div className="setting-group">
                <label className="setting-label">Word by Word</label>
                <button
                  className={`action-btn mobile-toggle-btn${showWordByWord ? " saved" : ""}`}
                  onClick={() => setShowWordByWord((prev) => !prev)}
                >
                  {showWordByWord ? "✓ Enabled" : "Enable"}
                </button>
                {showWordByWord && wordLoading && <span className="meta">Loading...</span>}
                {showWordByWord && wordError && <span className="meta error">Unavailable</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <AudioPlayer
        reciterLabel={reciterLabel}
        nowPlayingLabel={nowPlayingLabel}
        audioSrc={audioSrc}
        isAutoPlaying={isAutoPlaying}
        isAudioPaused={isAudioPaused}
        onPlaySurah={onPlaySurah}
        onStopAutoPlay={onStopAutoPlay}
        onAudioEnded={onAudioEnded}
        selectedSurah={selectedSurah}
        nowPlaying={nowPlaying}
        showPlayerBar={false}
      />

      {error && <InlineError title="Reader unavailable" message={error} onRetry={onRetry} />}

      {loadingSurahData ? (
        <AyahListSkeleton count={7} />
      ) : surahData && selectedSurah ? (
        filteredAyahs.length ? (
          <>
            {/* Show Bismillah banner before surahs (except Al-Fatihah and At-Tawbah) */}
            {!NO_BISMILLAH_SURAHS.includes(selectedSurah.number) && (
              <BismillahBanner surahNumber={selectedSurah.number} />
            )}

            {/* Reading progress indicator */}
            <ProgressBar current={currentAyahNumber} total={selectedSurah.numberOfAyahs || 0} />

            <ol className="ayah-list">
              {filteredAyahs.slice(0, visibleCount).map((ayah) => {
                const key = verseKey(selectedSurah.number, ayah.number);
                const isSaved = bookmarks.includes(key);
                const hasNote = Boolean(notes[key]);
                const isFocused = focusedAyahKey === key;
                const words = wordByAyah[selectedSurah.number]?.[ayah.number] || [];
                return (
                  <AyahCard
                    key={ayah.number}
                    ayah={ayah}
                    surahNumber={selectedSurah.number}
                    selectedTranslations={selectedTranslations}
                    isSaved={isSaved}
                    hasNote={hasNote}
                    isFocused={isFocused}
                    nowPlaying={nowPlaying}
                    isAudioPaused={isAudioPaused}
                    words={words}
                    showWordByWord={showWordByWord}
                    verseKey={key}
                    onFocus={setFocusedAyahKey}
                    onPlay={onPlay}
                    onTogglePlay={onTogglePlay}
                    onToggleBookmark={onToggleBookmark}
                    onOpenNote={onOpenNote}
                    onCompare={onCompare}
                    onCopyLink={onCopyLink}
                    formatArabic={formatArabic}
                  />
                );
              })}
            </ol>
            {isMobileViewport && visibleCount < filteredAyahs.length ? (
              <div ref={loadMoreSentinelRef} className="ayah-load-sentinel" aria-hidden="true" />
            ) : null}
            <BackToTop />
          </>
        ) : (
          <p className="status">No ayahs found.</p>
        )
      ) : (
        <p className="status">Select a surah to begin.</p>
      )}
    </section>
  );
}
