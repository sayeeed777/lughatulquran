"use client";

import { useState } from "react";
import AyahCard from "./AyahCard";
import AudioPlayer from "./AudioPlayer";
import BismillahBanner from "./BismillahBanner";
import ProgressBar from "./ProgressBar";
import BackToTop from "./BackToTop";
import { AyahListSkeleton } from "./skeletons";
import { INLINE_TRANSLATIONS, NO_BISMILLAH_SURAHS } from "../lib/constants";

export default function ReaderPanel({
  selectedSurah,
  surahData,
  filteredAyahs,
  selectedTranslation,
  setSelectedTranslation,
  ayahQuery,
  setAyahQuery,
  goToAyahInput,
  setGoToAyahInput,
  handleGoToAyah,
  showWordByWord,
  setShowWordByWord,
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
  verseKey,
  clamp
}) {
  const formatArabic = (text) => text;
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <section className="panel reader-panel">
      <div className="panel-header">
        <div>
          <h2>
            {selectedSurah
              ? `${selectedSurah.englishName} (${selectedSurah.name})`
              : "Choose a Surah"}
          </h2>
          {selectedSurah && (
            <p className="meta">
              {selectedSurah.englishNameTranslation} -
              {" " + selectedSurah.numberOfAyahs} ayahs -
              {" " + selectedSurah.revelationType}
            </p>
          )}
        </div>
        {/* Search and Settings buttons - all screens */}
        <div className="header-action-btns">
          <button 
            className="header-icon-btn"
            onClick={() => setShowMobileSearch(true)}
            aria-label="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button 
            className="header-icon-btn"
            onClick={() => setShowMobileSettings(true)}
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
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

      {/* Settings Modal */}
      {showMobileSettings && (
        <div className="mobile-settings-overlay" onClick={() => setShowMobileSettings(false)}>
          <div className="mobile-settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-settings-header">
              <h3>Settings</h3>
              <button className="close-btn" onClick={() => setShowMobileSettings(false)}>✕</button>
            </div>
            <div className="mobile-settings-body">
              <div className="setting-group">
                <label className="setting-label">Translation</label>
                <div className="translation-toggle-mobile">
                  {INLINE_TRANSLATIONS.map((translation) => (
                    <button
                      key={translation.id}
                      className={selectedTranslation === translation.id ? "active" : ""}
                      onClick={() => {
                        setSelectedTranslation(translation.id);
                      }}
                    >
                      {translation.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-group">
                <label className="setting-label">Text Size</label>
                <div className="size-controls-row">
                  <div className="size-control">
                    <span className="size-label">Arabic</span>
                    <input
                      type="range"
                      className="settings-range"
                      min="0.8"
                      max="1.4"
                      step="0.05"
                      value={fontScale.arabic}
                      onChange={(event) =>
                        setFontScale((prev) => ({
                          ...prev,
                          arabic: clamp(Number(event.target.value), 0.8, 1.4)
                        }))
                      }
                    />
                  </div>
                  <div className="size-control">
                    <span className="size-label">Translation</span>
                    <input
                      type="range"
                      className="settings-range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={fontScale.translation}
                      onChange={(event) =>
                        setFontScale((prev) => ({
                          ...prev,
                          translation: clamp(Number(event.target.value), 0.8, 1.3)
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <div className="mobile-settings-overlay" onClick={() => setShowMobileSearch(false)}>
          <div className="mobile-settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-settings-header">
              <h3>Search & Navigate</h3>
              <button className="close-btn" onClick={() => setShowMobileSearch(false)}>✕</button>
            </div>
            <div className="mobile-settings-body">
              <div className="setting-group">
                <label className="setting-label">Search Ayahs</label>
                <input
                  type="text"
                  className="mobile-input"
                  placeholder="Ayah number or word in translation"
                  value={ayahQuery || ""}
                  onChange={(event) => setAyahQuery(event.target.value)}
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
                    placeholder="Ayah number"
                    value={goToAyahInput || ""}
                    onChange={(event) => setGoToAyahInput(event.target.value)}
                  />
                  <button className="action-btn" onClick={() => { handleGoToAyah(); setShowMobileSearch(false); }}>
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
              current={filteredAyahs.length > 0 ? 1 : 0}
              total={selectedSurah?.numberOfAyahs || 0}
            />

            <ol className="ayah-list">
              {filteredAyahs.map((ayah, index) => {
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
                    selectedTranslation={selectedTranslation}
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
