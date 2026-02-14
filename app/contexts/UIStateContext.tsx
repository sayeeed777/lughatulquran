"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Ayah, SetState, SettingsTabId } from "../lib/types";

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
};

const UIStateContext = createContext<UIStateContextValue | null>(null);

type UIStateProviderProps = UIStateContextValue & { children: ReactNode };

export function UIStateProvider({ children, ...value }: UIStateProviderProps) {
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
