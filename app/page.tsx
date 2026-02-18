"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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
import { FONT_SCALE } from "./lib/constants";
import { clamp } from "./lib/utils";
import { getArabicFontClass, getArabicScaleClass, getTranslationScaleClass } from "./lib/styleClasses";
import { useUIState, usePreferences, useAudio, useActions } from "./contexts";

const StudyModeView = dynamic(() => import("./components/study/StudyModeView"), { ssr: false });
const PrayerPanel = dynamic(() => import("./components/modals/PrayerPanel"), { ssr: false });
const CompareModal = dynamic(() => import("./components/modals/CompareModal"), { ssr: false });
const NoteModal = dynamic(() => import("./components/modals/NoteModal"), { ssr: false });
const KeyboardShortcutsHelp = dynamic(
  () => import("./components/modals/KeyboardShortcutsHelp"),
  { ssr: false }
);

function HomeContent() {
  const [isPrayerPanelOpen, setIsPrayerPanelOpen] = useState(false);

  const ui = useUIState();
  const preferences = usePreferences();
  const audio = useAudio();
  const actions = useActions();

  // Reading mode
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
            onOpenPrayer={() => setIsPrayerPanelOpen(true)}
            onOpenSettings={() => {
              ui.setSettingsTab("display");
              ui.setShowMobileSettings(true);
            }}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary title="Reader unavailable">
          <ReaderPanel />
        </SectionErrorBoundary>

        <SectionErrorBoundary title="Study panel unavailable">
          <StudyPanel
            continueSession={continueSession}
            onContinueSession={handleContinueSession}
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
