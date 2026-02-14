"use client";

import type { ReactNode } from "react";
import { useHomeController } from "../hooks/useHomeController";
import { getAudioUrl } from "../lib/utils";
import {
  ThemeProvider,
  AudioProvider,
  BookmarkProvider,
  QuranDataProvider,
  UIStateProvider,
  PreferencesProvider,
  ActionsProvider
} from "../contexts";
import ErrorBoundary from "./ErrorBoundary";

type HomeProvidersProps = {
  children: ReactNode;
};

export default function HomeProviders({ children }: HomeProvidersProps) {
  const { data, audio, bookmarks, preferences, ui, actions } = useHomeController();

  const audioSrc = audio.nowPlaying
    ? getAudioUrl(audio.selectedReciter.baseUrl, audio.nowPlaying.surah, audio.nowPlaying.ayah)
    : null;

  return (
    <ErrorBoundary>
      <ThemeProvider theme={preferences.theme} isLightTheme={preferences.isLightTheme} setTheme={preferences.setTheme}>
        <QuranDataProvider {...data}>
          <PreferencesProvider {...preferences}>
            <UIStateProvider {...ui}>
              <ActionsProvider {...actions}>
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
                    reciterLabel={audio.selectedReciter.label}
                    nowPlayingLabel={audio.nowPlayingLabel}
                    reciterId={audio.reciterId}
                    setReciterId={audio.setReciterId}
                    selectedReciter={audio.selectedReciter}
                    playbackRate={audio.playbackRate}
                    setPlaybackRate={audio.setPlaybackRate}
                    handlePlaySurah={audio.handlePlaySurah}
                    handleStopAutoPlay={audio.handleStopAutoPlay}
                    handleAudioEnded={audio.handleAudioEnded}
                    handlePlayAyah={audio.handlePlayAyah}
                    handleToggleAyah={audio.handleToggleAyah}
                  >
                    {children}
                  </AudioProvider>
                </BookmarkProvider>
              </ActionsProvider>
            </UIStateProvider>
          </PreferencesProvider>
        </QuranDataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
