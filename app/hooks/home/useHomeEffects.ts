"use client";

import { useEffect, useRef, useState } from "react";
import { parseVerseKey, verseKey } from "../../lib/utils";
import type { StudySession } from "../common";
import type {
  MemorizeConfig,
  NowPlaying,
  ReaderScopeMode,
  Surah,
  SurahData
} from "./types";

const MAX_JUZ_NUMBER = 30;
const MAX_MUSHAF_PAGE = 604;

type ReaderUrlState =
  | { mode: "surah"; surah: number; ayah: number | null }
  | { mode: "juz"; value: number }
  | { mode: "page"; value: number };

const parseIntegerInRange = (value: string | null, min: number, max: number) => {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

export function resolveReaderUrlState(
  search: string,
  hash: string,
  surahs: Pick<Surah, "number" | "numberOfAyahs">[]
): ReaderUrlState | null {
  const params = new URLSearchParams(search);
  const requestedSurah = parseIntegerInRange(params.get("surah"), 1, 114);
  const targetSurah = requestedSurah
    ? surahs.find((surah) => surah.number === requestedSurah)
    : null;

  // A valid Surah link is the most specific reader intent and must always
  // override a previously persisted Page or Juz selection.
  if (targetSurah) {
    const queryAyah = parseIntegerInRange(
      params.get("ayah"),
      1,
      targetSurah.numberOfAyahs
    );
    const hashMatch = hash.match(/^#?ayah-(\d+)$/);
    const hashAyah = parseIntegerInRange(
      hashMatch?.[1] || null,
      1,
      targetSurah.numberOfAyahs
    );

    return {
      mode: "surah",
      surah: targetSurah.number,
      ayah: queryAyah ?? hashAyah
    };
  }

  const page = parseIntegerInRange(params.get("page"), 1, MAX_MUSHAF_PAGE);
  if (page) return { mode: "page", value: page };

  const juz = parseIntegerInRange(params.get("juz"), 1, MAX_JUZ_NUMBER);
  if (juz) return { mode: "juz", value: juz };

  return null;
}

export function buildReaderUrl({
  currentUrl,
  readerScopeMode,
  readerJuzNumber,
  readerPageNumber,
  selectedSurahNumber,
  focusedAyahNumber
}: {
  currentUrl: string;
  readerScopeMode: ReaderScopeMode;
  readerJuzNumber: number;
  readerPageNumber: number;
  selectedSurahNumber: number | null;
  focusedAyahNumber: number | null;
}) {
  const url = new URL(currentUrl);

  if (readerScopeMode === "page") {
    url.searchParams.set("page", String(readerPageNumber));
    url.searchParams.delete("juz");
    url.searchParams.delete("surah");
    url.searchParams.delete("ayah");
    if (/^#ayah-\d+$/.test(url.hash)) url.hash = "";
    return url;
  }

  if (readerScopeMode === "juz") {
    url.searchParams.set("juz", String(readerJuzNumber));
    url.searchParams.delete("page");
    url.searchParams.delete("surah");
    url.searchParams.delete("ayah");
    if (/^#ayah-\d+$/.test(url.hash)) url.hash = "";
    return url;
  }

  url.searchParams.delete("page");
  url.searchParams.delete("juz");
  if (selectedSurahNumber) {
    url.searchParams.set("surah", String(selectedSurahNumber));
  }
  if (focusedAyahNumber) {
    url.searchParams.set("ayah", String(focusedAyahNumber));
  } else {
    url.searchParams.delete("ayah");
  }
  return url;
}

type UseHomeEffectsParams = {
  surahs: Surah[];
  selectedSurah: Surah | null;
  setSelectedSurah: (surah: Surah | null) => void;
  focusedAyahKey: string | null;
  setFocusedAyahKey: (value: string | null) => void;
  readerScopeMode: ReaderScopeMode;
  setReaderScopeMode: (value: ReaderScopeMode) => void;
  readerJuzNumber: number;
  setReaderJuzNumber: (value: number) => void;
  readerPageNumber: number;
  setReaderPageNumber: (value: number) => void;
  isReaderScopeStorageReady: boolean;
  pendingScroll: number | null;
  setPendingScroll: (value: number | null) => void;
  surahData: SurahData | null;
  updateLastRead: (surah: number, ayah: number, surahName: string) => void;
  updateStudySession: (payload: Omit<StudySession, "updatedAt">) => void;
  reciterId: string;
  isReciterReady: boolean;
  playbackRate: number;
  fontScale: { arabic: number; translation: number };
  readingMode: boolean;
  readerRepeatActive: boolean;
  memorizeConfig: MemorizeConfig;
  setMemorizeConfig: (value: MemorizeConfig | ((prev: MemorizeConfig) => MemorizeConfig)) => void;
  setIsAutoPlaying: (value: boolean) => void;
  setIsAudioPaused: (value: boolean) => void;
  nowPlaying: NowPlaying | null;
  isAutoPlaying: boolean;
};

export const shouldStopStudyMemorization = ({
  readingMode,
  readerRepeatActive,
  memorizeActive
}: {
  readingMode: boolean;
  readerRepeatActive: boolean;
  memorizeActive: boolean;
}) => !readingMode && !readerRepeatActive && memorizeActive;

export function useHomeEffects({
  surahs,
  selectedSurah,
  setSelectedSurah,
  focusedAyahKey,
  setFocusedAyahKey,
  readerScopeMode,
  setReaderScopeMode,
  readerJuzNumber,
  setReaderJuzNumber,
  readerPageNumber,
  setReaderPageNumber,
  isReaderScopeStorageReady,
  pendingScroll,
  setPendingScroll,
  surahData,
  updateLastRead,
  updateStudySession,
  reciterId,
  isReciterReady,
  playbackRate,
  fontScale,
  readingMode,
  readerRepeatActive,
  memorizeConfig,
  setMemorizeConfig,
  setIsAutoPlaying,
  setIsAudioPaused,
  nowPlaying,
  isAutoPlaying
}: UseHomeEffectsParams) {
  const studySessionWriteTimerRef = useRef<number | null>(null);
  const lastStudySessionSignatureRef = useRef<string>("");
  const [isReaderUrlInitialized, setIsReaderUrlInitialized] = useState(false);

  // Initial Surah Selection & URL handling
  useEffect(() => {
    if (!isReaderScopeStorageReady || !surahs.length || isReaderUrlInitialized) return;

    if (typeof window !== "undefined") {
      const readerUrlState = resolveReaderUrlState(
        window.location.search,
        window.location.hash,
        surahs
      );

      if (readerUrlState?.mode === "surah") {
        const targetSurah = surahs.find((surah) => surah.number === readerUrlState.surah);
        if (!targetSurah) return;
        setReaderScopeMode("surah");
        setSelectedSurah(targetSurah);
        if (readerUrlState.ayah) {
          setPendingScroll(readerUrlState.ayah);
          setFocusedAyahKey(verseKey(targetSurah.number, readerUrlState.ayah));
        }
        setIsReaderUrlInitialized(true);
        return;
      }

      if (readerUrlState?.mode === "page") {
        setReaderPageNumber(readerUrlState.value);
        setReaderScopeMode("page");
      } else if (readerUrlState?.mode === "juz") {
        setReaderJuzNumber(readerUrlState.value);
        setReaderScopeMode("juz");
      }
    }
    setSelectedSurah(surahs[0] || null);
    setIsReaderUrlInitialized(true);
  }, [
    isReaderScopeStorageReady,
    isReaderUrlInitialized,
    surahs,
    setSelectedSurah,
    setPendingScroll,
    setFocusedAyahKey,
    setReaderScopeMode,
    setReaderJuzNumber,
    setReaderPageNumber
  ]);

  // Keep one unambiguous reader scope in the URL. replaceState preserves the
  // current history entry while making refreshes and copied URLs deterministic.
  useEffect(() => {
    if (typeof window === "undefined" || !isReaderUrlInitialized || !selectedSurah) return;
    const focusedAyahNumber = focusedAyahKey
      ? parseVerseKey(focusedAyahKey).ayah
      : null;
    const url = buildReaderUrl({
      currentUrl: window.location.href,
      readerScopeMode,
      readerJuzNumber,
      readerPageNumber,
      selectedSurahNumber: selectedSurah.number,
      focusedAyahNumber
    });
    if (url.toString() !== window.location.href) {
      window.history.replaceState({}, "", url);
    }
  }, [
    selectedSurah,
    focusedAyahKey,
    readerScopeMode,
    readerJuzNumber,
    readerPageNumber,
    isReaderUrlInitialized
  ]);

  // Handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const readerUrlState = resolveReaderUrlState(
        window.location.search,
        window.location.hash,
        surahs
      );
      if (!readerUrlState) return;

      if (readerUrlState.mode === "page") {
        setReaderPageNumber(readerUrlState.value);
        setReaderScopeMode("page");
        setPendingScroll(null);
        setFocusedAyahKey(null);
        return;
      }

      if (readerUrlState.mode === "juz") {
        setReaderJuzNumber(readerUrlState.value);
        setReaderScopeMode("juz");
        setPendingScroll(null);
        setFocusedAyahKey(null);
        return;
      }

      const targetSurah = surahs.find((s) => s.number === readerUrlState.surah);
      if (!targetSurah) return;
      setReaderScopeMode("surah");
      if (!selectedSurah || selectedSurah.number !== readerUrlState.surah) {
        setSelectedSurah(targetSurah);
      }
      if (readerUrlState.ayah) {
        setPendingScroll(readerUrlState.ayah);
        setFocusedAyahKey(verseKey(readerUrlState.surah, readerUrlState.ayah));
      } else {
        setPendingScroll(null);
        setFocusedAyahKey(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    surahs,
    selectedSurah,
    setSelectedSurah,
    setPendingScroll,
    setFocusedAyahKey,
    setReaderScopeMode,
    setReaderJuzNumber,
    setReaderPageNumber
  ]);

  // Update Last Read
  useEffect(() => {
    if (!selectedSurah || !focusedAyahKey) return;
    const { surah, ayah } = parseVerseKey(focusedAyahKey);
    updateLastRead(surah, ayah, selectedSurah.englishName);
  }, [focusedAyahKey, selectedSurah, updateLastRead]);

  // Persist richer "continue where left off" session state
  useEffect(() => {
    if (!selectedSurah || !isReciterReady) return;
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
    isReciterReady,
    playbackRate,
    fontScale?.arabic,
    fontScale?.translation,
    updateStudySession
  ]);

  // Stop Study Mode memorization when leaving Study Mode. Reader repeat shares
  // the same loop state, so it must remain active in the normal reader.
  useEffect(() => {
    if (!shouldStopStudyMemorization({
      readingMode,
      readerRepeatActive,
      memorizeActive: memorizeConfig.active
    })) return;
    setMemorizeConfig((prev) => ({ ...prev, active: false, remaining: 0 }));
    setIsAutoPlaying(false);
    setIsAudioPaused(false);
  }, [
    readingMode,
    readerRepeatActive,
    memorizeConfig.active,
    setMemorizeConfig,
    setIsAutoPlaying,
    setIsAudioPaused
  ]);

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
