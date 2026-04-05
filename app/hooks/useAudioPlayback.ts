"use client";

import { useState, useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { verseKey } from "../lib/utils";
import type { Surah, MemorizeConfig, NowPlaying } from "../lib/types";

type SurahSummary = Pick<Surah, "number" | "numberOfAyahs">;

type UseAudioPlaybackOptions = {
  selectedSurah: SurahSummary | null;
  memorizeConfig: MemorizeConfig;
  setMemorizeConfig: Dispatch<SetStateAction<MemorizeConfig>>;
  setFocusedAyahKey: Dispatch<SetStateAction<string | null>>;
  setPendingScroll: Dispatch<SetStateAction<number | null>>;
};

/**
 * Hook for managing audio playback state and controls
 * Extracted from page.js to improve code organization
 */
export function useAudioPlayback({
  selectedSurah,
  memorizeConfig,
  setMemorizeConfig,
  setFocusedAyahKey,
  setPendingScroll
}: UseAudioPlaybackOptions) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [activeWordPosition, setActiveWordPosition] = useState<number | null>(null);
  const [singleAyahStopAt, setSingleAyahStopAt] = useState<NowPlaying | null>(null);

  useEffect(() => {
    if (!nowPlaying || !isAutoPlaying) {
      setActiveWordPosition(null);
    }
  }, [nowPlaying?.surah, nowPlaying?.ayah, isAutoPlaying]);

  const stopMemorize = useCallback(() => {
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
  }, [setMemorizeConfig]);

  const handlePlaySurah = useCallback(
    (startFromAyah = 1) => {
      if (!selectedSurah) return;
      stopMemorize();
      setSingleAyahStopAt(null);
      const start =
        Number.isFinite(Number(startFromAyah)) && Number(startFromAyah) >= 1
          ? Number(startFromAyah)
          : 1;
      setIsAutoPlaying(true);
      setNowPlaying({ surah: selectedSurah.number, ayah: start });
      setIsAudioPaused(false);
      setFocusedAyahKey(verseKey(selectedSurah.number, start));
      setPendingScroll(start);
    },
    [selectedSurah, stopMemorize, setFocusedAyahKey, setPendingScroll]
  );

  const handleStopAutoPlay = useCallback(() => {
    stopMemorize();
    setSingleAyahStopAt(null);
    setIsAutoPlaying(false);
    setNowPlaying(null);
    setIsAudioPaused(false);
  }, [stopMemorize]);

  const handleAudioEnded = useCallback(() => {
    // Handle memorization mode
    if (memorizeConfig.active && selectedSurah && nowPlaying) {
      const nextAyah = nowPlaying.ayah + 1;
      if (nextAyah <= memorizeConfig.endAyah) {
        setNowPlaying({ surah: selectedSurah.number, ayah: nextAyah });
        if (typeof document === "undefined" || document.visibilityState === "visible") {
          setFocusedAyahKey(verseKey(selectedSurah.number, nextAyah));
          setPendingScroll(nextAyah);
        }
        return;
      }

      // Reached end of memorize range
      if (memorizeConfig.loops === 0) {
        // Infinite loop
        setNowPlaying({ surah: selectedSurah.number, ayah: memorizeConfig.startAyah });
        if (typeof document === "undefined" || document.visibilityState === "visible") {
          setFocusedAyahKey(verseKey(selectedSurah.number, memorizeConfig.startAyah));
          setPendingScroll(memorizeConfig.startAyah);
        }
        return;
      }

      if (memorizeConfig.remaining > 1) {
        setMemorizeConfig((prev) => ({ ...prev, remaining: prev.remaining - 1 }));
        setNowPlaying({ surah: selectedSurah.number, ayah: memorizeConfig.startAyah });
        if (typeof document === "undefined" || document.visibilityState === "visible") {
          setFocusedAyahKey(verseKey(selectedSurah.number, memorizeConfig.startAyah));
          setPendingScroll(memorizeConfig.startAyah);
        }
        return;
      }

      // Done looping
      setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
      setIsAutoPlaying(false);
      setNowPlaying(null);
      setIsAudioPaused(false);
      return;
    }

    if (
      singleAyahStopAt
      && nowPlaying
      && singleAyahStopAt.surah === nowPlaying.surah
      && singleAyahStopAt.ayah === nowPlaying.ayah
    ) {
      setSingleAyahStopAt(null);
      setIsAutoPlaying(false);
      setNowPlaying(null);
      setIsAudioPaused(false);
      return;
    }

    // Handle regular auto-play
    if (!isAutoPlaying || !nowPlaying || !selectedSurah) {
      setIsAudioPaused(false);
      setNowPlaying(null);
      return;
    }

    const nextAyah = nowPlaying.ayah + 1;
    if (nextAyah <= selectedSurah.numberOfAyahs) {
      setNowPlaying({ surah: selectedSurah.number, ayah: nextAyah });
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        setFocusedAyahKey(verseKey(selectedSurah.number, nextAyah));
        setPendingScroll(nextAyah);
      }
    } else {
      // Surah finished
      setIsAutoPlaying(false);
      setNowPlaying(null);
      setIsAudioPaused(false);
    }
  }, [
    memorizeConfig,
    selectedSurah,
    nowPlaying,
    singleAyahStopAt,
    isAutoPlaying,
    setMemorizeConfig,
    setFocusedAyahKey,
    setPendingScroll
  ]);

  const handlePlayAyah = useCallback(
    (surah: number, ayah: number) => {
      stopMemorize();
      setSingleAyahStopAt({ surah, ayah });
      setIsAutoPlaying(true);
      setIsAudioPaused(false);
      setNowPlaying({ surah, ayah });
      setFocusedAyahKey(verseKey(surah, ayah));
      setPendingScroll(ayah);
    },
    [stopMemorize, setFocusedAyahKey, setPendingScroll]
  );

  const handleToggleAyah = useCallback(
    (surah: number, ayah: number) => {
      if (memorizeConfig.active) {
        stopMemorize();
      }
      setSingleAyahStopAt(null);
      // If same ayah is playing, stop playback
      if (nowPlaying && nowPlaying.surah === surah && nowPlaying.ayah === ayah) {
        setIsAutoPlaying(false);
        setNowPlaying(null);
        setIsAudioPaused(false);
        return;
      }
      // Play new ayah with continuous auto-play from this point
      setIsAutoPlaying(true);
      setIsAudioPaused(false);
      setNowPlaying({ surah, ayah });
      setFocusedAyahKey(verseKey(surah, ayah));
      setPendingScroll(ayah);
    },
    [memorizeConfig.active, nowPlaying, stopMemorize, setFocusedAyahKey, setPendingScroll]
  );

  return {
    // State
    nowPlaying,
    isAutoPlaying,
    isAudioPaused,
    activeWordPosition,
    // Actions
    handlePlaySurah,
    handleStopAutoPlay,
    handleAudioEnded,
    handlePlayAyah,
    handleToggleAyah,
    setNowPlaying,
    setIsAutoPlaying,
    setIsAudioPaused,
    setActiveWordPosition
  };
}
