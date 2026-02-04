"use client";

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
  onPlay,
  onToggleBookmark,
  onOpenNote,
  onCompare,
  onCopyLink,
  verseKey,
  clamp
}) {
  const formatArabic = (text) => text;

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
        <div className="translation-toggle">
          {INLINE_TRANSLATIONS.map((translation) => (
            <button
              key={translation.id}
              className={selectedTranslation === translation.id ? "active" : ""}
              onClick={() => setSelectedTranslation(translation.id)}
            >
              {translation.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reader-controls">
        <div className="reader-toolbar">
          <label className="reader-search">
            <span>Search ayahs</span>
            <input
              type="text"
              placeholder="Ayah number or word in translation"
              value={ayahQuery || ""}
              onChange={(event) => setAyahQuery(event.target.value)}
            />
          </label>
          <div className="go-ayah">
            <label>
              <span>Go to ayah</span>
              <input
                type="number"
                min={1}
                max={selectedSurah?.numberOfAyahs || 1}
                value={goToAyahInput || ""}
                onChange={(event) => setGoToAyahInput(event.target.value)}
              />
            </label>
            <button className="action-btn" onClick={handleGoToAyah}>
              Go
            </button>
          </div>
          <div className="word-toggle">
            <button
              className={`action-btn${showWordByWord ? " saved" : ""}`}
              onClick={() => setShowWordByWord((prev) => !prev)}
            >
              Word by word
            </button>
            {showWordByWord && wordLoading && (
              <span className="meta">Loading...</span>
            )}
            {showWordByWord && wordError && (
              <span className="meta error">Unavailable</span>
            )}
          </div>
        </div>
        <label className="control">
          <span>Arabic size</span>
          <input
            type="range"
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
        </label>
        <label className="control">
          <span>Translation size</span>
          <input
            type="range"
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
        </label>
      </div>

      <AudioPlayer
        reciterLabel={reciterLabel}
        nowPlayingLabel={nowPlayingLabel}
        audioSrc={audioSrc}
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
                    words={words}
                    showWordByWord={showWordByWord}
                    copiedKey={copiedKey}
                    verseKey={key}
                    onFocus={setFocusedAyahKey}
                    onPlay={onPlay}
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
