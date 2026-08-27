import { describe, it, expect, vi } from "vitest";

vi.mock("./telemetry", () => ({ reportError: vi.fn() }));

import { fetchJSON, clearApiCache } from "./apiClient";

describe("apiClient.fetchJSON", () => {
  it("caches responses within TTL", async () => {
    clearApiCache();
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    });

    await fetchJSON("/api/test", { ttl: 1000, fetcher });
    await fetchJSON("/api/test", { ttl: 1000, fetcher });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retries on failure", async () => {
    clearApiCache();
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true })
      });

    const result = await fetchJSON("/api/retry", { retries: 1, fetcher });
    expect(result).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("throws on non-ok response", async () => {
    clearApiCache();
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "bad" })
    });

    await expect(fetchJSON("/api/error", { fetcher })).rejects.toThrow("bad");
  });

  it("does not let one abortable consumer cancel another", async () => {
    clearApiCache();
    let requestCount = 0;
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestCount += 1;
      if (requestCount === 1) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ request: requestCount })
      } as Response);
    });
    const firstController = new AbortController();
    const secondController = new AbortController();

    const firstRequest = fetchJSON("/api/shared", {
      cacheKey: "shared",
      fetcher,
      signal: firstController.signal
    });
    const secondRequest = fetchJSON<{ request: number }>("/api/shared", {
      cacheKey: "shared",
      fetcher,
      signal: secondController.signal
    });

    firstController.abort();

    await expect(firstRequest).rejects.toMatchObject({ name: "AbortError" });
    await expect(secondRequest).resolves.toEqual({ request: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
