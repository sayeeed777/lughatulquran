"use client";

import { memo } from "react";

type LastRead = {
  surah: number;
  ayah: number;
  surahName: string;
  timestamp: number;
};

type LastReadCardProps = {
  lastRead: LastRead | null;
  onContinue: () => void;
};

function LastReadCard({ lastRead, onContinue }: LastReadCardProps) {
  if (!lastRead) return null;

  const timeAgo = getTimeAgo(lastRead.timestamp);

  return (
    <div className="last-read-card">
      <div className="last-read-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <div className="last-read-content">
        <p className="last-read-label">Continue Reading</p>
        <p className="last-read-location">
          {lastRead.surahName} - Ayah {lastRead.ayah}
        </p>
        <p className="last-read-time">{timeAgo}</p>
      </div>
      <button className="action-btn" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

function getTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return new Date(timestamp).toLocaleDateString();
}

export default memo(LastReadCard);
