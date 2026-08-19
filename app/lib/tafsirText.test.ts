import { describe, expect, it } from "vitest";
import {
  cleanTafsirText,
  getTafsirParagraphDirection,
  splitTafsirParagraphs
} from "./tafsirText";

describe("tafsir text formatting", () => {
  it("preserves intentional line breaks while normalizing inline whitespace", () => {
    expect(cleanTafsirText("First   paragraph.\r\n  Second\tparagraph.\n\n\nThird."))
      .toBe("First paragraph.\nSecond paragraph.\n\nThird.");
  });

  it("repairs replacement characters without flattening paragraphs", () => {
    expect(cleanTafsirText("wor\uFFFDd\nNext\uFFFD paragraph"))
      .toBe("word\nNext paragraph");
  });

  it("returns clean paragraphs for semantic rendering", () => {
    expect(splitTafsirParagraphs("One.\n\nTwo.\nThree.")).toEqual([
      "One.",
      "Two.",
      "Three."
    ]);
  });

  it("keeps mixed Arabic and English commentary left-to-right", () => {
    expect(
      getTafsirParagraphDirection(
        "إِلَّا تَذْكِرَةً لِّمَن يَخْشَىٰ (Rather to remind those who fear.)",
        "ltr"
      )
    ).toBe("ltr");
  });

  it("keeps standalone Arabic quotations right-to-left", () => {
    expect(
      getTafsirParagraphDirection("إِلَّا تَذْكِرَةً لِّمَن يَخْشَىٰ", "ltr")
    ).toBe("rtl");
  });

  it("respects right-to-left Tafsir editions", () => {
    expect(getTafsirParagraphDirection("An embedded English phrase", "rtl")).toBe("rtl");
  });
});
