import { describe, it, expect } from "vitest";
import { verseKey, parseVerseKey, getAudioUrl } from "./utils";

describe("utils", () => {
  it("builds and parses verse keys", () => {
    const key = verseKey(2, 255);
    expect(key).toBe("2:255");
    expect(parseVerseKey(key)).toEqual({ surah: 2, ayah: 255 });
  });

  it("builds audio URLs with zero padding", () => {
    const url = getAudioUrl("https://example.com", 2, 5);
    expect(url).toBe("https://example.com/002005.mp3");
  });
});
