"use client";

import { useRef, useEffect, useCallback } from "react";
import { pad } from "../../lib/utils";
import type { Surah } from "../../lib/types";

type SurahSummary = Pick<Surah, "number" | "numberOfAyahs">;

type NowPlaying = {
  surah: number;
  ayah: number;
};

type AudioPlayerProps = {
  reciterId: string;
  reciterLabel: string;
  reciterBaseUrl?: string;
  nowPlayingLabel: string;
  audioSrc: string | null;
  nextAudioSrc?: string | null;
  isAutoPlaying: boolean;
  isAudioPaused?: boolean;
  playbackRate?: number;
  onPlaySurah: (startAyah: number) => void;
  onStopAutoPlay: () => void;
  onAudioEnded: () => void;
  selectedSurah: SurahSummary | null;
  nowPlaying: NowPlaying | null;
  nowPlayingPage?: number | null;
  surahPageStart?: number | null;
  surahPageEnd?: number | null;
  showSurahControls?: boolean;
  showPlayerBar?: boolean;
};

type ChapterTimestamp = {
  verse_key?: string;
  timestamp_from?: number;
  timestamp_to?: number;
};

type ChapterRecitationResponse = {
  audio_file?: {
    audio_url?: string;
    timestamps?: ChapterTimestamp[];
  };
};

type ChapterVerseTiming = {
  ayah: number;
  fromMs: number;
  toMs: number;
};

type ChapterAudioData = {
  audioUrl: string;
  timings: ChapterVerseTiming[];
  byAyah: Map<number, ChapterVerseTiming>;
};

const QURAN_API_RECITER_BY_LOCAL_ID: Record<string, number> = {
  alafasy: 7,
  sudais: 3,
  shuraim: 10,
  shaatree: 4,
  hani: 5,
  abdulbasit: 2,
  husary: 6,
  minshawi: 8
};

const parseAyahFromVerseKey = (verseKey?: string): number | null => {
  if (!verseKey) return null;
  const [, ayahRaw] = verseKey.split(":");
  const ayah = Number.parseInt(ayahRaw || "", 10);
  return Number.isInteger(ayah) && ayah > 0 ? ayah : null;
};

const normalizeAudioUrl = (audioUrl?: string): string | null => {
  if (!audioUrl) return null;
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  return `https://audio.qurancdn.com/${audioUrl.replace(/^\/+/, "")}`;
};

type ActivateChapterModeOptions = {
  preserveAyahProgress: boolean;
  allowWhileVisible?: boolean;
  targetAyah?: number;
};

