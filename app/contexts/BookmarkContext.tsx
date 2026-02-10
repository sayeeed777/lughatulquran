"use client";

import { createContext, useContext } from "react";
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

export function BookmarkProvider({ children, ...value }: BookmarkProviderProps) {
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
