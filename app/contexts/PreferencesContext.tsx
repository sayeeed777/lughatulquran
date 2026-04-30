"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type {
  FontScale,
  LastRead,
  MemorizeConfig,
  NextPrayerPreview,
  PrayerSettings,
  ReadingPlan,
  SetState,
  StudySession
} from "../lib/types";
import type { ThemeName } from "../lib/themes";

type PreferencesContextValue = {
  readingPlan: ReadingPlan;
  setReadingPlan: SetState<ReadingPlan>;
  fontScale: FontScale;
  setFontScale: SetState<FontScale>;
  arabicFontId: string;
  setArabicFontId: SetState<string>;
  selectedTranslations: string[];
  setSelectedTranslations: SetState<string[]>;
  showWordByWord: boolean;
  setShowWordByWord: SetState<boolean>;
  showTransliteration: boolean;
  setShowTransliteration: SetState<boolean>;
  showStudyTransliteration: boolean;
  setShowStudyTransliteration: SetState<boolean>;
  prayerSettings: PrayerSettings;
  setPrayerSettings: SetState<PrayerSettings>;
  nextPrayerPreview: NextPrayerPreview | null;
  hasPrayerLocation: boolean;
  theme: ThemeName;
  isLightTheme: boolean;
  setTheme: (theme: ThemeName) => void;
  memorizeConfig: MemorizeConfig;
  setMemorizeConfig: SetState<MemorizeConfig>;
  startMemorize: (config: { startAyah?: number; endAyah?: number; loops?: number }) => void;
  stopMemorize: () => void;
  lastRead: LastRead;
  studySession: StudySession | null;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

type PreferencesProviderProps = PreferencesContextValue & { children: ReactNode };

export function PreferencesProvider({ children, ...props }: PreferencesProviderProps) {
  const value = useMemo(() => ({
    readingPlan: props.readingPlan,
    setReadingPlan: props.setReadingPlan,
    fontScale: props.fontScale,
    setFontScale: props.setFontScale,
    arabicFontId: props.arabicFontId,
    setArabicFontId: props.setArabicFontId,
    selectedTranslations: props.selectedTranslations,
    setSelectedTranslations: props.setSelectedTranslations,
    showWordByWord: props.showWordByWord,
    setShowWordByWord: props.setShowWordByWord,
    showTransliteration: props.showTransliteration,
    setShowTransliteration: props.setShowTransliteration,
    showStudyTransliteration: props.showStudyTransliteration,
    setShowStudyTransliteration: props.setShowStudyTransliteration,
    prayerSettings: props.prayerSettings,
    setPrayerSettings: props.setPrayerSettings,
    nextPrayerPreview: props.nextPrayerPreview,
    hasPrayerLocation: props.hasPrayerLocation,
    theme: props.theme,
    isLightTheme: props.isLightTheme,
    setTheme: props.setTheme,
    memorizeConfig: props.memorizeConfig,
    setMemorizeConfig: props.setMemorizeConfig,
    startMemorize: props.startMemorize,
    stopMemorize: props.stopMemorize,
    lastRead: props.lastRead,
    studySession: props.studySession
  }), [
    props.readingPlan, props.setReadingPlan, props.fontScale, props.setFontScale,
    props.arabicFontId, props.setArabicFontId, props.selectedTranslations,
    props.setSelectedTranslations, props.showWordByWord, props.setShowWordByWord,
    props.showTransliteration, props.setShowTransliteration,
    props.showStudyTransliteration, props.setShowStudyTransliteration,
    props.prayerSettings, props.setPrayerSettings, props.nextPrayerPreview,
    props.hasPrayerLocation, props.theme, props.isLightTheme, props.setTheme,
    props.memorizeConfig, props.setMemorizeConfig, props.startMemorize,
    props.stopMemorize, props.lastRead, props.studySession,
  ]);
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a <PreferencesProvider>");
  }
  return ctx;
}

export type { PreferencesContextValue };
