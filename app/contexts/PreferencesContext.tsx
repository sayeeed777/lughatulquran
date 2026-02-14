"use client";

import { createContext, useContext } from "react";
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
import type { ThemeName } from "./ThemeContext";

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

export function PreferencesProvider({ children, ...value }: PreferencesProviderProps) {
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
