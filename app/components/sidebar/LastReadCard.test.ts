import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTimeAgo } from "./LastReadCard";

describe("getTimeAgo", () => {
    let realDateNow: () => number;

    beforeEach(() => {
        realDateNow = Date.now;
        Date.now = vi.fn(() => 1_700_000_000_000);
    });

    afterEach(() => {
        Date.now = realDateNow;
    });

    it("returns 'Just now' for < 60 seconds", () => {
        expect(getTimeAgo(Date.now() - 30_000)).toBe("Just now");
    });

    it("returns singular '1 min ago'", () => {
        expect(getTimeAgo(Date.now() - 60_000)).toBe("1 min ago");
    });

    it("returns plural '5 mins ago'", () => {
        expect(getTimeAgo(Date.now() - 300_000)).toBe("5 mins ago");
    });

    it("returns singular '1 hour ago'", () => {
        expect(getTimeAgo(Date.now() - 3_600_000)).toBe("1 hour ago");
    });

    it("returns plural '3 hours ago'", () => {
        expect(getTimeAgo(Date.now() - 10_800_000)).toBe("3 hours ago");
    });

    it("returns singular '1 day ago'", () => {
        expect(getTimeAgo(Date.now() - 86_400_000)).toBe("1 day ago");
    });

    it("returns plural '3 days ago'", () => {
        expect(getTimeAgo(Date.now() - 259_200_000)).toBe("3 days ago");
    });

    it("returns formatted date for > 7 days", () => {
        const result = getTimeAgo(Date.now() - 700_000_000);
        // Should be a date string, not a relative time
        expect(result).not.toContain("ago");
        expect(result).not.toBe("Just now");
    });
});
