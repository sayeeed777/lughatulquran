"use client";

import { useRef, useEffect } from "react";

type Surah = {
  number: number;
};

type NowPlaying = {
  surah: number;
  ayah: number;
};

type AudioPlayerProps = {
  reciterLabel: string;
  nowPlayingLabel: string;
  audioSrc: string | null;
  isAutoPlaying: boolean;
  isAudioPaused?: boolean;
  playbackRate?: number;
  onPlaySurah: (startAyah: number) => void;
  onStopAutoPlay: () => void;
  onAudioEnded: () => void;
  selectedSurah: Surah | null;
  nowPlaying: NowPlaying | null;
  showSurahControls?: boolean;
  showPlayerBar?: boolean;
};

export default function AudioPlayer({
  reciterLabel,
  nowPlayingLabel,
  audioSrc,
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

  // Handle audio ended event for auto-play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      onAudioEnded();
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [onAudioEnded]);

  // Auto-play when audioSrc changes during auto-play mode
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioSrc && isAutoPlaying) {
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {});
    }
  }, [audioSrc, isAutoPlaying, playbackRate]);

  // Pause/resume for single ayah playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || isAutoPlaying) return;
    if (isAudioPaused) {
      audio.pause();
      return;
    }
    audio.playbackRate = playbackRate;
    audio.play().catch(() => {});
  }, [audioSrc, isAudioPaused, isAutoPlaying, playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate, audioSrc]);

  if (!showPlayerBar) {
    if (!audioSrc) {
      return null;
    }
    return <audio ref={audioRef} key={audioSrc} src={audioSrc} autoPlay hidden />;
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
        {audioSrc ? (
          <audio ref={audioRef} key={audioSrc} src={audioSrc} controls autoPlay />
        ) : (
          <div className="audio-placeholder">Ready</div>
        )}
      </div>
    </div>
  );
}