export default function AudioPlayer({
  reciterId,
  reciterLabel,
  nowPlayingLabel,
  audioSrc,
  nextAudioSrc,
  isAutoPlaying,
  isAudioPaused = false,
  playbackRate = 1,
  onPlaySurah,
  onStopAutoPlay,
  onAudioEnded,
  selectedSurah,
  nowPlaying,
  showSurahControls = true,
  showPlayerBar = true
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const recoverTimerRef = useRef<number | null>(null);
  const pausedByMediaSessionRef = useRef(false);
  const chapterModeRef = useRef(false);
  const chapterKeyRef = useRef<string | null>(null);
  const chapterCurrentAyahRef = useRef<number | null>(null);
  const chapterTimingIndexRef = useRef(0);
  const chapterSwitchingRef = useRef(false);
  const chapterCacheRef = useRef<Map<string, ChapterAudioData>>(new Map());
  const audioSrcRef = useRef<string | null>(audioSrc);
  useEffect(() => {
    audioSrcRef.current = audioSrc;
  }, [audioSrc]);

  // Keep a ref to isAutoPlaying so the ended handler can read the latest
  // value without being a stale closure — critical for background playback.
  const isAutoPlayingRef = useRef(isAutoPlaying);
  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  const isAudioPausedRef = useRef(isAudioPaused);
  useEffect(() => {
    isAudioPausedRef.current = isAudioPaused;
  }, [isAudioPaused]);

  const playbackRateRef = useRef(playbackRate);
  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  const nowPlayingRef = useRef(nowPlaying);
  useEffect(() => {
    nowPlayingRef.current = nowPlaying;
  }, [nowPlaying]);

  const selectedSurahRef = useRef(selectedSurah);
  useEffect(() => {
    selectedSurahRef.current = selectedSurah;
  }, [selectedSurah]);

  const disableChapterMode = useCallback(() => {
    chapterModeRef.current = false;
    chapterKeyRef.current = null;
    chapterCurrentAyahRef.current = null;
    chapterTimingIndexRef.current = 0;
  }, []);

  const getChapterCacheKey = useCallback((localReciterId: string, surahNumber: number) => {
    return `${localReciterId}:${surahNumber}`;
  }, []);

  const fetchChapterAudioData = useCallback(
    async (localReciterId: string, surahNumber: number): Promise<ChapterAudioData | null> => {
      const reciterApiId = QURAN_API_RECITER_BY_LOCAL_ID[localReciterId];
      if (!reciterApiId || !Number.isInteger(surahNumber) || surahNumber < 1) return null;

      const cacheKey = getChapterCacheKey(localReciterId, surahNumber);
      const cached = chapterCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(
        `https://api.quran.com/api/v4/chapter_recitations/${reciterApiId}/${surahNumber}?segments=true`
      );
      if (!response.ok) return null;

      const payload = (await response.json()) as ChapterRecitationResponse;
      const rawAudioUrl = normalizeAudioUrl(payload.audio_file?.audio_url);
      const rawTimestamps = payload.audio_file?.timestamps || [];
      if (!rawAudioUrl || !rawTimestamps.length) return null;

      const timings: ChapterVerseTiming[] = rawTimestamps
        .map((item) => {
          const ayah = parseAyahFromVerseKey(item.verse_key);
          const fromMs = Number(item.timestamp_from);
          const toMs = Number(item.timestamp_to);
          if (!ayah || !Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
            return null;
          }
          return { ayah, fromMs, toMs };
        })
        .filter((item): item is ChapterVerseTiming => item !== null);

      if (!timings.length) return null;

      const byAyah = new Map<number, ChapterVerseTiming>();
      for (const timing of timings) {
        byAyah.set(timing.ayah, timing);
      }

      const chapterData: ChapterAudioData = {
        audioUrl: rawAudioUrl,
        timings,
        byAyah
      };

      chapterCacheRef.current.set(cacheKey, chapterData);
      return chapterData;
    },
    [getChapterCacheKey]
  );

  const resolveAyahAtTimestamp = useCallback((data: ChapterAudioData, currentTimeMs: number): number | null => {
    if (!data.timings.length) return null;

    let index = chapterTimingIndexRef.current;
    if (index < 0 || index >= data.timings.length) index = 0;

    while (index + 1 < data.timings.length && currentTimeMs > data.timings[index].toMs) {
      index += 1;
    }
    while (index > 0 && currentTimeMs < data.timings[index].fromMs) {
      index -= 1;
    }

    const current = data.timings[index];
    const inRange = currentTimeMs >= current.fromMs && currentTimeMs <= current.toMs;
    if (!inRange) {
      const fallbackIndex = data.timings.findIndex(
        (item) => currentTimeMs >= item.fromMs && currentTimeMs <= item.toMs
      );
      if (fallbackIndex < 0) return null;
      chapterTimingIndexRef.current = fallbackIndex;
      return data.timings[fallbackIndex]?.ayah || null;
    }

    chapterTimingIndexRef.current = index;
    return current.ayah;
  }, []);

  const activateChapterMode = useCallback(
    async ({
      preserveAyahProgress,
      allowWhileVisible = false,
      targetAyah
    }: ActivateChapterModeOptions): Promise<boolean> => {
      if (chapterSwitchingRef.current) return false;
      if (
        typeof document === "undefined"
        || (!allowWhileVisible && document.visibilityState === "visible")
      ) {
        return false;
      }
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return false;

      const currentNowPlaying = nowPlayingRef.current;
      const audio = audioRef.current;
      if (!audio || !currentNowPlaying) return false;
      const targetAyahNumber = Number.isInteger(targetAyah) && Number(targetAyah) > 0
        ? Number(targetAyah)
        : currentNowPlaying.ayah;

      chapterSwitchingRef.current = true;
      try {
        const chapterData = await fetchChapterAudioData(reciterId, currentNowPlaying.surah);
        if (!chapterData) return false;

        const currentAyahTiming = chapterData.byAyah.get(targetAyahNumber);
        if (!currentAyahTiming) return false;

        const ayahElapsedMs = preserveAyahProgress ? Math.max(0, Math.floor(audio.currentTime * 1000)) : 0;
        const desiredMs = Math.min(
          Math.max(currentAyahTiming.fromMs, currentAyahTiming.fromMs + ayahElapsedMs),
          Math.max(currentAyahTiming.fromMs, currentAyahTiming.toMs - 120)
        );
        const desiredSeconds = desiredMs / 1000;

        if (audio.src !== chapterData.audioUrl) {
          audio.src = chapterData.audioUrl;
          audio.load();
          await new Promise<void>((resolve) => {
            const timeoutId = window.setTimeout(resolve, 1400);
            const onLoaded = () => {
              window.clearTimeout(timeoutId);
              resolve();
            };
            audio.addEventListener("loadedmetadata", onLoaded, { once: true });
          });
        }

        try {
          audio.currentTime = desiredSeconds;
        } catch {
          // ignore seek errors
        }

        audio.playbackRate = playbackRateRef.current;
        await audio.play().catch(() => undefined);

        const cacheKey = getChapterCacheKey(reciterId, currentNowPlaying.surah);
        chapterModeRef.current = true;
        chapterKeyRef.current = cacheKey;
        chapterCurrentAyahRef.current = targetAyahNumber;
        const timingIndex = chapterData.timings.findIndex((item) => item.ayah === targetAyahNumber);
        chapterTimingIndexRef.current = timingIndex >= 0 ? timingIndex : 0;
        retryCountRef.current = 0;

        return true;
      } catch {
        return false;
      } finally {
        chapterSwitchingRef.current = false;
      }
    },
    [fetchChapterAudioData, getChapterCacheKey, reciterId]
  );

  const getNextSrcFromCurrent = useCallback((currentSrc: string) => {
    const match = currentSrc.match(/(\d{3})(\d{3})\.mp3(?:\?.*)?$/);
    if (!match) return null;

    const surah = Number.parseInt(match[1] || "0", 10);
    const ayah = Number.parseInt(match[2] || "0", 10);
    if (!Number.isInteger(surah) || !Number.isInteger(ayah) || surah < 1 || ayah < 1) {
      return null;
    }

    // Guard against requesting past the selected surah boundary.
    const currentSelectedSurah = selectedSurahRef.current;
    if (currentSelectedSurah?.number === surah && ayah >= currentSelectedSurah.numberOfAyahs) {
      return null;
    }

    return currentSrc.replace(/\d{6}\.mp3(?:\?.*)?$/, `${pad(surah)}${pad(ayah + 1)}.mp3`);
  }, []);

  // Wire up the ended event once — the audio element is never remounted.
  // When backgrounded, React state updates are throttled by the browser, so
  // we CANNOT rely on the audioSrc prop updating after onAudioEnded(). Instead,
  // we advance the audio element imperatively by parsing the current URL and
  // computing the next ayah ourselves. This keeps audio alive in the background.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      retryCountRef.current = 0;
      if (isAutoPlayingRef.current && chapterModeRef.current) {
        disableChapterMode();
        onStopAutoPlay();
        return;
      }

      if (isAutoPlayingRef.current) {
        const nextSrc = getNextSrcFromCurrent(audio.currentSrc || audio.src);
        if (nextSrc) {
          // No load() — avoids a spurious pause event that triggers the recovery
          // timer and creates a gap that can break the iOS audio session.
          // Setting src + play() is sufficient; the browser loads the new src.
          audio.src = nextSrc;
          audio.playbackRate = playbackRateRef.current;
          audio.play().catch(() => {});
        }
      }
      // Also notify React so it can update UI state (nowPlaying, scroll, etc.)
      onAudioEnded();
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [disableChapterMode, getNextSrcFromCurrent, onAudioEnded, onStopAutoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!chapterModeRef.current) return;
      const cacheKey = chapterKeyRef.current;
      if (!cacheKey) return;

      const chapterData = chapterCacheRef.current.get(cacheKey);
      if (!chapterData) return;

      const currentTimeMs = Math.floor(audio.currentTime * 1000);
      const ayahAtTime = resolveAyahAtTimestamp(chapterData, currentTimeMs);
      if (!ayahAtTime) return;

      const trackedAyah = chapterCurrentAyahRef.current;
      if (!trackedAyah) {
        chapterCurrentAyahRef.current = ayahAtTime;
        return;
      }

      if (ayahAtTime > trackedAyah) {
        chapterCurrentAyahRef.current = trackedAyah + 1;
        onAudioEnded();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [onAudioEnded, resolveAyahAtTimestamp]);

  // Background resilience: recover from network/decoder stalls while autoplaying.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const clearRecoveryTimer = () => {
      if (recoverTimerRef.current !== null) {
        window.clearTimeout(recoverTimerRef.current);
        recoverTimerRef.current = null;
      }
    };

    const tryRecovery = () => {
      if (recoverTimerRef.current !== null) return;
      recoverTimerRef.current = window.setTimeout(() => {
        recoverTimerRef.current = null;
        const node = audioRef.current;
        if (!node) return;
        if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
        if (!node.paused && !node.error) return;

        if (document.visibilityState !== "visible") {
          void activateChapterMode({ preserveAyahProgress: true }).then((activated) => {
            if (activated) return;

            const hiddenCurrentSrc = node.currentSrc || node.src;
            if (!hiddenCurrentSrc) return;

            if (retryCountRef.current < 1) {
              retryCountRef.current += 1;
              node.load();
              node.playbackRate = playbackRateRef.current;
              node.play().catch(() => {});
              return;
            }

            const hiddenNextSrc = getNextSrcFromCurrent(hiddenCurrentSrc);
            if (!hiddenNextSrc) return;
            retryCountRef.current = 0;
            node.src = hiddenNextSrc;
            node.load();
            node.playbackRate = playbackRateRef.current;
            node.play().catch(() => {});
            onAudioEnded();
          });
          return;
        }

        const currentSrc = node.currentSrc || node.src;
        if (!currentSrc) return;

        // One retry for the same verse before skipping to the next one.
        if (retryCountRef.current < 1) {
          retryCountRef.current += 1;
          node.load();
          node.playbackRate = playbackRateRef.current;
          node.play().catch(() => {
            const nextSrc = getNextSrcFromCurrent(currentSrc);
            if (!nextSrc) return;
            node.src = nextSrc;
            node.load();
            node.playbackRate = playbackRateRef.current;
            node.play().catch(() => {});
            onAudioEnded();
          });
          return;
        }

        const nextSrc = getNextSrcFromCurrent(currentSrc);
        if (!nextSrc) return;
        retryCountRef.current = 0;
        node.src = nextSrc;
        node.load();
        node.playbackRate = playbackRateRef.current;
        node.play().catch(() => {});
        onAudioEnded();
      }, 420);
    };

    const handleStall = () => {
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
      tryRecovery();
    };

    const handlePause = () => {
      if (pausedByMediaSessionRef.current) return;
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
      if (audio.ended) return;
      tryRecovery();
    };

    const handlePlaying = () => {
      retryCountRef.current = 0;
      clearRecoveryTimer();
    };

    audio.addEventListener("stalled", handleStall);
    audio.addEventListener("error", handleStall);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      clearRecoveryTimer();
      audio.removeEventListener("stalled", handleStall);
      audio.removeEventListener("error", handleStall);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [activateChapterMode, getNextSrcFromCurrent, onAudioEnded]);

  useEffect(() => {
    if (isAutoPlaying) return;
    pausedByMediaSessionRef.current = false;
    disableChapterMode();
  }, [disableChapterMode, isAutoPlaying]);

  // Primary autoplay strategy (Quran.com-like): use chapter stream + verse timestamps.
  // Keep ayah-by-ayah playback as fallback when no chapter recitation mapping exists.
  useEffect(() => {
    if (!isAutoPlaying || !nowPlaying) return;

    const cacheKey = getChapterCacheKey(reciterId, nowPlaying.surah);
    const supportsChapterMode = Boolean(QURAN_API_RECITER_BY_LOCAL_ID[reciterId]);

    if (!supportsChapterMode) {
      disableChapterMode();
      return;
    }

    if (!chapterModeRef.current || chapterKeyRef.current !== cacheKey) {
      void activateChapterMode({
        preserveAyahProgress: false,
        allowWhileVisible: true,
        targetAyah: nowPlaying.ayah
      });
      return;
    }

    const chapterData = chapterCacheRef.current.get(cacheKey);
    const audio = audioRef.current;
    if (!chapterData || !audio) return;

    const ayahTiming = chapterData.byAyah.get(nowPlaying.ayah);
    if (!ayahTiming) return;

    const currentMs = Math.floor(audio.currentTime * 1000);
    const seekToleranceMs = 900;
    const outsideTargetAyah =
      currentMs < ayahTiming.fromMs - seekToleranceMs || currentMs > ayahTiming.toMs + seekToleranceMs;

    if (!outsideTargetAyah) return;

    try {
      audio.currentTime = (ayahTiming.fromMs + 100) / 1000;
    } catch {
      // ignore seek errors
    }

    audio.playbackRate = playbackRateRef.current;
    if (audio.paused && !isAudioPausedRef.current && !pausedByMediaSessionRef.current) {
      audio.play().catch(() => {});
    }

    chapterCurrentAyahRef.current = nowPlaying.ayah;
    const index = chapterData.timings.findIndex((item) => item.ayah === nowPlaying.ayah);
    chapterTimingIndexRef.current = index >= 0 ? index : 0;
  }, [activateChapterMode, disableChapterMode, getChapterCacheKey, isAutoPlaying, nowPlaying, reciterId]);

  // Update src imperatively (no remount) and play.
  // Guard: if audio is already playing the correct src (set imperatively in the
  // background ended handler), do NOT reload or re-call play() — that would
  // interrupt background playback when React finally re-renders.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioSrc) {
      pausedByMediaSessionRef.current = false;
      disableChapterMode();
      audio.pause();
      audio.src = "";
      return;
    }

    if (chapterModeRef.current) {
      return;
    }

    // Only reload if src actually changed
    if (audio.src !== audioSrc) {
      pausedByMediaSessionRef.current = false;
      audio.src = audioSrc;
      audio.load();
    }

    audio.playbackRate = playbackRate;

    if (isAutoPlaying && !isAudioPaused && audio.paused) {
      if (pausedByMediaSessionRef.current) return;
      // Only call play() if not already playing — avoids restarting
      // audio that the background handler already started.
      audio.play().catch(() => {});
    }
  }, [audioSrc, disableChapterMode, isAutoPlaying, isAudioPaused, playbackRate]);

  // Pause / resume for single-ayah playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || isAutoPlaying || chapterModeRef.current) return;
    if (isAudioPaused) {
      audio.pause();
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {});
    }
  }, [isAudioPaused, isAutoPlaying, audioSrc, playbackRate]);

  // Sync playback rate without src change
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Preload next verse while current is playing
  useEffect(() => {
    if (!nextAudioSrc) return;
    const preload = new Audio();
    preload.preload = "auto";
    preload.src = nextAudioSrc;
    preloadRef.current = preload;
    return () => {
      preload.src = "";
      preloadRef.current = null;
    };
  }, [nextAudioSrc]);

  // Media Session API — tells the OS this is an active audio session
  // so the browser keeps JS alive between verses in background
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!audioSrc || !nowPlaying) {
      navigator.mediaSession.playbackState = "none";
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlayingLabel,
      artist: reciterLabel,
      album: "The Holy Quran — OpenFurqan",
      artwork: [
        { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
      ]
    });

    navigator.mediaSession.playbackState = isAudioPaused ? "paused" : "playing";

    navigator.mediaSession.setActionHandler("play", () => {
      pausedByMediaSessionRef.current = false;
      isAudioPausedRef.current = false;
      audioRef.current?.play().catch(() => {});
      navigator.mediaSession.playbackState = "playing";
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      pausedByMediaSessionRef.current = true;
      isAudioPausedRef.current = true;
      audioRef.current?.pause();
      navigator.mediaSession.playbackState = "paused";
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      onAudioEnded();
    });

    // previoustrack not supported in current design
    navigator.mediaSession.setActionHandler("previoustrack", null);

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
      } catch {
        // ignore
      }
    };
  }, [audioSrc, nowPlaying, nowPlayingLabel, reciterLabel, isAudioPaused, onAudioEnded]);

  // Visibility handler: when returning to the foreground, resume audio if the
  // OS paused it (e.g. after a phone call or OS-level interruption).
  useEffect(() => {
    const onVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.visibilityState === "hidden") {
        if (isAutoPlayingRef.current && !isAudioPausedRef.current) {
          void activateChapterMode({ preserveAyahProgress: true });
        }
        return;
      }

      // Coming back to visible — only act if audio unexpectedly stopped.
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
      if (pausedByMediaSessionRef.current) return;
      if (!audio.paused) return;

      if (chapterModeRef.current) {
        // Chapter mode is active but audio paused (OS may have interrupted it).
        // Just resume — don't restart from the beginning.
        audio.playbackRate = playbackRateRef.current;
        audio.play().catch(() => {});
        return;
      }

      // Ayah mode: restart from the last src React state recorded.
      const stateSrc = audioSrcRef.current;
      if (stateSrc && audio.src !== stateSrc) {
        audio.src = stateSrc;
        audio.load();
      }
      audio.playbackRate = playbackRateRef.current;
      audio.play().catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [activateChapterMode]);

  if (!showPlayerBar) {
    // Single persistent hidden audio element — no key prop, never remounted
    return <audio ref={audioRef} hidden />;
  }

  return (
    <div className="audio-bar">
      <div className="audio-info">
        <p className="label">Recitation</p>
        <p className="meta">
          {reciterLabel} - {nowPlayingLabel}
        </p>
      </div>
      <div className="audio-controls">
        {showSurahControls && selectedSurah && (
          <div className="surah-play-controls">
            {isAutoPlaying ? (
              <button className="action-btn stop-btn" onClick={onStopAutoPlay}>
                ⏹ Stop
              </button>
            ) : (
              <button
                className="action-btn play-surah-btn"
                onClick={() => onPlaySurah(nowPlaying?.ayah || 1)}
              >
                ▶ Play Surah
              </button>
            )}
          </div>
        )}
        {/* Single persistent audio element — no key prop */}
        <audio ref={audioRef} controls />
        {!audioSrc && <div className="audio-placeholder">Ready</div>}
      </div>
    </div>
  );
}
