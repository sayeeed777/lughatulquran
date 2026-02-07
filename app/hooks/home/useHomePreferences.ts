"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AUDIO_RECITERS, ARABIC_FONTS, STORAGE_KEYS } from "../../lib/constants";
import { useLocalStorage } from "../common";
import { useReadingPlan, useFontScale } from "../useAppSettings";
import type { ArabicFont, Reciter } from "./types";

export function useHomePreferences() {
  const [readingPlan, setReadingPlan] = useReadingPlan();
  const [fontScale, setFontScale] = useFontScale();

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
  const [arabicFontId, setArabicFontId] = useLocalStorage(
    STORAGE_KEYS.arabicFont,
    defaultArabicFont.id
  ) as [string, (value: string | ((prev: string) => string)) => void, boolean];
  const selectedArabicFont = useMemo<ArabicFont>(
    () => ARABIC_FONTS.find((font) => font.id === arabicFontId) ?? defaultArabicFont,
    [arabicFontId, defaultArabicFont]
  );

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
