export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  if (process.env.NODE_ENV !== "production") {
    console.error("AppError:", normalizedError, context);
    return;
  }

  // Lightweight production hook. Replace with your backend/SaaS later.
  try {
    const payload = {
      message: normalizedError.message || "Unknown error",
      stack: normalizedError.stack || null,
      context,
      timestamp: Date.now()
    };
    if (navigator?.sendBeacon) {
      navigator.sendBeacon("/api/log", JSON.stringify(payload));
    } else {
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // swallow telemetry errors
  }
}
