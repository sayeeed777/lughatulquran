"use client";

import { memo } from "react";

type ProgressBarProps = {
  current: number;
  total: number;
  label?: string;
};

function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;
  const hasLabel = Boolean(label);

  return (
    <div className="progress-container">
      {hasLabel ? (
        <span className="progress-label">{label}</span>
      ) : (
        <span className="progress-spacer" aria-hidden="true" />
      )}
      <div
        className="progress-bar"
        role="progressbar"
        aria-label={label || "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <span className="progress-text">{percentage}%</span>
    </div>
  );
}

export default memo(ProgressBar);
