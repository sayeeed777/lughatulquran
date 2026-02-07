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
});
