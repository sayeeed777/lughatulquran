"use client";

export default function AudioPlayer({
  reciterLabel,
  nowPlayingLabel,
  audioSrc
}) {
  return (
    <div className="audio-bar">
      <div>
        <p className="label">Recitation</p>
        <p className="meta">
          {reciterLabel} - {nowPlayingLabel}
        </p>
      </div>
      {audioSrc ? (
        <audio key={audioSrc} src={audioSrc} controls autoPlay />
      ) : (
        <div className="audio-placeholder">Ready</div>
      )}
    </div>
  );
}
