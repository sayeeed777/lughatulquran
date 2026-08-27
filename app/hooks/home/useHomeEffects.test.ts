import { describe, expect, it } from "vitest";
import {
  buildReaderUrl,
  resolveReaderUrlState,
  shouldStopStudyMemorization
} from "./useHomeEffects";

const surahs = [
  { number: 1, numberOfAyahs: 7 },
  { number: 2, numberOfAyahs: 286 }
];

describe("reader URL state", () => {
  it("lets an explicit Surah link override Page and Juz state", () => {
    expect(resolveReaderUrlState("?page=219&juz=5&surah=2&ayah=4", "", surahs)).toEqual({
      mode: "surah",
      surah: 2,
      ayah: 4
    });
  });

  it("supports direct Page and Juz links", () => {
    expect(resolveReaderUrlState("?page=219", "", surahs)).toEqual({ mode: "page", value: 219 });
    expect(resolveReaderUrlState("?juz=5", "", surahs)).toEqual({ mode: "juz", value: 5 });
  });

  it("uses a valid ayah hash and ignores out-of-range ayahs", () => {
    expect(resolveReaderUrlState("?surah=1", "#ayah-7", surahs)).toEqual({
      mode: "surah",
      surah: 1,
      ayah: 7
    });
    expect(resolveReaderUrlState("?surah=1&ayah=8", "", surahs)).toEqual({
      mode: "surah",
      surah: 1,
      ayah: null
    });
  });

  it("serializes one reader scope while preserving unrelated app state", () => {
    const pageUrl = buildReaderUrl({
      currentUrl: "https://openfurqan.com/?surah=2&ayah=4&mode=study#ayah-4",
      readerScopeMode: "page",
      readerJuzNumber: 1,
      readerPageNumber: 219,
      selectedSurahNumber: 2,
      focusedAyahNumber: 4
    });
    expect(pageUrl.toString()).toBe("https://openfurqan.com/?mode=study&page=219");

    const surahUrl = buildReaderUrl({
      currentUrl: pageUrl.toString(),
      readerScopeMode: "surah",
      readerJuzNumber: 1,
      readerPageNumber: 219,
      selectedSurahNumber: 2,
      focusedAyahNumber: 4
    });
    expect(surahUrl.toString()).toBe("https://openfurqan.com/?mode=study&surah=2&ayah=4");
  });
});

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
