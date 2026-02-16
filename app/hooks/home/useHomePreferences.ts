"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AUDIO_RECITERS,
  ARABIC_FONTS,
  PRAYER_MADHABS,
  PRAYER_METHODS,
  STORAGE_KEYS
} from "../../lib/constants";
import { useLocalStorage } from "../common";
import { clamp } from "../../lib/utils";
import { useReadingPlan, useFontScale } from "../useAppSettings";
import type { ArabicFont, Reciter } from "./types";
import type { PrayerSettings, SetState } from "../../lib/types";

const asNumberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function useHomePreferences() {
  const mobileViewportQuery = "(max-width: 1100px)";
  const desktopDefaultArabicFontId = "scheherazade-new";
  const mobileDefaultArabicFontId = "scheherazade-new";
  const [readingPlan, setReadingPlan] = useReadingPlan();
  const [fontScale, setFontScale] = useFontScale();
  const [storedPlaybackRate, setStoredPlaybackRate] = useLocalStorage(
    STORAGE_KEYS.playbackRate,
    1
  );
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

  const defaultReciter = useMemo<Reciter>(
    () =>
      AUDIO_RECITERS[0] ?? {
        id: "default",
        label: "Default",
        baseUrl: ""
      },
    []
  );
  const [reciterId, setReciterId] = useLocalStorage(
    STORAGE_KEYS.reciter,
    defaultReciter.id
  );
  const selectedReciter = useMemo<Reciter>(
    () => AUDIO_RECITERS.find((r) => r.id === reciterId) ?? defaultReciter,
    [reciterId, defaultReciter]
  );

  const defaultTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const defaultPrayerMethod = PRAYER_METHODS[0]?.id || "MWL";
  const defaultPrayerMadhab = PRAYER_MADHABS[0]?.id || "SHAFI";
  const [storedPrayerSettings, setStoredPrayerSettings] = useLocalStorage(
    STORAGE_KEYS.prayerSettings,
    {
      countryCode: "",
      countryName: "",
      city: "",
      timezone: defaultTimezone,
      method: defaultPrayerMethod,
      madhab: defaultPrayerMadhab,
      latitude: null,
      longitude: null,
      geonameId: null
    } as PrayerSettings
  ) as [PrayerSettings, SetState<PrayerSettings>, boolean];

  const prayerSettings = useMemo<PrayerSettings>(
    () => ({
      countryCode: String(storedPrayerSettings?.countryCode || "").toUpperCase(),
      countryName: String(storedPrayerSettings?.countryName || ""),
      city: String(storedPrayerSettings?.city || ""),
      timezone: String(storedPrayerSettings?.timezone || defaultTimezone),
      method: String(storedPrayerSettings?.method || defaultPrayerMethod),
      madhab: String(storedPrayerSettings?.madhab || defaultPrayerMadhab),
      latitude: asNumberOrNull(storedPrayerSettings?.latitude),
      longitude: asNumberOrNull(storedPrayerSettings?.longitude),
      geonameId: asNumberOrNull(storedPrayerSettings?.geonameId)
    }),
    [defaultPrayerMadhab, defaultPrayerMethod, defaultTimezone, storedPrayerSettings]
  );

  const fallbackDefaultArabicFontId = useMemo(
    () =>
      ARABIC_FONTS.find((font) => font.id === desktopDefaultArabicFontId)?.id ??
      ARABIC_FONTS[0]?.id ??
      "default",
    [desktopDefaultArabicFontId]
  );
  const defaultArabicFont = useMemo<ArabicFont>(
    () =>
      ARABIC_FONTS.find((font) => font.id === fallbackDefaultArabicFontId) ??
      ARABIC_FONTS[0] ?? {
        id: "default",
        label: "Default",
        css: ""
      },
    [fallbackDefaultArabicFontId]
  );
  const [arabicFontId, setArabicFontId, isArabicFontLoaded] = useLocalStorage(
    STORAGE_KEYS.arabicFont,
    fallbackDefaultArabicFontId
  );
  const selectedArabicFont = useMemo<ArabicFont>(
    () => ARABIC_FONTS.find((font) => font.id === arabicFontId) ?? defaultArabicFont,
    [arabicFontId, defaultArabicFont]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !isArabicFontLoaded) return;
    const hasStoredFont = window.localStorage.getItem(STORAGE_KEYS.arabicFont);
    if (hasStoredFont) return;
    const isMobileView = window.matchMedia(mobileViewportQuery).matches;
    const targetDefaultFontId = isMobileView ? mobileDefaultArabicFontId : desktopDefaultArabicFontId;
    if (arabicFontId === targetDefaultFontId) return;
    const hasTargetFont = ARABIC_FONTS.some((font) => font.id === targetDefaultFontId);
    if (!hasTargetFont) return;
    setArabicFontId(targetDefaultFontId);
  }, [
    arabicFontId,
    desktopDefaultArabicFontId,
    isArabicFontLoaded,
    mobileViewportQuery,
    mobileDefaultArabicFontId,
    setArabicFontId
  ]);

  const [theme, setThemeState] = useState<"dark" | "light" | "bw" | "bw-dark">(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      if (storedTheme) {
        const parsed = JSON.parse(storedTheme);
        if (parsed === "dark" || parsed === "light" || parsed === "bw" || parsed === "bw-dark") {
          return parsed;
        }
      }
      const isMobileView = window.matchMedia?.(mobileViewportQuery)?.matches;
      if (isMobileView) {
        return "dark";
      }
      return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const isLightTheme = theme === "light" || theme === "bw";

  const setThemeValue = useCallback((t: "dark" | "light" | "bw" | "bw-dark") => {
    // Update DOM synchronously to prevent flash between old/new theme
    document.documentElement.dataset.theme = t;
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(t));
    setThemeState(t);
  }, []);

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
    prayerSettings,
    setPrayerSettings: setStoredPrayerSettings,
    theme,
    isLightTheme,
    setTheme: setThemeValue
  };
}
