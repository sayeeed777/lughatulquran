"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Ayah, Surah } from "../lib/types";
import type { PlanSummary } from "../hooks/home/useHomePlan";

type VerseRef = { surah: number; ayah: number } | null;

type ActionsContextValue = {
  handleSelectSurah: (surah: Surah) => void;
  handleGoToAyah: () => void;
  jumpToAyah: (surah: number, ayah: number) => void;
  copyAyahLink: (surah: number, ayah: number) => Promise<void>;
  handleCompare: (ayah: Ayah) => void;
  retryData: () => void;
  planSummary: PlanSummary;
  formatRangeLabel: (start: VerseRef, end: VerseRef) => string;
};

const ActionsContext = createContext<ActionsContextValue | null>(null);

type ActionsProviderProps = ActionsContextValue & { children: ReactNode };

export function ActionsProvider({ children, ...value }: ActionsProviderProps) {
  return (
    <ActionsContext.Provider value={value}>
      {children}
    </ActionsContext.Provider>
  );
}

export function useActions(): ActionsContextValue {
  const ctx = useContext(ActionsContext);
  if (!ctx) {
    throw new Error("useActions must be used within an <ActionsProvider>");
  }
  return ctx;
}

export type { ActionsContextValue };
