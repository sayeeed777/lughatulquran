"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./common";
import { STORAGE_KEYS } from "../lib/constants";
import { getLocalDateString } from "../lib/utils";
import type { ReadingStats, DailyReading } from "../lib/types";

const DEFAULT_STATS: ReadingStats = {
  history: [],
  currentStreak: 0,
  longestStreak: 0,
  totalVersesRead: 0,
  surahProgress: {}
};

const MAX_HISTORY_DAYS = 90;

function calcStreak(history: DailyReading[]): { current: number; longest: number } {
  if (history.length === 0) return { current: 0, longest: 0 };

  const sorted = [...history]
    .filter((d) => d.versesRead > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) return { current: 0, longest: 0 };

  const today = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  for (const entry of sorted) {
    const entryDate = new Date(entry.date + "T12:00:00");
    if (!prevDate) {
      if (entry.date === today || entry.date === yesterdayStr) {
        streak = 1;
      } else {
        current = 0;
        streak = 1;
      }
    } else {
      const diff = Math.round((prevDate.getTime() - entryDate.getTime()) / 86400000);
      if (diff === 1) {
        streak++;
      } else {
        if (current === 0 && (sorted[0].date === today || sorted[0].date === yesterdayStr)) {
          current = streak;
        }
        longest = Math.max(longest, streak);
        streak = 1;
      }
    }
    prevDate = entryDate;
  }

  if (current === 0 && (sorted[0].date === today || sorted[0].date === yesterdayStr)) {
    current = streak;
  }
  longest = Math.max(longest, streak);

  return { current, longest };
}

export default function useReadingStats() {
  const [stats, setStats] = useLocalStorage<ReadingStats>(STORAGE_KEYS.readingStats, DEFAULT_STATS);

  const recordVerseRead = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      setStats((prev) => {
        const today = getLocalDateString();
        const history = [...(prev.history || [])];
        let todayEntry = history.find((d) => d.date === today);

        if (!todayEntry) {
          todayEntry = { date: today, versesRead: 0, minutesRead: 0, surahsVisited: [] };
          history.push(todayEntry);
        }

        todayEntry.versesRead++;
        if (!todayEntry.surahsVisited.includes(surahNumber)) {
          todayEntry.surahsVisited = [...todayEntry.surahsVisited, surahNumber];
        }

        // Trim old history
        const trimmed = history
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, MAX_HISTORY_DAYS);

        // Update surah progress
        const surahProgress = { ...(prev.surahProgress || {}) };
        const ayahs = surahProgress[surahNumber] || [];
        if (!ayahs.includes(ayahNumber)) {
          surahProgress[surahNumber] = [...ayahs, ayahNumber];
        }

        const streaks = calcStreak(trimmed);

        return {
          history: trimmed,
          currentStreak: streaks.current,
          longestStreak: Math.max(streaks.longest, prev.longestStreak || 0),
          totalVersesRead: (prev.totalVersesRead || 0) + 1,
          surahProgress
        };
      });
    },
    [setStats]
  );

  const addReadingMinutes = useCallback(
    (minutes: number) => {
      setStats((prev) => {
        const today = getLocalDateString();
        const history = [...(prev.history || [])];
        let todayEntry = history.find((d) => d.date === today);

        if (!todayEntry) {
          todayEntry = { date: today, versesRead: 0, minutesRead: 0, surahsVisited: [] };
          history.push(todayEntry);
        }

        todayEntry.minutesRead = (todayEntry.minutesRead || 0) + minutes;
        return { ...prev, history };
      });
    },
    [setStats]
  );

  const todayStats = useMemo(() => {
    const today = getLocalDateString();
    const entry = (stats.history || []).find((d) => d.date === today);
    return entry || { date: today, versesRead: 0, minutesRead: 0, surahsVisited: [] };
  }, [stats.history]);

  const weeklyData = useMemo(() => {
    const days: DailyReading[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = (stats.history || []).find((h) => h.date === dateStr);
      days.push(entry || { date: dateStr, versesRead: 0, minutesRead: 0, surahsVisited: [] });
    }
    return days;
  }, [stats.history]);

  const weekTotal = useMemo(
    () => weeklyData.reduce((sum, d) => sum + d.versesRead, 0),
    [weeklyData]
  );

  const surahProgress = useMemo(() => stats.surahProgress || {}, [stats.surahProgress]);

  return {
    stats,
    todayStats,
    weeklyData,
    weekTotal,
    surahProgress,
    recordVerseRead,
    addReadingMinutes
  };
}
