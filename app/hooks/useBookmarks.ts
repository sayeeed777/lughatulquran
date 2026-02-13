"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./common";
import { STORAGE_KEYS } from "../lib/constants";
import { verseKey, parseVerseKey } from "../lib/utils";
import type { Bookmark, Notes, NoteTarget, SetState } from "../lib/types";

/**
 * Hook for managing bookmarks and notes
 * Extracted from page.js to improve code organization
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage(
    STORAGE_KEYS.bookmarks,
    [] as Bookmark[]
  ) as [Bookmark[], SetState<Bookmark[]>, boolean];
  const [notes, setNotes] = useLocalStorage(
    STORAGE_KEYS.notes,
    {} as Notes
  ) as [Notes, SetState<Notes>, boolean];

  const toggleBookmark = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      const key = verseKey(surahNumber, ayahNumber);
      setBookmarks((prev) =>
        prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
      );
    },
    [setBookmarks]
  );

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      const aP = parseVerseKey(a);
      const bP = parseVerseKey(b);
      return aP.surah - bP.surah || aP.ayah - bP.ayah;
    });
  }, [bookmarks]);

  const sortedNotes = useMemo(() => {
    return Object.entries(notes)
      .map(([key, value]) => {
        const { surah, ayah } = parseVerseKey(key);
        return { key, surah, ayah, value };
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
export function useNoteEditor(notes: Notes, setNotes: SetState<Notes>) {
  const [noteTarget, setNoteTarget] = useLocalStorage(
    STORAGE_KEYS.noteTarget,
    null as NoteTarget | null
  ) as [NoteTarget | null, SetState<NoteTarget | null>, boolean];
  const [noteDraft, setNoteDraft] = useLocalStorage(
    STORAGE_KEYS.noteDraft,
    ""
  ) as [string, SetState<string>, boolean];

  const openNote = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      const key = verseKey(surahNumber, ayahNumber);
      setNoteTarget({ surah: surahNumber, ayah: ayahNumber, key });
      setNoteDraft(notes[key] || "");
    },
    [notes, setNoteTarget, setNoteDraft]
  );

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
