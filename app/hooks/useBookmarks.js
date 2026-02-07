"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./common";
import { STORAGE_KEYS } from "../lib/constants";
import { verseKey, parseVerseKey } from "../lib/utils";

/**
 * Hook for managing bookmarks and notes
 * Extracted from page.js to improve code organization
 */
export function useBookmarks() {
    const [bookmarks, setBookmarks] = useLocalStorage(STORAGE_KEYS.bookmarks, []);
    const [notes, setNotes] = useLocalStorage(STORAGE_KEYS.notes, {});

    const toggleBookmark = useCallback((surahNumber, ayahNumber) => {
        const key = verseKey(surahNumber, ayahNumber);
        setBookmarks((prev) =>
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
        );
    }, [setBookmarks]);

    const sortedBookmarks = useMemo(() => {
        return [...bookmarks].sort((a, b) => {
            const aP = parseVerseKey(a);
            const bP = parseVerseKey(b);
            return aP.surah - bP.surah || aP.ayah - bP.ayah;
        });
    }, [bookmarks]);

    const sortedNotes = useMemo(() => {
        return Object.entries(notes)
            .map(([key, text]) => {
                const { surah, ayah } = parseVerseKey(key);
                return { key, surah, ayah, text };
            })
            .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
    }, [notes]);

    return {
        bookmarks,
        notes,
        setNotes,
        toggleBookmark,
        sortedBookmarks,
        sortedNotes
    };
}

/**
 * Hook for managing note editing state
 */
export function useNoteEditor(notes, setNotes) {
    const [noteTarget, setNoteTarget] = useLocalStorage("quran_note_target", null);
    const [noteDraft, setNoteDraft] = useLocalStorage("quran_note_draft", "");

    const openNote = useCallback((surahNumber, ayahNumber) => {
        const key = verseKey(surahNumber, ayahNumber);
        setNoteTarget({ surah: surahNumber, ayah: ayahNumber, key });
        setNoteDraft(notes[key] || "");
    }, [notes, setNoteTarget, setNoteDraft]);

    const saveNote = useCallback(() => {
        if (!noteTarget) return;
        const trimmed = noteDraft.trim();
        setNotes((prev) => {
            const next = { ...prev };
            if (trimmed) next[noteTarget.key] = trimmed;
            else delete next[noteTarget.key];
            return next;
        });
        setNoteTarget(null);
        setNoteDraft("");
    }, [noteTarget, noteDraft, setNotes, setNoteTarget, setNoteDraft]);

    const closeNote = useCallback(() => {
        setNoteTarget(null);
        setNoteDraft("");
    }, [setNoteTarget, setNoteDraft]);

    return {
        noteTarget,
        noteDraft,
        setNoteDraft,
        openNote,
        saveNote,
        closeNote
    };
}
