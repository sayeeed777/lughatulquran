import { reportError } from "./telemetry";

const cache = new Map();
const inflight = new Map();
const STORAGE_PREFIX = "quran_api_cache:";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJSON(url, options = {}) {
  const {
    ttl = 0,
    retries = 0,
    retryDelay = 300,
    cacheKey = url,
    fetcher = fetch,
    persist = false,
    signal
  } = options;

  const now = Date.now();
  if (ttl > 0 && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (entry && now - entry.timestamp < ttl) {
      return entry.data;
    }
  }

  if (persist && typeof window !== "undefined" && ttl > 0) {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.timestamp && parsed?.data && now - parsed.timestamp < ttl) {
          cache.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const request = (async () => {
    let attempt = 0;
    while (true) {
      try {
        const response = await fetcher(url, { signal });
        const payload = await response.json();
        if (!response.ok) {
          const message = payload?.error || `Request failed (${response.status})`;
          throw new Error(message);
        }
        if (ttl > 0) {
          const entry = { timestamp: Date.now(), data: payload };
          cache.set(cacheKey, entry);
          if (persist && typeof window !== "undefined") {
            try {
              localStorage.setItem(`${STORAGE_PREFIX}${cacheKey}`, JSON.stringify(entry));
            } catch {
              // ignore storage errors
            }
          }
        }
        return payload;
      } catch (error) {
        attempt += 1;
        if (attempt > retries) {
          reportError(error, { url, cacheKey });
          throw error;
        }
        await sleep(retryDelay);
      }
    }
  })();

  inflight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    inflight.delete(cacheKey);
  }
}

export function clearApiCache() {
  cache.clear();
  inflight.clear();
  if (typeof window !== "undefined") {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore storage errors
    }
  }
}
