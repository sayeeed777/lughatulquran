"use client";

import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { verseKey } from "../lib/utils";

type Surah = {
  number: number;
  numberOfAyahs: number;
};

type MemorizeConfig = {
  active: boolean;
  startAyah: number;
  endAyah: number;
  loops: number;
  remaining: number;
};

type NowPlaying = {
  surah: number;
  ayah: number;
};

type UseAudioPlaybackOptions = {
  selectedSurah: Surah | null;
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

  const stopMemorize = useCallback(() => {
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
  }, [setMemorizeConfig]);

  const handlePlaySurah = useCallback(
    (startFromAyah = 1) => {
      if (!selectedSurah) return;
      stopMemorize();
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
        setFocusedAyahKey(verseKey(selectedSurah.number, nextAyah));
        setPendingScroll(nextAyah);
        return;
      }

      // Reached end of memorize range
      if (memorizeConfig.loops === 0) {
        // Infinite loop
        setNowPlaying({ surah: selectedSurah.number, ayah: memorizeConfig.startAyah });
        setFocusedAyahKey(verseKey(selectedSurah.number, memorizeConfig.startAyah));
        setPendingScroll(memorizeConfig.startAyah);
        return;
      }

      if (memorizeConfig.remaining > 1) {
        setMemorizeConfig((prev) => ({ ...prev, remaining: prev.remaining - 1 }));
        setNowPlaying({ surah: selectedSurah.number, ayah: memorizeConfig.startAyah });
        setFocusedAyahKey(verseKey(selectedSurah.number, memorizeConfig.startAyah));
        setPendingScroll(memorizeConfig.startAyah);
        return;
      }

      // Done looping
      setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
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
      setFocusedAyahKey(verseKey(selectedSurah.number, nextAyah));
      setPendingScroll(nextAyah);
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
    isAutoPlaying,
    setMemorizeConfig,
    setFocusedAyahKey,
    setPendingScroll
  ]);

  const handlePlayAyah = useCallback(
    (surah: number, ayah: number) => {
      stopMemorize();
      setIsAutoPlaying(false);
      setIsAudioPaused(false);
      setNowPlaying({ surah, ayah });
    },
    [stopMemorize]
  );

  const handleToggleAyah = useCallback(
    (surah: number, ayah: number) => {
      if (memorizeConfig.active) {
        stopMemorize();
      }
      // If same ayah is playing, toggle pause
      if (nowPlaying && nowPlaying.surah === surah && nowPlaying.ayah === ayah) {
        if (!isAudioPaused) {
          setIsAudioPaused(true);
          setIsAutoPlaying(false);
        } else {
          setIsAudioPaused(false);
        }
        return;
      }
      // Play new ayah
      setIsAutoPlaying(false);
      setIsAudioPaused(false);
      setNowPlaying({ surah, ayah });
    },
    [memorizeConfig.active, nowPlaying, isAudioPaused, stopMemorize]
  );

  return {
    // State
    nowPlaying,
    isAutoPlaying,
    isAudioPaused,
    // Actions
    handlePlaySurah,
    handleStopAutoPlay,
    handleAudioEnded,
    handlePlayAyah,
    handleToggleAyah,
    setNowPlaying,
    setIsAutoPlaying,
    setIsAudioPaused
  };
}
