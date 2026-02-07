"use client";

import { useEffect } from "react";
import { parseVerseKey, verseKey } from "../../lib/utils";
import type { MemorizeConfig, NowPlaying, Surah, SurahData } from "./types";

type UseHomeEffectsParams = {
  surahs: Surah[];
  selectedSurah: Surah | null;
  setSelectedSurah: (surah: Surah | null) => void;
  focusedAyahKey: string | null;
  setFocusedAyahKey: (value: string | null) => void;
  pendingScroll: number | null;
  setPendingScroll: (value: number | null) => void;
  surahData: SurahData | null;
  updateLastRead: (surah: number, ayah: number, surahName: string) => void;
  readingMode: boolean;
  memorizeConfig: MemorizeConfig;
  setMemorizeConfig: (value: MemorizeConfig | ((prev: MemorizeConfig) => MemorizeConfig)) => void;
  setIsAutoPlaying: (value: boolean) => void;
  setIsAudioPaused: (value: boolean) => void;
  nowPlaying: NowPlaying;
  isAutoPlaying: boolean;
};

export function useHomeEffects({
  surahs,
  selectedSurah,
  setSelectedSurah,
  focusedAyahKey,
  setFocusedAyahKey,
  pendingScroll,
  setPendingScroll,
  surahData,
  updateLastRead,
  readingMode,
  memorizeConfig,
  setMemorizeConfig,
  setIsAutoPlaying,
  setIsAudioPaused,
  nowPlaying,
  isAutoPlaying
}: UseHomeEffectsParams) {
  // Initial Surah Selection & URL handling
  useEffect(() => {
    if (!surahs.length || selectedSurah) return;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const surahParam = Number(params.get("surah"));
      const ayahParam = Number(params.get("ayah"));
      const hashMatch = window.location.hash.match(/ayah-(\d+)/);
      const hashAyah = hashMatch ? Number(hashMatch[1]) : null;

      const targetSurah = surahs.find((surah) => surah.number === surahParam);
      if (targetSurah) {
        setSelectedSurah(targetSurah);
        const targetAyah = ayahParam || hashAyah;
        if (targetAyah) {
          setPendingScroll(targetAyah);
          setFocusedAyahKey(verseKey(targetSurah.number, targetAyah));
        }
        return;
      }
    }
    setSelectedSurah(surahs[0] || null);
  }, [surahs, selectedSurah, setSelectedSurah, setPendingScroll, setFocusedAyahKey]);

  // Sync URL with selection
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSurah) return;
    const url = new URL(window.location.href);
    url.searchParams.set("surah", String(selectedSurah.number));
    if (focusedAyahKey) {
      const { ayah } = parseVerseKey(focusedAyahKey);
      url.searchParams.set("ayah", String(ayah));
    } else {
      url.searchParams.delete("ayah");
    }
    window.history.replaceState({}, "", url);
  }, [selectedSurah, focusedAyahKey]);

  // Update Last Read
  useEffect(() => {
    if (!selectedSurah || !focusedAyahKey) return;
    const { surah, ayah } = parseVerseKey(focusedAyahKey);
    updateLastRead(surah, ayah, selectedSurah.englishName);
  }, [focusedAyahKey, selectedSurah, updateLastRead]);

  // Stop memorize when exiting study mode
  useEffect(() => {
    if (readingMode) return;
    if (!memorizeConfig.active) return;
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
  }, [readingMode, memorizeConfig.active, setMemorizeConfig, setIsAutoPlaying, setIsAudioPaused]);

  // Pending Scroll Logic
  useEffect(() => {
    if (!pendingScroll || !surahData?.surah || !selectedSurah) return;
    if (surahData.surah.number !== selectedSurah.number) return;

    const timer = setTimeout(() => {
      const target = document.getElementById(`ayah-${pendingScroll}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setFocusedAyahKey(verseKey(selectedSurah.number, pendingScroll));
      }
    }, 100);
    setPendingScroll(null);
    return () => clearTimeout(timer);
  }, [pendingScroll, surahData, selectedSurah, setFocusedAyahKey, setPendingScroll]);

  // Auto-scroll to currently playing ayah during auto-play
  useEffect(() => {
    if (!isAutoPlaying || !nowPlaying || !selectedSurah) return;
    if (nowPlaying.surah !== selectedSurah.number) return;

    const timer = setTimeout(() => {
      const target = document.getElementById(`ayah-${nowPlaying.ayah}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nowPlaying, isAutoPlaying, selectedSurah]);
}
