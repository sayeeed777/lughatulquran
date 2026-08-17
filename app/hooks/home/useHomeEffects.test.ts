import { describe, expect, it } from "vitest";
import { shouldStopStudyMemorization } from "./useHomeEffects";

describe("shouldStopStudyMemorization", () => {
  it("preserves Reader Mode ayah repeat", () => {
    expect(shouldStopStudyMemorization({
      readingMode: false,
      readerRepeatActive: true,
      memorizeActive: true
    })).toBe(false);
  });

  it("stops Study Mode memorization after leaving Study Mode", () => {
    expect(shouldStopStudyMemorization({
      readingMode: false,
      readerRepeatActive: false,
      memorizeActive: true
    })).toBe(true);
  });

  it("keeps memorization active while Study Mode is open", () => {
    expect(shouldStopStudyMemorization({
      readingMode: true,
      readerRepeatActive: false,
      memorizeActive: true
    })).toBe(false);
  });
});
