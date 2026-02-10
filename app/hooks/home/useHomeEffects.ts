"use client";

import { useEffect } from "react";
import { useRef } from "react";
import { parseVerseKey, verseKey } from "../../lib/utils";
import type { StudySession } from "../common";
import type { MemorizeConfig, NowPlaying, Surah, SurahData } from "./types";

type UseHomeEffectsParams = {
  surahs: Surah[];
  selectedSurah: Surah | null;
  setSelectedSurah: (surah: Surah | null) => void;
  focusedAyahKey: string | null;
  setFocusedAyahKey: (value: string | null) => void;
  pendingScroll: number | null;
  setPendingScroll: (value: number | null) => void;
  surahData: SurahData | null;
  updateLastRead: (surah: number, ayah: number, surahName: string) => void;
  updateStudySession: (payload: Omit<StudySession, "updatedAt">) => void;
  reciterId: string;
  playbackRate: number;
  fontScale: { arabic: number; translation: number };
  readingMode: boolean;
  memorizeConfig: MemorizeConfig;
  setMemorizeConfig: (value: MemorizeConfig | ((prev: MemorizeConfig) => MemorizeConfig)) => void;
  setIsAutoPlaying: (value: boolean) => void;
  setIsAudioPaused: (value: boolean) => void;
  nowPlaying: NowPlaying | null;
  isAutoPlaying: boolean;
};

export function useHomeEffects({
  surahs,
  selectedSurah,
  setSelectedSurah,
  focusedAyahKey,
  setFocusedAyahKey,
  pendingScroll,
  setPendingScroll,
  surahData,
  updateLastRead,
  updateStudySession,
  reciterId,
  playbackRate,
  fontScale,
  readingMode,
  memorizeConfig,
  setMemorizeConfig,
  setIsAutoPlaying,
  setIsAudioPaused,
  nowPlaying,
  isAutoPlaying
}: UseHomeEffectsParams) {
  const studySessionWriteTimerRef = useRef<number | null>(null);
  const lastStudySessionSignatureRef = useRef<string>("");
  const isMobileViewport = () =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches;

  // Initial Surah Selection & URL handling
  useEffect(() => {
    if (!surahs.length || selectedSurah) return;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const surahParam = Number(params.get("surah"));
      const ayahParam = Number(params.get("ayah"));
      const hashMatch = window.location.hash.match(/ayah-(\d+)/);
      const hashAyah = hashMatch ? Number(hashMatch[1]) : null;

      const targetSurah = surahs.find((surah) => surah.number === surahParam);
      if (targetSurah) {
        setSelectedSurah(targetSurah);
        const targetAyah = ayahParam || hashAyah;
        if (targetAyah && !isMobileViewport()) {
          setPendingScroll(targetAyah);
          setFocusedAyahKey(verseKey(targetSurah.number, targetAyah));
        }
        return;
      }
    }
    setSelectedSurah(surahs[0] || null);
  }, [surahs, selectedSurah, setSelectedSurah, setPendingScroll, setFocusedAyahKey]);

  // Sync URL with selection
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSurah) return;
    const url = new URL(window.location.href);
    url.searchParams.set("surah", String(selectedSurah.number));
    if (focusedAyahKey && !isMobileViewport()) {
      const { ayah } = parseVerseKey(focusedAyahKey);
      url.searchParams.set("ayah", String(ayah));
    } else {
      url.searchParams.delete("ayah");
    }
    window.history.replaceState({}, "", url);
  }, [selectedSurah, focusedAyahKey]);

  // Update Last Read
  useEffect(() => {
    if (!selectedSurah || !focusedAyahKey) return;
    const { surah, ayah } = parseVerseKey(focusedAyahKey);
    updateLastRead(surah, ayah, selectedSurah.englishName);
  }, [focusedAyahKey, selectedSurah, updateLastRead]);

  // Persist richer "continue where left off" session state
  useEffect(() => {
    if (!selectedSurah) return;
    const focusedAyah = focusedAyahKey ? parseVerseKey(focusedAyahKey).ayah : null;
    const playingAyah =
      nowPlaying?.surah === selectedSurah.number ? nowPlaying.ayah : null;
    const ayah = focusedAyah || playingAyah;
    if (!ayah) return;

    const payload: Omit<StudySession, "updatedAt"> = {
      surah: selectedSurah.number,
      ayah,
      surahName: selectedSurah.englishName,
      reciterId,
      playbackRate,
      fontScale: {
        arabic: Number(fontScale?.arabic) || 1,
        translation: Number(fontScale?.translation) || 1
      }
    };

    const signature = [
      payload.surah,
      payload.ayah,
      payload.surahName,
      payload.reciterId,
      payload.playbackRate.toFixed(2),
      payload.fontScale.arabic.toFixed(2),
      payload.fontScale.translation.toFixed(2)
    ].join("|");

    if (signature === lastStudySessionSignatureRef.current) return;

    if (typeof window === "undefined") {
      updateStudySession(payload);
      lastStudySessionSignatureRef.current = signature;
      return;
    }

    if (studySessionWriteTimerRef.current !== null) {
      window.clearTimeout(studySessionWriteTimerRef.current);
    }

    studySessionWriteTimerRef.current = window.setTimeout(() => {
      updateStudySession(payload);
      lastStudySessionSignatureRef.current = signature;
      studySessionWriteTimerRef.current = null;
    }, 220);

    return () => {
      if (studySessionWriteTimerRef.current !== null) {
        window.clearTimeout(studySessionWriteTimerRef.current);
        studySessionWriteTimerRef.current = null;
      }
    };
  }, [
    selectedSurah,
    focusedAyahKey,
    nowPlaying?.surah,
    nowPlaying?.ayah,
    reciterId,
    playbackRate,
    fontScale?.arabic,
    fontScale?.translation,
    updateStudySession
  ]);

  // Stop memorize when exiting study mode
  useEffect(() => {
    if (readingMode) return;
    if (!memorizeConfig.active) return;
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
  }, [readingMode, memorizeConfig.active, setMemorizeConfig, setIsAutoPlaying, setIsAudioPaused]);

  // Pending Scroll Logic
  useEffect(() => {
    if (!pendingScroll || !selectedSurah) return;

    let isCancelled = false;
    let frameId: number | null = null;
    let attempts = 0;
    const targetAyah = pendingScroll;
    const maxAttempts = 240;

    const scrollWhenReady = () => {
      if (isCancelled) return;
      const target = document.getElementById(`ayah-${targetAyah}`);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        setFocusedAyahKey(verseKey(selectedSurah.number, targetAyah));
        setPendingScroll(null);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        setPendingScroll(null);
        return;
      }
      frameId = window.requestAnimationFrame(scrollWhenReady);
    };

    const timer = window.setTimeout(scrollWhenReady, 60);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [pendingScroll, selectedSurah, surahData?.ayahs?.length, setFocusedAyahKey, setPendingScroll]);

  // Auto-scroll to currently playing ayah during auto-play
  useEffect(() => {
    if (!isAutoPlaying || !nowPlaying || !selectedSurah) return;
    if (nowPlaying.surah !== selectedSurah.number) return;

    const timer = setTimeout(() => {
      const target = document.getElementById(`ayah-${nowPlaying.ayah}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nowPlaying, isAutoPlaying, selectedSurah]);
}
