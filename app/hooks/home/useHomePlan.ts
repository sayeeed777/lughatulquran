"use client";

import { useEffect, useMemo } from "react";
import type { ReadingPlan, Surah } from "./types";
import { getLocalDateString, parseLocalDate } from "../../lib/utils";

type PlanSummaryRange = {
  dayIndex: number;
  startVerse: { surah: number; ayah: number } | null;
  endVerse: { surah: number; ayah: number } | null;
  todayStartIndex: number;
  todayEndIndex: number;
};

type PlanSummary =
  | null
  | { error: string }
  | { completed: true; dayIndex: number }
  | PlanSummaryRange;

export function useHomePlan(
  surahs: Surah[],
  surahByNumber: Map<number, Surah>,
  readingPlan: ReadingPlan,
  setReadingPlan: (value: ReadingPlan | ((prev: ReadingPlan) => ReadingPlan)) => void
) {
  useEffect(() => {
    if (!readingPlan.startSurah) return;
    const info = surahByNumber.get(Number(readingPlan.startSurah));
    if (!info) return;
    if (readingPlan.startAyah > info.numberOfAyahs) {
      setReadingPlan((prev) => ({ ...prev, startAyah: info.numberOfAyahs }));
    }
  }, [readingPlan.startSurah, readingPlan.startAyah, surahByNumber, setReadingPlan]);

  const surahIndex = useMemo(() => {
    let offset = 0;
    return surahs.map((surah) => {
      const start = offset + 1;
      const end = offset + surah.numberOfAyahs;
      offset = end;
      return { number: surah.number, start, end };
    });
  }, [surahs]);

  const lastSurahIndex = surahIndex[surahIndex.length - 1];
  const totalAyahs = lastSurahIndex ? lastSurahIndex.end : 0;

  const getGlobalIndex = (surahNumber: number, ayahNumber: number) => {
    const entry = surahIndex.find((item) => item.number === surahNumber);
    if (!entry) return null;
    return entry.start + ayahNumber - 1;
  };

  const indexToVerse = (globalIndex: number) => {
    const entry = surahIndex.find(
      (item) => globalIndex >= item.start && globalIndex <= item.end
    );
    if (!entry) return null;
    return { surah: entry.number, ayah: globalIndex - entry.start + 1 };
  };

  const planSummary: PlanSummary = useMemo(() => {
    if (!surahIndex.length) return null;
    const perDay = Math.max(1, Number(readingPlan.perDay));
    const startSurah = Number(readingPlan.startSurah);
    const startAyah = Math.max(1, Number(readingPlan.startAyah));

    const startIndex = getGlobalIndex(startSurah, startAyah);
    if (!startIndex) return { error: "Start position is not available." };

    let startDateValue = parseLocalDate(readingPlan.startDate || getLocalDateString());
    if (Number.isNaN(startDateValue.getTime())) {
      startDateValue = parseLocalDate(getLocalDateString());
    }

    const todayValue = parseLocalDate(getLocalDateString());
    const dayIndex = Math.max(
      0,
      Math.floor((todayValue.getTime() - startDateValue.getTime()) / 86400000)
    );

    const todayStartIndex = startIndex + dayIndex * perDay;
    if (todayStartIndex > totalAyahs) {
      return { completed: true, dayIndex };
    }

    const todayEndIndex = Math.min(todayStartIndex + perDay - 1, totalAyahs);
    const startVerse = indexToVerse(todayStartIndex);
    const endVerse = indexToVerse(todayEndIndex);

    return { dayIndex, startVerse, endVerse, todayStartIndex, todayEndIndex };
  }, [readingPlan, surahIndex, totalAyahs]);

  const formatVerseLabel = (verse: { surah: number; ayah: number } | null) => {
    if (!verse) return "";
    const surah = surahByNumber.get(verse.surah);
    return `${surah ? surah.englishName : `Surah ${verse.surah}`} Ayah ${verse.ayah}`;
  };

  const formatRangeLabel = (
    startVerse: { surah: number; ayah: number } | null,
    endVerse: { surah: number; ayah: number } | null
  ) => {
    if (!startVerse || !endVerse) return "";
    if (startVerse.surah === endVerse.surah) {
      const surah = surahByNumber.get(startVerse.surah);
      return `${surah ? surah.englishName : `Surah ${startVerse.surah}`} Ayah ${
        startVerse.ayah
      } to ${endVerse.ayah}`;
    }
    return `${formatVerseLabel(startVerse)} to ${formatVerseLabel(endVerse)}`;
  };

  return {
    planSummary,
    formatRangeLabel
  };
}

export type { PlanSummary, PlanSummaryRange };
