"use client";

export default function InlineError({
  title = "Couldn't load data",
  message,
  onRetry,
  compact = false
}) {
  return (
    <div className={`inline-error${compact ? " compact" : ""}`} role="alert">
      <div>
        <p className="inline-error-title">{title}</p>
        {message && <p className="inline-error-message">{message}</p>}
      </div>
      {onRetry && (
        <button className="action-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
