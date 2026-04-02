"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type StudyAudioNotePlayerAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
};

type StudyAudioNotePlayerProps = {
  audioSrc: string;
  title: string;
  meta: string;
  fallbackDurationMs: number;
  actions?: StudyAudioNotePlayerAction[];
  className?: string;
};

const formatClock = (secondsValue: number) => {
  const totalSeconds = Math.max(0, Math.round(secondsValue));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default function StudyAudioNotePlayer({
  audioSrc,
  title,
  meta,
  fallbackDurationMs,
  actions = [],
  className = ""
}: StudyAudioNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(fallbackDurationMs / 1000);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      setIsPlaying(false);
      setCurrentTimeSeconds(0);
      setDurationSeconds(fallbackDurationMs / 1000);
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTimeSeconds(0);
    setDurationSeconds(fallbackDurationMs / 1000);
  }, [audioSrc, fallbackDurationMs]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const syncDuration = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDurationSeconds(audio.duration);
    }
  }, []);

  const handleTogglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((nextValue: string) => {
    const audio = audioRef.current;
    const nextTime = Number(nextValue);

    if (!audio || !Number.isFinite(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    setCurrentTimeSeconds(nextTime);
  }, []);

  const safeDurationSeconds = durationSeconds > 0 ? durationSeconds : fallbackDurationMs / 1000;
  const playerClassName = `notes-audio-card${className ? ` ${className}` : ""}`;

  return (
    <div className={playerClassName}>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
        onTimeUpdate={() => setCurrentTimeSeconds(audioRef.current?.currentTime || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTimeSeconds(0);
        }}
      />

      <div className="notes-audio-card-head">
        <div className="notes-audio-card-copy">
          <span className="notes-audio-card-title">{title}</span>
          <span className="notes-audio-card-meta">{meta}</span>
        </div>

        {actions.length > 0 && (
          <div className="notes-audio-card-actions">
            {actions.map((action) => (
              <button
                key={action.label}
                className={`notes-audio-action${action.tone === "danger" ? " is-danger" : ""}`}
                onClick={action.onClick}
                type="button"
                disabled={action.disabled}
                title={action.label}
                aria-label={action.label}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="notes-audio-card-controls">
        <button
          className={`notes-audio-toggle${isPlaying ? " is-playing" : ""}`}
          onClick={() => {
            void handleTogglePlayback();
          }}
          type="button"
          aria-label={`${isPlaying ? "Pause" : "Play"} ${title}`}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l10-6.5-10-6.5Z" />
            </svg>
          )}
        </button>

        <span className="notes-audio-card-time">{formatClock(currentTimeSeconds)}</span>

        <div className="slider-track-container notes-audio-slider-track">
          <progress
            className="slider-track-fill notes-audio-slider-fill"
            value={currentTimeSeconds}
            max={safeDurationSeconds || 1}
          />
          <input
            className="slider-input notes-audio-slider-input"
            type="range"
            min={0}
            max={safeDurationSeconds || 1}
            step={0.1}
            value={Math.min(currentTimeSeconds, safeDurationSeconds || 0)}
            onChange={(event) => handleSeek(event.target.value)}
            aria-label={`Seek ${title}`}
            disabled={safeDurationSeconds <= 0}
          />
        </div>

        <span className="notes-audio-card-time">{formatClock(safeDurationSeconds)}</span>
      </div>
    </div>
  );
}

export type { StudyAudioNotePlayerAction };
