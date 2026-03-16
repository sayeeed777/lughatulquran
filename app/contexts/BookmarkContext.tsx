"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Notes, NoteTarget } from "../lib/types";

type SortedNote = {
    key: string;
    surah: number;
    ayah: number;
    value: string;
};

type BookmarkContextValue = {
    bookmarks: string[];
    notes: Notes;
    toggleBookmark: (surah: number, ayah: number) => void;
    sortedBookmarks: string[];
    sortedNotes: SortedNote[];
    // Note editor
    noteTarget: NoteTarget | null;
    noteDraft: string;
    setNoteDraft: (value: string) => void;
    openNote: (surah: number, ayah: number) => void;
    saveNote: () => void;
    closeNote: () => void;
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

type BookmarkProviderProps = BookmarkContextValue & { children: ReactNode };

export function BookmarkProvider({ children, ...props }: BookmarkProviderProps) {
    const value = useMemo(() => ({
        bookmarks: props.bookmarks,
        notes: props.notes,
        toggleBookmark: props.toggleBookmark,
        sortedBookmarks: props.sortedBookmarks,
        sortedNotes: props.sortedNotes,
        noteTarget: props.noteTarget,
        noteDraft: props.noteDraft,
        setNoteDraft: props.setNoteDraft,
        openNote: props.openNote,
        saveNote: props.saveNote,
        closeNote: props.closeNote,
    }), [
        props.bookmarks, props.notes, props.toggleBookmark,
        props.sortedBookmarks, props.sortedNotes, props.noteTarget,
        props.noteDraft, props.setNoteDraft, props.openNote,
        props.saveNote, props.closeNote,
    ]);
    return (
        <BookmarkContext.Provider value={value}>
            {children}
        </BookmarkContext.Provider>
    );
}

export function useBookmarkContext(): BookmarkContextValue {
    const ctx = useContext(BookmarkContext);
    if (!ctx) {
        throw new Error("useBookmarkContext must be used within a <BookmarkProvider>");
    }
    return ctx;
}

export type { BookmarkContextValue, SortedNote };
