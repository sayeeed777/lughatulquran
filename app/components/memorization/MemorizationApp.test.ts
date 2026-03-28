import { describe, expect, it } from "vitest";
import { applyReciterToMemorizationDeck } from "./MemorizationApp";

describe("applyReciterToMemorizationDeck", () => {
  it("rewrites ayah recitation cards to the selected reciter", () => {
    const deck = applyReciterToMemorizationDeck(
      {
        deck: {
          scopeMode: "surah",
          scopeId: 1,
          scopeLabel: "Al-Fatihah",
          cardMode: "arabic-to-meaning",
          translationId: "en-haleem",
          totalCards: 1
        },
        cards: [
          {
            id: "arabic-to-meaning:1:1",
            verseKey: "1:1",
            surahNumber: 1,
            ayahNumber: 1,
            pageNumber: 1,
            scopeMode: "surah",
            scopeId: 1,
            scopeLabel: "Al-Fatihah",
            translationId: "en-haleem",
            cardMode: "arabic-to-meaning",
            arabic: "text",
            englishMeaning: "meaning",
            firstWords: "text",
            hint: "hint",
            audioUrl: "https://everyayah.com/data/Alafasy_64kbps/001001.mp3"
          }
        ]
      },
      "https://everyayah.com/data/Husary_64kbps"
    );

    expect(deck?.cards[0]?.audioUrl).toBe("https://everyayah.com/data/Husary_64kbps/001001.mp3");
  });

  it("preserves word-level audio cards", () => {
    const deck = applyReciterToMemorizationDeck(
      {
        deck: {
          scopeMode: "surah",
          scopeId: 1,
          scopeLabel: "Al-Fatihah",
          cardMode: "word-by-word-meaning",
          translationId: "wbw-quran-com",
          totalCards: 1
        },
        cards: [
          {
            id: "word-by-word-meaning:1:1:1",
            verseKey: "1:1",
            surahNumber: 1,
            ayahNumber: 1,
            pageNumber: 1,
            scopeMode: "surah",
            scopeId: 1,
            scopeLabel: "Al-Fatihah",
            translationId: "wbw-quran-com",
            cardMode: "word-by-word-meaning",
            arabic: "text",
            englishMeaning: "meaning",
            firstWords: "text",
            hint: "hint",
            audioUrl: "https://audio.qurancdn.com/wbw/001_001_001.mp3",
            wordArabic: "word",
            wordMeaning: "meaning"
          }
        ]
      },
      "https://everyayah.com/data/Husary_64kbps"
    );

    expect(deck?.cards[0]?.audioUrl).toBe("https://audio.qurancdn.com/wbw/001_001_001.mp3");
  });
});
