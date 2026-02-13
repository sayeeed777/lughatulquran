import { reportError } from "./telemetry";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type CacheEntry<T> = {
  timestamp: number;
  data: T;
};

type PersistedCacheEntry<T> = CacheEntry<T> & {
  ttl?: number;
};

export type FetchJSONOptions = {
  ttl?: number;
  retries?: number;
  retryDelay?: number;
  cacheKey?: string;
  fetcher?: Fetcher;
  persist?: boolean;
  staleWhileRevalidate?: boolean;
  signal?: AbortSignal;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const STORAGE_PREFIX = "quran_api_cache:";
const MAX_PERSISTED_CACHE_ENTRIES = 160;
const MAX_PERSISTED_CACHE_BYTES = 3 * 1024 * 1024; // ~3 MB
const MAX_PERSISTED_ENTRY_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPersistedPruneAt = 0;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === "AbortError";
};

const getPersistedStorageKey = (cacheKey: string) => `${STORAGE_PREFIX}${cacheKey}`;

const prunePersistedCache = (now = Date.now()) => {
  if (typeof window === "undefined") return;

  try {
    const entries: { key: string; timestamp: number; bytes: number }[] = [];
    let totalBytes = 0;

    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.removeItem(key);
        continue;
      }

      let parsed: PersistedCacheEntry<unknown> | null = null;
      try {
        parsed = JSON.parse(raw) as PersistedCacheEntry<unknown>;
      } catch {
        localStorage.removeItem(key);
        continue;
      }

      const timestamp = parsed?.timestamp;
      if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
        localStorage.removeItem(key);
        continue;
      }

      if (now - timestamp > MAX_PERSISTED_ENTRY_AGE_MS) {
        localStorage.removeItem(key);
        continue;
      }

      const bytes = key.length + raw.length;
      totalBytes += bytes;
      entries.push({ key, timestamp, bytes });
    }

    entries.sort((a, b) => b.timestamp - a.timestamp);

    while (
      entries.length > MAX_PERSISTED_CACHE_ENTRIES ||
      totalBytes > MAX_PERSISTED_CACHE_BYTES
    ) {
      const oldest = entries.pop();
      if (!oldest) break;
      localStorage.removeItem(oldest.key);
      totalBytes -= oldest.bytes;
    }
  } catch {
    // ignore storage errors
  }
};

const maybePrunePersistedCache = () => {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPersistedPruneAt < PRUNE_INTERVAL_MS) return;
  lastPersistedPruneAt = now;
  prunePersistedCache(now);
};

const readPersistedEntry = <T>(cacheKey: string) => {
  if (typeof window === "undefined") return null as PersistedCacheEntry<T> | null;
  try {
    const stored = localStorage.getItem(getPersistedStorageKey(cacheKey));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedCacheEntry<T> | null;
    if (
      !parsed ||
      typeof parsed.timestamp !== "number" ||
      !Number.isFinite(parsed.timestamp) ||
      !Object.prototype.hasOwnProperty.call(parsed, "data")
    ) {
      localStorage.removeItem(getPersistedStorageKey(cacheKey));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const persistEntry = <T>(cacheKey: string, entry: PersistedCacheEntry<T>) => {
  if (typeof window === "undefined") return;
  const storageKey = getPersistedStorageKey(cacheKey);
  const serialized = JSON.stringify(entry);

  try {
    localStorage.setItem(storageKey, serialized);
    maybePrunePersistedCache();
    return;
  } catch {
    // continue to prune + retry once
  }

  try {
    prunePersistedCache(Date.now());
    localStorage.setItem(storageKey, serialized);
  } catch {
    // ignore storage errors
  }
};

export async function fetchJSON<T = unknown>(url: string, options: FetchJSONOptions = {}): Promise<T> {
  const {
    ttl = 0,
    retries = 0,
    retryDelay = 300,
    cacheKey = url,
    fetcher = fetch,
    persist = false,
    staleWhileRevalidate = false,
    signal
  } = options;

  const now = Date.now();
  let staleEntry: CacheEntry<T> | null = null;
  if (ttl > 0 && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (entry) {
      if (now - entry.timestamp < ttl) {
        return entry.data as T;
      }
      if (staleWhileRevalidate) {
        staleEntry = entry;
      }
    }
  }

  if (persist && typeof window !== "undefined" && ttl > 0) {
    maybePrunePersistedCache();
    const parsed = readPersistedEntry<T>(cacheKey);
    if (parsed) {
      if (now - parsed.timestamp < ttl) {
        cache.set(cacheKey, { timestamp: parsed.timestamp, data: parsed.data });
        return parsed.data as T;
      }
      if (staleWhileRevalidate) {
        const staleCacheEntry: CacheEntry<T> = { timestamp: parsed.timestamp, data: parsed.data };
        cache.set(cacheKey, staleCacheEntry);
        staleEntry = staleCacheEntry;
      }
    }
  }

  const performFetch = async (): Promise<T> => {
    let attempt = 0;
    while (true) {
      try {
        const response = await fetcher(url, { signal });
        if (!response.ok) {
          let errorMessage = `Request failed (${response.status})`;
          try {
            const body = await response.json();
            if (typeof body === "object" && body && "error" in body) {
              errorMessage = String((body as { error?: string }).error || errorMessage);
            }
          } catch {
            // body wasn't JSON — use the default status message
          }
          throw new Error(errorMessage);
        }
        const payload = (await response.json()) as T;
        if (ttl > 0) {
          const entry: CacheEntry<T> = { timestamp: Date.now(), data: payload };
          cache.set(cacheKey, entry);
          if (persist && typeof window !== "undefined") {
            persistEntry(cacheKey, { ...entry, ttl });
          }
        }
        return payload;
      } catch (error) {
        // Don't retry or report AbortErrors - they're expected cancellations
        if (isAbortError(error)) {
          throw error;
        }
        attempt += 1;
        if (attempt > retries) {
          reportError(error, { url, cacheKey });
          throw error;
        }
        await sleep(retryDelay);
      }
    }
  };

  const startRequest = () => {
    const request = performFetch();
    inflight.set(cacheKey, request);
    request.finally(() => inflight.delete(cacheKey)).catch(() => { });
    return request;
  };

  if (staleEntry) {
    if (!inflight.has(cacheKey)) {
      startRequest().catch(() => { });
    }
    return staleEntry.data as T;
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey) as Promise<T>;
  }

  return await startRequest();
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
