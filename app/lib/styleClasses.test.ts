import { describe, it, expect } from "vitest";
import {
    getArabicScaleClass,
    getTranslationScaleClass,
    getArabicFontClass
} from "./styleClasses";

describe("getArabicScaleClass", () => {
    it("returns correct class for normal value", () => {
        expect(getArabicScaleClass(1)).toBe("arabic-scale-100");
    });

    it("clamps values below minimum", () => {
        expect(getArabicScaleClass(0.3)).toBe("arabic-scale-60");
    });

    it("clamps values above maximum", () => {
        expect(getArabicScaleClass(5)).toBe("arabic-scale-200");
    });

    it("quantizes to nearest 5% step", () => {
        expect(getArabicScaleClass(1.12)).toBe("arabic-scale-110");
        expect(getArabicScaleClass(1.13)).toBe("arabic-scale-115");
    });

    it("handles NaN by falling back to 100", () => {
        expect(getArabicScaleClass(NaN)).toBe("arabic-scale-100");
    });
});

describe("getTranslationScaleClass", () => {
    it("returns correct class for normal value", () => {
        expect(getTranslationScaleClass(1)).toBe("translation-scale-100");
    });

    it("clamps below minimum", () => {
        expect(getTranslationScaleClass(0.1)).toBe("translation-scale-70");
    });

    it("clamps above maximum", () => {
        expect(getTranslationScaleClass(3)).toBe("translation-scale-160");
    });
});

describe("getArabicFontClass", () => {
    it("returns class for valid font ID", () => {
        expect(getArabicFontClass("scheherazade-new")).toBe("arabic-font-scheherazade-new");
    });

    it("returns default class for empty string", () => {
        expect(getArabicFontClass("")).toBe("arabic-font-scheherazade-new");
    });

    it("sanitizes special characters in font ID", () => {
        expect(getArabicFontClass("foo@bar!baz")).toBe("arabic-font-foobarbaz");
    });

    it("strips leading/trailing hyphens after sanitization", () => {
        expect(getArabicFontClass("--test--")).toBe("arabic-font-test");
    });
});
