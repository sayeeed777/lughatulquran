"use client";

import { useCallback, useEffect } from "react";
import { clamp, verseKey } from "../lib/utils";

/**
 * Hook for managing memorization state and controls
 * Extracted from page.js to improve code organization
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.selectedSurah - Currently selected surah
 * @param {Function} options.setMemorizeConfig - Update memorization config (required)
 * @param {Function} options.setNowPlaying - Set currently playing ayah
 * @param {Function} options.setIsAutoPlaying - Set auto-play state
 * @param {Function} options.setIsAudioPaused - Set audio paused state
 * @param {Function} options.setFocusedAyahKey - Set focused ayah
 * @param {Function} options.setPendingScroll - Trigger scroll
 */
export function useMemorization({
    selectedSurah,
    setMemorizeConfig,
    setNowPlaying,
    setIsAutoPlaying,
    setIsAudioPaused,
    setFocusedAyahKey,
    setPendingScroll
}) {
    // Clamp memorize range when surah changes
    useEffect(() => {
        if (!selectedSurah || !setMemorizeConfig) return;
        setMemorizeConfig((prev) => {
            const max = selectedSurah.numberOfAyahs;
            const startAyah = clamp(Number(prev.startAyah) || 1, 1, max);
            const endAyah = clamp(Number(prev.endAyah) || startAyah, startAyah, max);
            if (startAyah === prev.startAyah && endAyah === prev.endAyah) return prev;
            return { ...prev, startAyah, endAyah };
        });
    }, [selectedSurah, setMemorizeConfig]);

    const stopMemorize = useCallback(() => {
        if (!setMemorizeConfig) return;
        setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
    }, [setMemorizeConfig]);

    const startMemorize = useCallback((config) => {
        if (!selectedSurah || !setMemorizeConfig) return;
        const start = clamp(Number(config?.startAyah) || 1, 1, selectedSurah.numberOfAyahs);
        const end = clamp(Number(config?.endAyah) || start, start, selectedSurah.numberOfAyahs);
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
    }, [
        selectedSurah,
        setMemorizeConfig,
        setIsAutoPlaying,
        setIsAudioPaused,
        setNowPlaying,
        setFocusedAyahKey,
        setPendingScroll
    ]);

    return {
        startMemorize,
        stopMemorize
    };
}
