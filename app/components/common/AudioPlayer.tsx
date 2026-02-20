"use client";

import { useRef, useEffect } from "react";
import type { Surah } from "../../lib/types";

type SurahSummary = Pick<Surah, "number">;

type NowPlaying = {
  surah: number;
  ayah: number;
};

type AudioPlayerProps = {
  reciterLabel: string;
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
  showSurahControls?: boolean;
  showPlayerBar?: boolean;
};

export default function AudioPlayer({
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

  // Wire up the ended event once — the audio element is never remounted
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => onAudioEnded();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [onAudioEnded]);

  // Update src imperatively (no remount) and play — key fix for background playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioSrc) {
      audio.pause();
      return;
    }

    // Only reload if src actually changed
    if (audio.src !== audioSrc) {
      audio.src = audioSrc;
      audio.load();
    }

    audio.playbackRate = playbackRate;

    if (isAutoPlaying && !isAudioPaused) {
      audio.play().catch(() => {});
    }
  }, [audioSrc, isAutoPlaying, isAudioPaused, playbackRate]);

  // Pause / resume for single-ayah playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || isAutoPlaying) return;
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
      audioRef.current?.play().catch(() => {});
      navigator.mediaSession.playbackState = "playing";
    });

    navigator.mediaSession.setActionHandler("pause", () => {
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
