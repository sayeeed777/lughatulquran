export function reportError(error, context = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.error("AppError:", error, context);
    return;
  }

  // Lightweight production hook. Replace with your backend/SaaS later.
  try {
    const payload = {
      message: error?.message || "Unknown error",
      stack: error?.stack || null,
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
