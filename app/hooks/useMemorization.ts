"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { clamp, verseKey } from "../lib/utils";
import type { Surah, MemorizeConfig, NowPlaying } from "../lib/types";

type SurahSummary = Pick<Surah, "number" | "numberOfAyahs">;

type StartMemorizeConfig = {
  startAyah?: number;
  endAyah?: number;
  loops?: number;
};

type UseMemorizationOptions = {
  selectedSurah: SurahSummary | null;
  setMemorizeConfig: Dispatch<SetStateAction<MemorizeConfig>>;
  setNowPlaying?: Dispatch<SetStateAction<NowPlaying | null>>;
  setIsAutoPlaying?: Dispatch<SetStateAction<boolean>>;
  setIsAudioPaused?: Dispatch<SetStateAction<boolean>>;
  setFocusedAyahKey?: Dispatch<SetStateAction<string | null>>;
  setPendingScroll?: Dispatch<SetStateAction<number | null>>;
};

/**
 * Hook for managing memorization state and controls
 * Extracted from page.js to improve code organization
 */
export function useMemorization({
  selectedSurah,
  setMemorizeConfig,
  setNowPlaying,
  setIsAutoPlaying,
  setIsAudioPaused,
  setFocusedAyahKey,
  setPendingScroll
}: UseMemorizationOptions) {
  // Clamp memorize range when surah changes
  useEffect(() => {
    if (!selectedSurah) return;
    setMemorizeConfig((prev) => {
      const max = selectedSurah.numberOfAyahs;
      const startAyah = clamp(Number(prev.startAyah) || 1, 1, max);
      const endAyah = clamp(Number(prev.endAyah) || startAyah, startAyah, max);
      if (startAyah === prev.startAyah && endAyah === prev.endAyah) return prev;
      return { ...prev, startAyah, endAyah };
    });
  }, [selectedSurah, setMemorizeConfig]);

  const stopMemorize = useCallback(() => {
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
  }, [setMemorizeConfig]);

  const startMemorize = useCallback(
    (config: StartMemorizeConfig) => {
      if (!selectedSurah) return;
      const start = clamp(
        Number(config?.startAyah) || 1,
        1,
        selectedSurah.numberOfAyahs
      );
      const end = clamp(
        Number(config?.endAyah) || start,
        start,
        selectedSurah.numberOfAyahs
      );
      const loops = Math.max(0, Number(config?.loops) || 0);

      setMemorizeConfig({
        active: true,
        startAyah: start,
        endAyah: end,
        loops,
        remaining: loops
      });

      setIsAutoPlaying?.(true);
      setIsAudioPaused?.(false);
      setNowPlaying?.({ surah: selectedSurah.number, ayah: start });
      setFocusedAyahKey?.(verseKey(selectedSurah.number, start));
      setPendingScroll?.(start);
    },
    [
      selectedSurah,
      setMemorizeConfig,
      setIsAutoPlaying,
      setIsAudioPaused,
      setNowPlaying,
      setFocusedAyahKey,
      setPendingScroll
    ]
  );

  return {
    startMemorize,
    stopMemorize
  };
}
