import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useBookmarks, useNoteEditor } from "./useBookmarks";

describe("useBookmarks", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("starts with empty bookmarks and notes", () => {
        const { result } = renderHook(() => useBookmarks());
        expect(result.current.bookmarks).toEqual([]);
        expect(result.current.notes).toEqual({});
    });

    it("toggles a bookmark on and off", () => {
        const { result } = renderHook(() => useBookmarks());

        act(() => {
            result.current.toggleBookmark(2, 255);
        });
        expect(result.current.bookmarks).toContain("2:255");

        act(() => {
            result.current.toggleBookmark(2, 255);
        });
        expect(result.current.bookmarks).not.toContain("2:255");
    });

    it("sorts bookmarks by surah then ayah", () => {
        const { result } = renderHook(() => useBookmarks());

        act(() => {
            result.current.toggleBookmark(3, 10);
            result.current.toggleBookmark(1, 5);
            result.current.toggleBookmark(3, 2);
        });

        expect(result.current.sortedBookmarks).toEqual(["1:5", "3:2", "3:10"]);
    });
});

describe("useNoteEditor", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("opens, saves, and closes a note", () => {
        const { result: bookmarksResult } = renderHook(() => useBookmarks());
        const { result: editorResult } = renderHook(() =>
            useNoteEditor(bookmarksResult.current.notes, bookmarksResult.current.setNotes)
        );

        // Open note
        act(() => {
            editorResult.current.openNote(1, 1);
        });
        expect(editorResult.current.noteTarget).toEqual({
            surah: 1,
            ayah: 1,
            key: "1:1"
        });

        // Set draft and save
        act(() => {
            editorResult.current.setNoteDraft("Test note content");
        });
        act(() => {
            editorResult.current.saveNote();
        });
        expect(editorResult.current.noteTarget).toBeNull();
        expect(editorResult.current.noteDraft).toBe("");

        // Close without saving
        act(() => {
            editorResult.current.openNote(2, 3);
        });
        act(() => {
            editorResult.current.closeNote();
        });
        expect(editorResult.current.noteTarget).toBeNull();
    });
});
