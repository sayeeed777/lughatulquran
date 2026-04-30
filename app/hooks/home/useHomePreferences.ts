"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUDIO_RECITERS,
  ARABIC_FONTS,
  DEFAULT_RECITER,
  PRAYER_MADHABS,
  PRAYER_METHODS,
  STORAGE_KEYS
} from "../../lib/constants";
import {
  getReciterBootstrapMode,
  LEGACY_DEFAULT_RECITER
} from "../../lib/reciterPreferences";
import {
  DEFAULT_THEME,
  isLightThemeName,
  normalizeThemeName,
} from "../../lib/themes";
import type { ThemeName } from "../../lib/themes";
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

  const legacyDefaultReciter = useMemo<Reciter>(() => LEGACY_DEFAULT_RECITER, []);
  const defaultReciter = useMemo<Reciter>(() => DEFAULT_RECITER ?? legacyDefaultReciter, [legacyDefaultReciter]);
  const reciterBootstrapModeRef = useRef<ReturnType<typeof getReciterBootstrapMode> | null>(null);
  if (typeof window !== "undefined" && reciterBootstrapModeRef.current === null) {
    reciterBootstrapModeRef.current = getReciterBootstrapMode(window.localStorage);
  }
  const [reciterId, setReciterId, isReciterLoaded] = useLocalStorage(
    STORAGE_KEYS.reciter,
    legacyDefaultReciter.id
  );
  const [isReciterReady, setIsReciterReady] = useState(false);
  const selectedReciter = useMemo<Reciter>(
    () => AUDIO_RECITERS.find((r) => r.id === reciterId) ?? defaultReciter,
    [reciterId, defaultReciter]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !isReciterLoaded) return;

    const storedReciter = window.localStorage.getItem(STORAGE_KEYS.reciter);
    if (storedReciter !== null) {
      setIsReciterReady(true);
      return;
    }

    const bootstrapMode = reciterBootstrapModeRef.current ?? "new-user";
    const targetReciterId = bootstrapMode === "new-user"
      ? defaultReciter.id
      : legacyDefaultReciter.id;

    if (reciterId !== targetReciterId) {
      setReciterId(targetReciterId);
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.reciter, JSON.stringify(targetReciterId));
    setIsReciterReady(true);
  }, [
    defaultReciter.id,
    isReciterLoaded,
    legacyDefaultReciter.id,
    reciterId,
    setReciterId
  ]);

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

  const [showTransliteration, setShowTransliteration] = useLocalStorage(
    STORAGE_KEYS.showTransliteration,
    false
  );
  const [showStudyTransliteration, setShowStudyTransliteration] = useLocalStorage(
    STORAGE_KEYS.showStudyTransliteration,
    false
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

  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      if (storedTheme) {
        const parsed = JSON.parse(storedTheme);
        const normalizedTheme = normalizeThemeName(parsed);
        if (normalizedTheme) {
          if (normalizedTheme !== parsed) {
            localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(normalizedTheme));
          }
          return normalizedTheme;
        }
      }
      const isMobileView = window.matchMedia?.(mobileViewportQuery)?.matches;
      if (isMobileView) {
        return DEFAULT_THEME;
      }
      return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });
  const isLightTheme = isLightThemeName(theme);

  const setThemeValue = useCallback((t: ThemeName) => {
    // Enable smooth transition, then switch theme
    document.body.classList.add("theme-transitioning");
    document.documentElement.dataset.theme = t;
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(t));
    setThemeState(t);
    setTimeout(() => document.body.classList.remove("theme-transitioning"), 400);
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
    isReciterReady,
    selectedReciter,
    arabicFontId,
    setArabicFontId,
    selectedArabicFont,
    showTransliteration,
    setShowTransliteration,
    showStudyTransliteration,
    setShowStudyTransliteration,
    prayerSettings,
    setPrayerSettings: setStoredPrayerSettings,
    theme,
    isLightTheme,
    setTheme: setThemeValue
  };
}
