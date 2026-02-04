"use client";

import { useRef, useEffect } from "react";

export default function AudioPlayer({
  reciterLabel,
  nowPlayingLabel,
  audioSrc,
  isAutoPlaying,
  onPlaySurah,
  onStopAutoPlay,
  onAudioEnded,
  selectedSurah,
  nowPlaying,
  showSurahControls = true,
  showPlayerBar = true
}) {
  const audioRef = useRef(null);

  // Handle audio ended event for auto-play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (onAudioEnded) {
        onAudioEnded();
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [onAudioEnded]);

  // Auto-play when audioSrc changes during auto-play mode
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioSrc && isAutoPlaying) {
      audio.play().catch(() => {});
    }
  }, [audioSrc, isAutoPlaying]);

  if (!showPlayerBar) {
    return (
      <audio
        ref={audioRef}
        key={audioSrc || "silent"}
        src={audioSrc || ""}
        autoPlay
        hidden
      />
    );
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
              <button 
                className="action-btn stop-btn" 
                onClick={onStopAutoPlay}
              >
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
          <audio 
            ref={audioRef}
            key={audioSrc} 
            src={audioSrc} 
            controls 
            autoPlay 
          />
        ) : (
          <div className="audio-placeholder">Ready</div>
        )}
      </div>
    </div>
  );
}
