"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Ayah, Surah, SurahData, WordBySurah, ScopeAyah, ScopeMeta, MushafPageLayout } from "../lib/types";

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
  readerScopeAyahs: ScopeAyah[];
  readerScopeLoading: boolean;
  readerScopeError: string | null;
  readerScopeMeta: ScopeMeta | null;
  readerScopeLayout: MushafPageLayout | null;
};

const QuranDataContext = createContext<QuranDataContextValue | null>(null);

type QuranDataProviderProps = QuranDataContextValue & { children: ReactNode };

export function QuranDataProvider({ children, ...props }: QuranDataProviderProps) {
  const value = useMemo(() => ({
    surahs: props.surahs,
    loadingSurahs: props.loadingSurahs,
    surahsError: props.surahsError,
    surahByNumber: props.surahByNumber,
    selectedSurah: props.selectedSurah,
    surahData: props.surahData,
    loadingSurahData: props.loadingSurahData,
    surahDataError: props.surahDataError,
    filteredSurahs: props.filteredSurahs,
    filteredAyahs: props.filteredAyahs,
    wordByAyah: props.wordByAyah,
    wordLoading: props.wordLoading,
    wordError: props.wordError,
    readerScopeAyahs: props.readerScopeAyahs,
    readerScopeLoading: props.readerScopeLoading,
    readerScopeError: props.readerScopeError,
    readerScopeMeta: props.readerScopeMeta,
    readerScopeLayout: props.readerScopeLayout,
  }), [
    props.surahs, props.loadingSurahs, props.surahsError,
    props.surahByNumber, props.selectedSurah, props.surahData,
    props.loadingSurahData, props.surahDataError, props.filteredSurahs,
    props.filteredAyahs, props.wordByAyah, props.wordLoading,
    props.wordError, props.readerScopeAyahs, props.readerScopeLoading,
    props.readerScopeError, props.readerScopeMeta, props.readerScopeLayout,
  ]);
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
