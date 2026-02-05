"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AudioPlayer from "./AudioPlayer";

// Progress Ring Component
const ProgressRing = ({ progress, size = 40, strokeWidth = 3 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        className="progress-ring-bg"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="progress-ring-fill"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
        }}
      />
    </svg>
  );
};

// Floating Action Button
const FloatingButton = ({ icon, label, onClick, active, variant = "default" }) => (
  <motion.button
    className={`study-fab ${variant} ${active ? "active" : ""}`}
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    title={label}
  >
    {icon}
  </motion.button>
);

// Quick Panel Component (Notion-style sidebar)
const QuickPanel = ({ isOpen, onClose, activeTab, setActiveTab, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="quick-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.aside
          className="quick-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <div className="quick-panel-header">
            <div className="quick-panel-tabs">
              {["bookmarks", "notes", "plan"].map((tab) => (
                <button
                  key={tab}
                  className={`quick-panel-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <button className="quick-panel-close" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="quick-panel-content">
            {children}
          </div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);

// Stats Card Component
const StatCard = ({ label, value, icon, color }) => (
  <div className="study-stat-card" style={{ "--stat-color": color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

export default function StudyModeView({
  selectedSurah,
  surahData,
  filteredAyahs,
  selectedTranslation = "en.sahih",
  bookmarks,
  notes,
  sortedBookmarks,
  sortedNotes,
  readingPlan,
  planSummary,
  focusedAyahKey,
  setFocusedAyahKey,
  fontScale,
  setFontScale,
  nowPlaying,
  isAutoPlaying,
  isAudioPaused,
  audioSrc,
  reciterLabel,
  onExit,
  onPlayAyah,
  onTogglePlay,
  onStopAutoPlay,
  onPlaySurah,
  onAudioEnded,
  onToggleBookmark,
  onOpenNote,
  onJumpToAyah,
  surahByNumber,
  verseKey,
  clamp,
}) {
  const [showControls, setShowControls] = useState(true);
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [quickPanelTab, setQuickPanelTab] = useState("bookmarks");
  const [readingTime, setReadingTime] = useState(0);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const ayahs = filteredAyahs || surahData?.ayahs || [];
  const totalAyahs = ayahs.length;
  const progress = totalAyahs > 0 ? Math.round((currentAyahIndex / totalAyahs) * 100) : 0;

  // Reading time tracker
  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Track scroll position for current ayah
  useEffect(() => {
    const handleScroll = () => {
      const ayahElements = document.querySelectorAll(".study-ayah-card");
      let closestIndex = 0;
      let closestDistance = Infinity;

      ayahElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - window.innerHeight / 3);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentAyahIndex(closestIndex + 1);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isBookmarked = (surah, ayah) => bookmarks?.includes(verseKey(surah, ayah));
  const hasNote = (surah, ayah) => notes?.[verseKey(surah, ayah)];

  const parseVerseKey = (key) => {
    const [surah, ayah] = key.split(":").map(Number);
    return { surah, ayah };
  };

  return (
    <div className="study-mode-container">
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
              <button
                className="study-panel-toggle"
                onClick={() => setShowQuickPanel(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}
      <div className="study-reading-area" ref={scrollContainerRef}>
        {/* Surah Opening */}
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

        {/* Bismillah */}
        {selectedSurah?.number !== 1 && selectedSurah?.number !== 9 && (
          <div className="study-bismillah" lang="ar" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}

        {/* Ayahs */}
        <div className="study-ayah-list">
          {ayahs.map((ayah, index) => {
            const ayahNum = ayah.numberInSurah || ayah.number;
            const key = verseKey(selectedSurah?.number, ayahNum);
            const bookmarked = isBookmarked(selectedSurah?.number, ayahNum);
            const noted = hasNote(selectedSurah?.number, ayahNum);
            const isPlaying = nowPlaying?.surah === selectedSurah?.number && nowPlaying?.ayah === ayahNum;

            return (
              <motion.article
                key={key || `ayah-${index}`}
                id={`ayah-${ayahNum}`}
                className={`study-ayah-card ${isPlaying ? "playing" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <div className="study-ayah-number">
                  <span>{ayahNum}</span>
                </div>

                <div className="study-ayah-content">
                  <p
                    className="study-ayah-arabic"
                    lang="ar"
                    dir="rtl"
                    style={{ fontSize: `calc(2rem * ${fontScale?.arabic || 1})` }}
                  >
                    {ayah.arabic || ayah.text}
                  </p>
                  {(ayah.translations?.[selectedTranslation]?.text || ayah.translation) && (
                    <p
                      className="study-ayah-translation"
                      style={{ fontSize: `calc(1rem * ${fontScale?.translation || 1})` }}
                    >
                      {ayah.translations?.[selectedTranslation]?.text || ayah.translation}
                    </p>
                  )}
                </div>

                <div className="study-ayah-actions">
                  <button
                    className={`study-ayah-action ${bookmarked ? "active" : ""}`}
                    onClick={() => onToggleBookmark(selectedSurah?.number, ayahNum)}
                    title={bookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </button>
                  <button
                    className={`study-ayah-action ${noted ? "active" : ""}`}
                    onClick={() => onOpenNote(selectedSurah?.number, ayahNum)}
                    title={noted ? "Edit note" : "Add note"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className={`study-ayah-action ${isPlaying ? "active" : ""}`}
                    onClick={() => onTogglePlay(selectedSurah?.number, ayahNum)}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isPlaying ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      {isPlaying ? (
                        <>
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </>
                      ) : (
                        <polygon points="5 3 19 12 5 21 5 3" />
                      )}
                    </svg>
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* End of Surah */}
        <div className="study-surah-end">
          <div className="study-end-decoration">
            <span className="decoration-star">✦</span>
          </div>
          <p className="study-end-text">End of Surah</p>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="study-control-bar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="control-bar-inner">
              {/* Font Controls */}
              <div className="control-group">
                <span className="control-label">Font</span>
                <div className="control-buttons">
                  <button
                    className="control-btn"
                    onClick={() => setFontScale((prev) => ({
                      ...prev,
                      arabic: clamp(prev.arabic - 0.1, 0.6, 2),
                    }))}
                  >
                    A-
                  </button>
                  <button
                    className="control-btn"
                    onClick={() => setFontScale((prev) => ({
                      ...prev,
                      arabic: clamp(prev.arabic + 0.1, 0.6, 2),
                    }))}
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="control-divider" />

              {/* Audio Controls */}
              <div className="control-group audio-controls">
                {isAutoPlaying ? (
                  <button className="control-btn primary" onClick={onStopAutoPlay}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    <span>Stop</span>
                  </button>
                ) : (
                  <button className="control-btn primary" onClick={onPlaySurah}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Play Surah</span>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="control-divider" />

              {/* Navigation */}
              <div className="control-group">
                <span className="control-label">Ayah</span>
                <div className="ayah-navigator">
                  <span className="current-ayah">{currentAyahIndex}</span>
                  <span className="ayah-separator">/</span>
                  <span className="total-ayahs">{totalAyahs}</span>
                </div>
              </div>

              {/* Stats Button */}
              <div className="control-divider" />
              <button
                className="control-btn icon-only"
                onClick={() => {
                  setQuickPanelTab("bookmarks");
                  setShowQuickPanel(true);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                {sortedBookmarks?.length > 0 && (
                  <span className="control-badge">{sortedBookmarks.length}</span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Panel (Notion-style) */}
      <QuickPanel
        isOpen={showQuickPanel}
        onClose={() => setShowQuickPanel(false)}
        activeTab={quickPanelTab}
        setActiveTab={setQuickPanelTab}
      >
        {quickPanelTab === "bookmarks" && (
          <div className="quick-panel-section">
            {sortedBookmarks?.length > 0 ? (
              <ul className="quick-list">
                {sortedBookmarks.map((key) => {
                  const { surah, ayah } = parseVerseKey(key);
                  const name = surahByNumber?.get(surah)?.englishName || `Surah ${surah}`;
                  return (
                    <li key={key} className="quick-list-item">
                      <div className="quick-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                        </svg>
                      </div>
                      <div className="quick-item-content">
                        <span className="quick-item-title">{name}</span>
                        <span className="quick-item-sub">Ayah {ayah}</span>
                      </div>
                      <button
                        className="quick-item-action"
                        onClick={() => {
                          onJumpToAyah(surah, ayah);
                          setShowQuickPanel(false);
                        }}
                      >
                        Go
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="quick-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                <p>No bookmarks yet</p>
                <span>Tap the bookmark icon on any ayah</span>
              </div>
            )}
          </div>
        )}

        {quickPanelTab === "notes" && (
          <div className="quick-panel-section">
            {sortedNotes?.length > 0 ? (
              <ul className="quick-list">
                {sortedNotes.map((note) => {
                  const name = surahByNumber?.get(note.surah)?.englishName || `Surah ${note.surah}`;
                  const preview = note.value.length > 60 ? `${note.value.slice(0, 60)}...` : note.value;
                  return (
                    <li key={note.key} className="quick-list-item">
                      <div className="quick-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </div>
                      <div className="quick-item-content">
                        <span className="quick-item-title">{name} - Ayah {note.ayah}</span>
                        <span className="quick-item-sub">{preview}</span>
                      </div>
                      <button
                        className="quick-item-action"
                        onClick={() => {
                          onOpenNote(note.surah, note.ayah);
                          setShowQuickPanel(false);
                        }}
                      >
                        Edit
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="quick-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <p>No notes yet</p>
                <span>Tap the note icon on any ayah to add thoughts</span>
              </div>
            )}
          </div>
        )}

        {quickPanelTab === "plan" && (
          <div className="quick-panel-section">
            <div className="quick-stats-grid">
              <StatCard
                label="Reading Time"
                value={formatTime(readingTime)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                }
                color="var(--accent)"
              />
              <StatCard
                label="Progress"
                value={`${progress}%`}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                }
                color="var(--accent-2)"
              />
              <StatCard
                label="Bookmarks"
                value={sortedBookmarks?.length || 0}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                }
                color="#f59e0b"
              />
              <StatCard
                label="Notes"
                value={sortedNotes?.length || 0}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                }
                color="#8b5cf6"
              />
            </div>

            {planSummary && !planSummary.completed && !planSummary.error && (
              <div className="quick-plan-today">
                <h4>Today's Goal</h4>
                <p className="plan-range-text">
                  {planSummary.startVerse && planSummary.endVerse
                    ? `${surahByNumber?.get(planSummary.startVerse.surah)?.englishName || "Surah"} ${planSummary.startVerse.ayah} - ${surahByNumber?.get(planSummary.endVerse.surah)?.englishName || "Surah"} ${planSummary.endVerse.ayah}`
                    : "Set up your reading plan"}
                </p>
                {planSummary.startVerse && (
                  <button
                    className="plan-jump-btn"
                    onClick={() => {
                      onJumpToAyah(planSummary.startVerse.surah, planSummary.startVerse.ayah);
                      setShowQuickPanel(false);
                    }}
                  >
                    Start Reading
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </QuickPanel>

      {/* Hidden Audio Player */}
      <AudioPlayer
        reciterLabel={reciterLabel}
        nowPlayingLabel={nowPlaying ? `Ayah ${nowPlaying.ayah}` : ""}
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
    </div>
  );
}
