"use client";

import { parseVerseKey, verseKey } from "../../lib/utils";
import { useKeyboardShortcuts } from "../common";
import type { Ayah, Surah, SurahData } from "./types";

type UseHomeShortcutsParams = {
  showShortcuts: boolean;
  setShowShortcuts: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedAyah: Ayah | null;
  setSelectedAyah: (value: Ayah | null) => void;
  noteTarget: { surah: number; ayah: number; key: string } | null;
  closeNote: () => void;
  readingMode: boolean;
  setReadingMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShowWordByWord: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedSurah: Surah | null;
  surahData: SurahData | null;
  focusedAyahKey: string | null;
  setPendingScroll: (value: number | null) => void;
  setFocusedAyahKey: (value: string | null) => void;
  toggleBookmark: (surah: number, ayah: number) => void;
  setNowPlaying: (value: { surah: number; ayah: number } | null) => void;
};

export function useHomeShortcuts({
  showShortcuts,
  setShowShortcuts,
  selectedAyah,
  setSelectedAyah,
  noteTarget,
  closeNote,
  readingMode,
  setReadingMode,
  setShowWordByWord,
  selectedSurah,
  surahData,
  focusedAyahKey,
  setPendingScroll,
  setFocusedAyahKey,
  toggleBookmark,
  setNowPlaying
}: UseHomeShortcutsParams) {
  useKeyboardShortcuts({
    "Show Shortcuts": { keys: ["?"], handler: () => setShowShortcuts((p) => !p) },
    "Close Modal": {
      keys: ["Escape"],
      handler: () => {
        if (showShortcuts) setShowShortcuts(false);
        else if (selectedAyah) setSelectedAyah(null);
        else if (noteTarget) closeNote();
        else if (readingMode) setReadingMode(false);
      }
    },
    "Study Mode": { keys: ["f"], handler: () => setReadingMode((p) => !p) },
    "Word by Word": { keys: ["w"], handler: () => setShowWordByWord((p) => !p) },
    "Next Ayah": {
      keys: ["ArrowDown", "j"],
      handler: () => {
        if (!selectedSurah || !surahData) return;
        const current = focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : 1;
        const next = Math.min(current + 1, selectedSurah.numberOfAyahs);
        setPendingScroll(next);
        setFocusedAyahKey(verseKey(selectedSurah.number, next));
      }
    },
    "Prev Ayah": {
      keys: ["ArrowUp", "k"],
      handler: () => {
        if (!selectedSurah || !surahData) return;
        const current = focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : 1;
        const prev = Math.max(current - 1, 1);
        setPendingScroll(prev);
        setFocusedAyahKey(verseKey(selectedSurah.number, prev));
      }
    },
    "Toggle Bookmark": {
      keys: ["b"],
      handler: () => {
        if (focusedAyahKey) {
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          toggleBookmark(surah, ayah);
        }
      }
    },
    "Play Audio": {
      keys: ["p"],
      handler: () => {
        if (focusedAyahKey) {
          const { surah, ayah } = parseVerseKey(focusedAyahKey);
          setNowPlaying({ surah, ayah });
        }
      }
    }
  });
}
