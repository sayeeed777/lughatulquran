"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import {
  SurahList,
  ReaderPanel,
  StudyPanel,
  SectionErrorBoundary,
  ClockIcon,
  ThemeChooser,
  SettingsIcon,
  HomeProviders
} from "./components";
import { FONT_SCALE, STORAGE_KEYS } from "./lib/constants";
import { useLocalStorage } from "./hooks";
import { clamp } from "./lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "./lib/styleClasses";
import { useUIState, usePreferences, useAudio, useActions } from "./contexts";

const StudyModeView = dynamic(() => import("./components/study/StudyModeView"), {
  ssr: false,
  loading: () => (
    <div className="study-mode-container">
      <div className="study-ambient-bg" />
      <div className="study-load-skeleton">
        <div className="study-load-skeleton-header">
          <div className="skeleton-box" style={{ width: 60, height: 14, borderRadius: 7 }} />
          <div className="skeleton-box" style={{ width: 120, height: 18, borderRadius: 9 }} />
          <div className="skeleton-box" style={{ width: 60, height: 14, borderRadius: 7 }} />
        </div>
        <div className="study-skeleton-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="study-skeleton-card skeleton">
              <div className="study-skeleton-header">
                <div className="skeleton-box study-skeleton-badge" />
                <div className="skeleton-box study-skeleton-actions" />
              </div>
              <div className="study-skeleton-body">
                <div className="skeleton-box study-skeleton-arabic" />
                <div className="skeleton-box study-skeleton-arabic short" />
              </div>
              <div className="study-skeleton-translation">
                <div className="skeleton-box study-skeleton-line" />
                <div className="skeleton-box study-skeleton-line" />
                <div className="skeleton-box study-skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
});
const PrayerPanel = dynamic(() => import("./components/modals/PrayerPanel"), { ssr: false });
const CompareModal = dynamic(() => import("./components/modals/CompareModal"), { ssr: false });
const NoteModal = dynamic(() => import("./components/modals/NoteModal"), { ssr: false });
const KeyboardShortcutsHelp = dynamic(
  () => import("./components/modals/KeyboardShortcutsHelp"),
  { ssr: false }
);

function HomeContent() {
  const [isPrayerPanelOpen, setIsPrayerPanelOpen] = useState(false);
  const [showStudyPulse, setShowStudyPulse] = useState(false);
  const [isSurahPanelCollapsed, setIsSurahPanelCollapsed] = useLocalStorage(
    STORAGE_KEYS.surahPanelCollapsed,
    false
  );
  const [isStudyPanelCollapsed, setIsStudyPanelCollapsed] = useLocalStorage(
    STORAGE_KEYS.studyPanelCollapsed,
    false
  );

  const ui = useUIState();
  const preferences = usePreferences();
  const audio = useAudio();
  const actions = useActions();

  useEffect(() => {
    const key = "study_mode_seen";
    if (!localStorage.getItem(key)) {
      setShowStudyPulse(true);
    }
    // Open study mode if ?mode=study is in the URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "study" && !ui.readingMode) {
      ui.setReadingMode(true);
      localStorage.setItem(key, "1");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL with study mode state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasStudy = params.get("mode") === "study";
    if (ui.readingMode && !hasStudy) {
      params.set("mode", "study");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    } else if (!ui.readingMode && hasStudy) {
      params.delete("mode");
      const qs = params.toString();
      window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }
  }, [ui.readingMode]);

  const handleStudyModeClick = () => {
    setShowStudyPulse(false);
    localStorage.setItem("study_mode_seen", "1");
    ui.setReadingMode(true);
  };

  if (ui.readingMode) {
    return (
      <>
        <StudyModeView onExit={() => ui.setReadingMode(false)} />
        <NoteModal />
      </>
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
          <div className="study-btn-wrapper mobile-only">
            <button className={`action-btn${showStudyPulse ? " study-pulse" : ""}`} onClick={handleStudyModeClick}>
              Study mode
            </button>
            {showStudyPulse && (
              <span className="study-tooltip" onClick={handleStudyModeClick}>
                Study, memorization, dictionary &amp; more
              </span>
            )}
          </div>
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
          <div className="study-btn-wrapper desktop-only">
            <button className={`action-btn${showStudyPulse ? " study-pulse" : ""}`} onClick={handleStudyModeClick}>
              Study mode
            </button>
            {showStudyPulse && (
              <span className="study-tooltip" onClick={handleStudyModeClick}>
                Study, memorization, dictionary &amp; more
              </span>
            )}
          </div>
        </div>
      </div>

      <section
        className={`content${isSurahPanelCollapsed ? " surah-panel-is-collapsed" : ""}${isStudyPanelCollapsed ? " study-panel-is-collapsed" : ""}`}
      >
        <SectionErrorBoundary title="Surah list unavailable">
          <SurahList
            onOpenPrayer={() => setIsPrayerPanelOpen(true)}
            onOpenSettings={() => {
              ui.setSettingsTab("display");
              ui.setShowMobileSettings(true);
            }}
            onOpenSearch={() => ui.setShowMobileSearch(true)}
            isCollapsed={isSurahPanelCollapsed}
            onToggleCollapsed={() => setIsSurahPanelCollapsed((collapsed) => !collapsed)}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary title="Reader unavailable">
          <ReaderPanel />
        </SectionErrorBoundary>

        <SectionErrorBoundary title="Study panel unavailable">
          <StudyPanel
            continueSession={continueSession}
            onContinueSession={handleContinueSession}
            isCollapsed={isStudyPanelCollapsed}
            onToggleCollapsed={() => setIsStudyPanelCollapsed((collapsed) => !collapsed)}
          />
        </SectionErrorBoundary>
      </section>

      {ui.selectedAyah ? <CompareModal /> : null}

      <NoteModal />

      {isPrayerPanelOpen ? (
        <PrayerPanel
          isOpen={isPrayerPanelOpen}
          onClose={() => setIsPrayerPanelOpen(false)}
        />
      ) : null}

      {ui.showShortcuts ? (
        <KeyboardShortcutsHelp isOpen={ui.showShortcuts} onClose={() => ui.setShowShortcuts(false)} />
      ) : null}

    </main>
  );
}

export default function Home() {
  return (
    <HomeProviders>
      <HomeContent />
    </HomeProviders>
  );
}
