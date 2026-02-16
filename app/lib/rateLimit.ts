import "server-only";

type RateLimitOptions = {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

type KvConfig = {
  url: string;
  token: string;
};

type LocalBucket = {
  count: number;
  bucketStart: number;
};

const LOCAL_BUCKETS_MAX = 5000;
const localBuckets = new Map<string, LocalBucket>();

const getKvConfig = (): KvConfig | null => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
};

const redisCommand = async <T>(config: KvConfig, command: string[]): Promise<T | null> => {
  const encoded = command.map((part) => encodeURIComponent(part)).join("/");
  const response = await fetch(`${config.url}/${encoded}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.token}`
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`KV command failed (${response.status})`);
  }
  const payload = (await response.json()) as { result?: unknown } | null;
  return (payload?.result as T | undefined) ?? null;
};

const retryAfterSecondsForWindow = (now: number, windowMs: number) => {
  const remainder = now % windowMs;
  const msLeft = remainder === 0 ? windowMs : windowMs - remainder;
  return Math.max(1, Math.ceil(msLeft / 1000));
};

const pruneLocalBuckets = (now: number) => {
  if (localBuckets.size <= LOCAL_BUCKETS_MAX) return;
  for (const [key, bucket] of localBuckets.entries()) {
    if (bucket.bucketStart < now) {
      localBuckets.delete(key);
    }
  }
};

const checkLocalRateLimit = (options: RateLimitOptions): RateLimitResult => {
  const now = Date.now();
  const bucketStart = Math.floor(now / options.windowMs) * options.windowMs;
  const bucketKey = `${options.namespace}:${bucketStart}:${options.key}`;
  const current = localBuckets.get(bucketKey);
  const nextCount = (current?.count || 0) + 1;
  localBuckets.set(bucketKey, { count: nextCount, bucketStart });
  pruneLocalBuckets(bucketStart);

  if (nextCount > options.limit) {
    return {
      limited: true,
      retryAfterSeconds: retryAfterSecondsForWindow(now, options.windowMs)
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
};

const checkKvRateLimit = async (options: RateLimitOptions): Promise<RateLimitResult> => {
  const config = getKvConfig();
  if (!config) {
    return checkLocalRateLimit(options);
  }

  const now = Date.now();
  const bucketStart = Math.floor(now / options.windowMs) * options.windowMs;
  const bucketKey = `rl:${options.namespace}:${bucketStart}:${options.key}`;

  try {
    const incremented = await redisCommand<number>(config, ["INCR", bucketKey]);
    const count = Number(incremented);
    if (!Number.isFinite(count)) {
      throw new Error("KV returned non-numeric INCR result");
    }

    if (count === 1) {
      // Keep key around slightly longer than the window for cleanup safety.
      await redisCommand<number>(config, ["PEXPIRE", bucketKey, String(options.windowMs + 1000)]);
    }

    if (count > options.limit) {
      return {
        limited: true,
        retryAfterSeconds: retryAfterSecondsForWindow(now, options.windowMs)
      };
    }

    return { limited: false, retryAfterSeconds: 0 };
  } catch {
    // Fail safely with local limiter if KV is temporarily unavailable.
    return checkLocalRateLimit(options);
  }
};

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  return checkKvRateLimit(options);
}
