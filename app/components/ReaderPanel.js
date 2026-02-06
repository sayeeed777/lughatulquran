"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import AyahCard from "./AyahCard";
import AudioPlayer from "./AudioPlayer";
import BismillahBanner from "./BismillahBanner";
import ProgressBar from "./ProgressBar";
import BackToTop from "./BackToTop";
import SettingsModal from "./SettingsModal";
import { AyahListSkeleton } from "./skeletons";
import { INLINE_TRANSLATIONS, NO_BISMILLAH_SURAHS, AUDIO_RECITERS } from "../lib/constants";

export default function ReaderPanel({
  selectedSurah,
  surahData,
  filteredAyahs,
  surahs,
  filteredSurahs,
  query,
  setQuery,
  reciters,
  reciterId,
  setReciterId,
  selectedTranslations,
  setSelectedTranslations,
  ayahQuery,
  setAyahQuery,
  goToAyahInput,
  setGoToAyahInput,
  handleGoToAyah,
  showWordByWord,
  setShowWordByWord,
  showMobileSettings,
  setShowMobileSettings,
  showMobileSearch,
  setShowMobileSearch,
  wordLoading,
  wordError,
  wordByAyah,
  fontScale,
  setFontScale,
  bookmarks,
  notes,
  focusedAyahKey,
  setFocusedAyahKey,
  copiedKey,
  nowPlaying,
  audioSrc,
  nowPlayingLabel,
  reciterLabel,
  error,
  loadingSurahData,
  isAutoPlaying,
  isAudioPaused,
  onPlaySurah,
  onStopAutoPlay,
  onAudioEnded,
  onPlay,
  onTogglePlay,
  onToggleBookmark,
  onOpenNote,
  onCompare,
  onCopyLink,
  onSelectSurah,
  verseKey,
  clamp
}) {
  const formatArabic = (text) => text;

  // -- Deferred Rendering State --
  const [visibleCount, setVisibleCount] = useState(15);

  // Reset visible count when surah changes or filter updates
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // 1. Immediate Render: Small batch for speed
    let targetCount = isMobile ? 15 : filteredAyahs.length;

    // Deep link support: Ensure focused ayah is visible immediately
    if (focusedAyahKey) {
      const parts = focusedAyahKey.split(':');
      if (parts.length === 2) {
        const ayahNum = parseInt(parts[1], 10);
        if (!isNaN(ayahNum)) {
          targetCount = Math.max(targetCount, ayahNum + 5);
        }
      }
    }

    setVisibleCount(targetCount);

    // 2. Deferred Full Render: Load the rest after initial paint
    // This allows the navigation animation to stay smooth, then we fill the list
    if (targetCount < filteredAyahs.length) {
      const timer = setTimeout(() => {
        setVisibleCount(filteredAyahs.length);
      }, 500); // 500ms delay to allow initial paint/transition to finish

      return () => clearTimeout(timer);
    }
  }, [selectedSurah?.number, filteredAyahs.length, focusedAyahKey]);

  const [localShowMobileSettings, setLocalShowMobileSettings] = useState(false);
  const [localShowMobileSearch, setLocalShowMobileSearch] = useState(false);
  const isMobileSettingsOpen = showMobileSettings ?? localShowMobileSettings;
  const isMobileSearchOpen = showMobileSearch ?? localShowMobileSearch;
  const openMobileSettings = setShowMobileSettings ?? setLocalShowMobileSettings;
  const openMobileSearch = setShowMobileSearch ?? setLocalShowMobileSearch;
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
                <span className="surah-title-english">
                  {selectedSurah.englishName}
                </span>
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
              {selectedSurah.englishNameTranslation} -
              {" " + selectedSurah.numberOfAyahs} ayahs -
              {" " + selectedSurah.revelationType}
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
            <button
              className="action-btn stop-btn"
              onClick={onStopAutoPlay}
            >
              ◼ Stop
            </button>
          ) : (
            <button
              className="action-btn play-btn"
              onClick={() => onPlaySurah(1)}
            >
              ▶ Play Surah
            </button>
          )}
        </div>
      )}

      {/* Apple-Style Settings Modal */}
      <SettingsModal
        isOpen={isMobileSettingsOpen}
        onClose={() => openMobileSettings(false)}
        translations={INLINE_TRANSLATIONS}
        selectedTranslations={selectedTranslations}
        setSelectedTranslations={setSelectedTranslations}
        fontScale={fontScale}
        setFontScale={setFontScale}
        reciters={reciters || AUDIO_RECITERS}
        reciterId={reciterId}
        setReciterId={setReciterId}
        clamp={clamp}
      />

      {/* Mobile Search Modal */}
      {isMobileSearchOpen && (
        <div className="mobile-settings-overlay" onClick={() => openMobileSearch(false)}>
          <div className="mobile-settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-settings-header">
              <h3>Search</h3>
              <button className="close-btn" onClick={() => openMobileSearch(false)}>✕</button>
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
                        className={`surah-item mobile-surah-item${selectedSurah?.number === surah.number ? " active" : ""}`}
                        onClick={() => {
                          onSelectSurah?.(surah);
                          openMobileSearch(false);
                        }}
                      >
                        <span className="surah-number">{surah.number}</span>
                        <span className="surah-names">
                          <span className="surah-english">{surah.englishName}</span>
                          <span className="surah-translation">
                            {surah.englishNameTranslation}
                          </span>
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
                  placeholder={isAyahSearchDisabled ? "Select a surah first" : "Ayah number or word in translation"}
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
                    placeholder={isAyahSearchDisabled ? "Select a surah first" : "Ayah number"}
                    value={goToAyahInput || ""}
                    onChange={(event) => setGoToAyahInput(event.target.value)}
                    disabled={isAyahSearchDisabled}
                  />
                  <button
                    className="action-btn"
                    onClick={() => { handleGoToAyah(); openMobileSearch(false); }}
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
                {showWordByWord && wordLoading && (
                  <span className="meta">Loading...</span>
                )}
                {showWordByWord && wordError && (
                  <span className="meta error">Unavailable</span>
                )}
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

      {error && <p className="status error">{error}</p>}

      {loadingSurahData ? (
        <AyahListSkeleton count={7} />
      ) : surahData ? (
        filteredAyahs.length ? (
          <>
            {/* Show Bismillah banner before surahs (except Al-Fatihah and At-Tawbah) */}
            {selectedSurah && !NO_BISMILLAH_SURAHS.includes(selectedSurah.number) && (
              <BismillahBanner />
            )}

            {/* Reading progress indicator */}
            <ProgressBar
              current={currentAyahNumber}
              total={selectedSurah?.numberOfAyahs || 0}
            />

            <ol className="ayah-list">
              {filteredAyahs.slice(0, visibleCount).map((ayah, index) => {
                const key = verseKey(selectedSurah.number, ayah.number);
                const isSaved = bookmarks.includes(key);
                const hasNote = notes[key];
                const isFocused = focusedAyahKey === key;
                const words =
                  wordByAyah[selectedSurah.number]?.[ayah.number] || [];
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
                    copiedKey={copiedKey}
                    verseKey={key}
                    onFocus={setFocusedAyahKey}
                    onPlay={onPlay}
                    onTogglePlay={onTogglePlay}
                    onToggleBookmark={onToggleBookmark}
                    onOpenNote={onOpenNote}
                    onCompare={onCompare}
                    onCopyLink={onCopyLink}
                    formatArabic={formatArabic}
                    index={index}
                  />
                );
              })}

            </ol>
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
