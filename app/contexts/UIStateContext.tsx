"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Ayah, SetState, SettingsTabId, ReaderScopeMode } from "../lib/types";

type UIStateContextValue = {
  query: string;
  setQuery: SetState<string>;
  ayahQuery: string;
  setAyahQuery: SetState<string>;
  goToAyahInput: string;
  setGoToAyahInput: SetState<string>;
  readingMode: boolean;
  setReadingMode: SetState<boolean>;
  showShortcuts: boolean;
  setShowShortcuts: SetState<boolean>;
  showMobileSettings: boolean;
  setShowMobileSettings: SetState<boolean>;
  showMobileSearch: boolean;
  setShowMobileSearch: SetState<boolean>;
  settingsTab: SettingsTabId;
  setSettingsTab: SetState<SettingsTabId>;
  selectedAyah: Ayah | null;
  setSelectedAyah: SetState<Ayah | null>;
  focusedAyahKey: string | null;
  setFocusedAyahKey: SetState<string | null>;
  copiedKey: string | null;
  readerScopeMode: ReaderScopeMode;
  setReaderScopeMode: SetState<ReaderScopeMode>;
  readerJuzNumber: number;
  setReaderJuzNumber: SetState<number>;
  readerPageNumber: number;
  setReaderPageNumber: SetState<number>;
};

const UIStateContext = createContext<UIStateContextValue | null>(null);

type UIStateProviderProps = UIStateContextValue & { children: ReactNode };

export function UIStateProvider({ children, ...props }: UIStateProviderProps) {
  const value = useMemo(() => ({
    query: props.query,
    setQuery: props.setQuery,
    ayahQuery: props.ayahQuery,
    setAyahQuery: props.setAyahQuery,
    goToAyahInput: props.goToAyahInput,
    setGoToAyahInput: props.setGoToAyahInput,
    readingMode: props.readingMode,
    setReadingMode: props.setReadingMode,
    showShortcuts: props.showShortcuts,
    setShowShortcuts: props.setShowShortcuts,
    showMobileSettings: props.showMobileSettings,
    setShowMobileSettings: props.setShowMobileSettings,
    showMobileSearch: props.showMobileSearch,
    setShowMobileSearch: props.setShowMobileSearch,
    settingsTab: props.settingsTab,
    setSettingsTab: props.setSettingsTab,
    selectedAyah: props.selectedAyah,
    setSelectedAyah: props.setSelectedAyah,
    focusedAyahKey: props.focusedAyahKey,
    setFocusedAyahKey: props.setFocusedAyahKey,
    copiedKey: props.copiedKey,
    readerScopeMode: props.readerScopeMode,
    setReaderScopeMode: props.setReaderScopeMode,
    readerJuzNumber: props.readerJuzNumber,
    setReaderJuzNumber: props.setReaderJuzNumber,
    readerPageNumber: props.readerPageNumber,
    setReaderPageNumber: props.setReaderPageNumber,
  }), [
    props.query, props.setQuery, props.ayahQuery, props.setAyahQuery,
    props.goToAyahInput, props.setGoToAyahInput, props.readingMode,
    props.setReadingMode, props.showShortcuts, props.setShowShortcuts,
    props.showMobileSettings, props.setShowMobileSettings,
    props.showMobileSearch, props.setShowMobileSearch,
    props.settingsTab, props.setSettingsTab, props.selectedAyah,
    props.setSelectedAyah, props.focusedAyahKey, props.setFocusedAyahKey,
    props.copiedKey, props.readerScopeMode, props.setReaderScopeMode,
    props.readerJuzNumber, props.setReaderJuzNumber,
    props.readerPageNumber, props.setReaderPageNumber,
  ]);
  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState(): UIStateContextValue {
  const ctx = useContext(UIStateContext);
  if (!ctx) {
    throw new Error("useUIState must be used within a <UIStateProvider>");
  }
  return ctx;
}

export type { UIStateContextValue };
