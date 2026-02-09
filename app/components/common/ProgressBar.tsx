"use client";

import { memo } from "react";

type ProgressBarProps = {
  current: number;
  total: number;
  label?: string;
};

function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;

  return (
    <div className="progress-container">
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-bar">
        <progress
          className="progress-fill"
          max={100}
          value={percentage}
          aria-label={label || "Progress"}
        />
      </div>
      <span className="progress-text">{percentage}%</span>
    </div>
  );
}

export default memo(ProgressBar);
