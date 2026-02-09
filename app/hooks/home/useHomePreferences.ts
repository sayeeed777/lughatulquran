"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AUDIO_RECITERS, ARABIC_FONTS, STORAGE_KEYS } from "../../lib/constants";
import { useLocalStorage } from "../common";
import { clamp } from "../../lib/utils";
import { useReadingPlan, useFontScale } from "../useAppSettings";
import type { ArabicFont, Reciter } from "./types";

export function useHomePreferences() {
  const mobileViewportQuery = "(max-width: 1100px)";
  const mobileDefaultArabicFontId = "uthman-naskh";
  const [readingPlan, setReadingPlan] = useReadingPlan();
  const [fontScale, setFontScale] = useFontScale();
  const [storedPlaybackRate, setStoredPlaybackRate] = useLocalStorage(
    STORAGE_KEYS.playbackRate,
    1
  ) as [number, (value: number | ((prev: number) => number)) => void, boolean];
  const playbackRate = clamp(Number(storedPlaybackRate) || 1, 0.75, 1.25);
  const setPlaybackRate = useCallback(
    (value: number | ((prev: number) => number)) => {
      setStoredPlaybackRate((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        return clamp(Number(next) || 1, 0.75, 1.25);
      });
    },
    [setStoredPlaybackRate]
  );

  const defaultReciter: Reciter = AUDIO_RECITERS[0] ?? {
    id: "default",
    label: "Default",
    baseUrl: ""
  };
  const [reciterId, setReciterId] = useLocalStorage(
    STORAGE_KEYS.reciter,
    defaultReciter.id
  ) as [string, (value: string | ((prev: string) => string)) => void, boolean];
  const selectedReciter = useMemo<Reciter>(
    () => AUDIO_RECITERS.find((r) => r.id === reciterId) ?? defaultReciter,
    [reciterId, defaultReciter]
  );

  const defaultArabicFont: ArabicFont = ARABIC_FONTS[0] ?? {
    id: "default",
    label: "Default",
    css: ""
  };
  const [arabicFontId, setArabicFontId, isArabicFontLoaded] = useLocalStorage(
    STORAGE_KEYS.arabicFont,
    defaultArabicFont.id
  ) as [string, (value: string | ((prev: string) => string)) => void, boolean];
  const selectedArabicFont = useMemo<ArabicFont>(
    () => ARABIC_FONTS.find((font) => font.id === arabicFontId) ?? defaultArabicFont,
    [arabicFontId, defaultArabicFont]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !isArabicFontLoaded) return;
    const hasStoredFont = window.localStorage.getItem(STORAGE_KEYS.arabicFont);
    if (hasStoredFont) return;
    const isMobileView = window.matchMedia(mobileViewportQuery).matches;
    if (!isMobileView || arabicFontId === mobileDefaultArabicFontId) return;
    const hasMobileDefaultFont = ARABIC_FONTS.some((font) => font.id === mobileDefaultArabicFontId);
    if (!hasMobileDefaultFont) return;
    setArabicFontId(mobileDefaultArabicFontId);
  }, [arabicFontId, isArabicFontLoaded, mobileViewportQuery, mobileDefaultArabicFontId, setArabicFontId]);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isLightTheme = theme === "light";

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      if (storedTheme) {
        setTheme(JSON.parse(storedTheme));
      } else {
        const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
        setTheme(prefersLight ? "light" : "dark");
      }
    } catch {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  return {
    readingPlan,
    setReadingPlan,
    fontScale,
    setFontScale,
    playbackRate,
    setPlaybackRate,
    reciterId,
    setReciterId,
    selectedReciter,
    arabicFontId,
    setArabicFontId,
    selectedArabicFont,
    theme,
    isLightTheme,
    toggleTheme
  };
}
