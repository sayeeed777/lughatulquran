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
    signal
  } = options;

  const now = Date.now();
  if (ttl > 0 && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (entry && now - entry.timestamp < ttl) {
      return entry.data as T;
    }
  }

  if (persist && typeof window !== "undefined" && ttl > 0) {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.timestamp && parsed?.data && now - parsed.timestamp < ttl) {
          cache.set(cacheKey, parsed);
          return parsed.data as T;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey) as Promise<T>;
  }

  const request = (async () => {
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
