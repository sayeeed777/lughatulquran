import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    clamp,
    pad,
    debounce,
    throttle,
    copyToClipboard,
    formatProgress,
    getDaysBetween,
    getLocalDateString,
    parseLocalDate
} from "./utils";

describe("clamp", () => {
    it("returns value when within range", () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it("clamps below minimum", () => {
        expect(clamp(-1, 0, 10)).toBe(0);
    });

    it("clamps above maximum", () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it("handles min === max", () => {
        expect(clamp(5, 3, 3)).toBe(3);
    });
});

describe("pad", () => {
    it("pads single digit to 3 chars by default", () => {
        expect(pad(5)).toBe("005");
    });

    it("pads to custom length", () => {
        expect(pad(5, 5)).toBe("00005");
    });

    it("does not truncate longer values", () => {
        expect(pad(1000, 3)).toBe("1000");
    });
});

describe("debounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("delays invocation until after the delay", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledOnce();
    });

    it("resets the timer on subsequent calls", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        vi.advanceTimersByTime(80);
        debounced();
        vi.advanceTimersByTime(80);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(20);
        expect(fn).toHaveBeenCalledOnce();
    });
});

describe("throttle", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("calls immediately on first invocation", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        expect(fn).toHaveBeenCalledOnce();
    });

    it("ignores subsequent calls within the limit", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled();
        expect(fn).toHaveBeenCalledOnce();
    });

    it("allows calls after the limit expires", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        vi.advanceTimersByTime(100);
        throttled();
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe("copyToClipboard", () => {
    it("returns true when clipboard API is available", async () => {
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
        });

        const result = await copyToClipboard("test");
        expect(result).toBe(true);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test");
    });

    it("uses execCommand fallback when clipboard API is unavailable", async () => {
        const execCommandMock = vi.fn().mockReturnValue(true);
        Object.defineProperty(document, "execCommand", {
            configurable: true,
            value: execCommandMock
        });
        Object.assign(navigator, { clipboard: undefined });
        const result = await copyToClipboard("test");
        expect(result).toBe(true);
        expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    it("returns false when no copy method is available", async () => {
        Object.defineProperty(document, "execCommand", {
            configurable: true,
            value: undefined
        });
        Object.assign(navigator, { clipboard: undefined });
        const result = await copyToClipboard("test");
        expect(result).toBe(false);
    });
});

describe("formatProgress", () => {
    it("computes correct percentage", () => {
        expect(formatProgress(25, 100)).toEqual({ current: 25, total: 100, percentage: 25 });
    });

    it("rounds percentage", () => {
        expect(formatProgress(1, 3)).toEqual({ current: 1, total: 3, percentage: 33 });
    });
});

describe("getDaysBetween", () => {
    it("computes correct number of days", () => {
        const a = new Date("2024-01-01").getTime();
        const b = new Date("2024-01-10").getTime();
        expect(getDaysBetween(a, b)).toBe(9);
    });

    it("returns 0 for same day", () => {
        const a = new Date("2024-01-01").getTime();
        expect(getDaysBetween(a, a)).toBe(0);
    });
});

describe("getLocalDateString", () => {
    it("returns a YYYY-MM-DD formatted string", () => {
        const result = getLocalDateString();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe("parseLocalDate", () => {
    it("parses a date string to midnight local time", () => {
        const date = parseLocalDate("2024-06-15");
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(5); // June = 5
        expect(date.getDate()).toBe(15);
    });
});
