"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Ayah, Surah, SurahData, WordBySurah } from "../lib/types";

type QuranDataContextValue = {
  surahs: Surah[];
  loadingSurahs: boolean;
  surahsError: string | null;
  surahByNumber: Map<number, Surah>;
  selectedSurah: Surah | null;
  surahData: SurahData | null;
  loadingSurahData: boolean;
  surahDataError: string | null;
  filteredSurahs: Surah[];
  filteredAyahs: Ayah[];
  wordByAyah: WordBySurah;
  wordLoading: boolean;
  wordError: string | null;
};

const QuranDataContext = createContext<QuranDataContextValue | null>(null);

type QuranDataProviderProps = QuranDataContextValue & { children: ReactNode };

export function QuranDataProvider({ children, ...value }: QuranDataProviderProps) {
  return (
    <QuranDataContext.Provider value={value}>
      {children}
    </QuranDataContext.Provider>
  );
}

export function useQuranData(): QuranDataContextValue {
  const ctx = useContext(QuranDataContext);
  if (!ctx) {
    throw new Error("useQuranData must be used within a <QuranDataProvider>");
  }
  return ctx;
}

export type { QuranDataContextValue };
