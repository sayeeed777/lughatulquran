import { reportError } from "./telemetry";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type CacheEntry<T> = {
  timestamp: number;
  data: T;
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

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheEntry<T> | null;
        if (parsed?.timestamp && parsed?.data) {
          if (now - parsed.timestamp < ttl) {
            cache.set(cacheKey, parsed);
            return parsed.data as T;
          }
          if (staleWhileRevalidate) {
            cache.set(cacheKey, parsed);
            staleEntry = parsed;
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  const performFetch = async (): Promise<T> => {
    let attempt = 0;
    while (true) {
      try {
        const response = await fetcher(url, { signal });
        const payload = (await response.json()) as T;
        if (!response.ok) {
          const message =
            typeof payload === "object" && payload && "error" in payload
              ? String((payload as { error?: string }).error || `Request failed (${response.status})`)
              : `Request failed (${response.status})`;
          throw new Error(message);
        }
        if (ttl > 0) {
          const entry: CacheEntry<T> = { timestamp: Date.now(), data: payload };
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
  };

  const startRequest = () => {
    const request = performFetch();
    inflight.set(cacheKey, request);
    request.finally(() => inflight.delete(cacheKey)).catch(() => {});
    return request;
  };

  if (staleEntry) {
    if (!inflight.has(cacheKey)) {
      startRequest().catch(() => {});
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
