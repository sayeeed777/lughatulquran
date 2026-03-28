import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../lib/constants";
import { getReciterBootstrapMode } from "../../lib/reciterPreferences";

const createStorage = (entries: Record<string, string>) => ({
  getItem: (key: string) => entries[key] ?? null
});

describe("getReciterBootstrapMode", () => {
  it("treats a saved reciter as authoritative", () => {
    expect(
      getReciterBootstrapMode(
        createStorage({ [STORAGE_KEYS.reciter]: JSON.stringify("alafasy") })
      )
    ).toBe("stored");
  });

  it("keeps returning users on the legacy path when no reciter is saved", () => {
    expect(
      getReciterBootstrapMode(
        createStorage({ [STORAGE_KEYS.lastRead]: JSON.stringify({ surah: 1, ayah: 1 }) })
      )
    ).toBe("returning-user");
  });

  it("counts study mode history as a returning-user signal", () => {
    expect(
      getReciterBootstrapMode(
        createStorage({ study_mode_seen: "1" })
      )
    ).toBe("returning-user");
  });

  it("uses the new default only for brand-new users", () => {
    expect(getReciterBootstrapMode(createStorage({}))).toBe("new-user");
  });
});
