"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../../hooks";
import { STORAGE_KEYS } from "../../lib/constants";

type SortedNote = {
  key: string;
  surah: number;
  ayah: number;
  value: string;
};

type SimpleQuickNote = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

type StudyQuickNotesSectionProps = {
  sortedNotes: SortedNote[];
  surahByNumber: Map<number, { englishName: string }>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onClosePanel: () => void;
  onOpenNote: (surah: number, ayah: number) => void;
};

const formatRelativeTime = (timestamp: number) => {
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (elapsedSeconds < 60) return "just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const isPlaceholderNoteTitle = (value: string) =>
  (value || "").trim().toLowerCase() === "untitled note";

const deriveNoteTitle = (title: string, body: string) => {
  const explicitTitle = (title || "").trim();
  if (explicitTitle && !isPlaceholderNoteTitle(explicitTitle)) {
    return explicitTitle;
  }
  const bodyLine = (body || "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find(Boolean);
  if (!bodyLine) {
    return "Note";
  }
  return bodyLine.length > 42 ? `${bodyLine.slice(0, 42).trim()}...` : bodyLine;
};

export default function StudyQuickNotesSection({
  sortedNotes,
  surahByNumber,
  onJumpToAyah,
  onClosePanel,
  onOpenNote
}: StudyQuickNotesSectionProps) {
  const [storedSimpleNotes, setStoredSimpleNotes] = useLocalStorage<SimpleQuickNote[]>(
    STORAGE_KEYS.quickNotes,
    []
  );
  const [activeSimpleNoteId, setActiveSimpleNoteId] = useState<string | null>(null);
  const [isCreatingSimpleNote, setIsCreatingSimpleNote] = useState(false);
  const [simpleNoteTitleDraft, setSimpleNoteTitleDraft] = useState("");
  const [simpleNoteBodyDraft, setSimpleNoteBodyDraft] = useState("");

  const simpleNotes = useMemo(() => {
    const source = Array.isArray(storedSimpleNotes) ? storedSimpleNotes : [];
    return source.reduce<SimpleQuickNote[]>((result, note) => {
      const nextBody = (note.body || "").trim();
      const nextTitleRaw = (note.title || "").trim();
      const nextTitle = isPlaceholderNoteTitle(nextTitleRaw) ? "" : nextTitleRaw;
      if (!nextTitle && !nextBody) {
        return result;
      }
      result.push({
        ...note,
        title: deriveNoteTitle(nextTitle, nextBody),
        body: nextBody
      });
      return result;
    }, []);
  }, [storedSimpleNotes]);
  const orderedSimpleNotes = useMemo(
    () => [...simpleNotes].sort((a, b) => b.updatedAt - a.updatedAt),
    [simpleNotes]
  );

  useEffect(() => {
    if (!Array.isArray(storedSimpleNotes)) return;
    const shouldSync =
      storedSimpleNotes.length !== simpleNotes.length ||
      storedSimpleNotes.some((note, index) => {
        const normalized = simpleNotes[index];
        if (!normalized) return true;
        return (
          note.id !== normalized.id ||
          note.title !== normalized.title ||
          (note.body || "").trim() !== normalized.body ||
          note.createdAt !== normalized.createdAt ||
          note.updatedAt !== normalized.updatedAt
        );
      });
    if (shouldSync) {
      setStoredSimpleNotes(simpleNotes);
    }
  }, [storedSimpleNotes, simpleNotes, setStoredSimpleNotes]);

  useEffect(() => {
    if (orderedSimpleNotes.length === 0) {
      if (activeSimpleNoteId !== null) {
        setActiveSimpleNoteId(null);
      }
      return;
    }
    if (activeSimpleNoteId && !orderedSimpleNotes.some((note) => note.id === activeSimpleNoteId)) {
      setActiveSimpleNoteId(orderedSimpleNotes[0]?.id || null);
    }
  }, [activeSimpleNoteId, orderedSimpleNotes]);

  const activeSimpleNote = useMemo(
    () => orderedSimpleNotes.find((note) => note.id === activeSimpleNoteId) || null,
    [orderedSimpleNotes, activeSimpleNoteId]
  );

  useEffect(() => {
    if (isCreatingSimpleNote) {
      return;
    }
    if (!activeSimpleNote) {
      setSimpleNoteTitleDraft("");
      setSimpleNoteBodyDraft("");
      return;
    }
    setSimpleNoteTitleDraft(activeSimpleNote.title || "");
    setSimpleNoteBodyDraft(activeSimpleNote.body || "");
  }, [activeSimpleNote, isCreatingSimpleNote]);

  const createSimpleNote = useCallback(() => {
    setIsCreatingSimpleNote(true);
    setActiveSimpleNoteId(null);
    setSimpleNoteTitleDraft("");
    setSimpleNoteBodyDraft("");
  }, []);

  const updateSimpleNote = useCallback(
    (noteId: string, patch: Partial<Pick<SimpleQuickNote, "title" | "body">>) => {
      setStoredSimpleNotes((prev) =>
        (Array.isArray(prev) ? prev : []).map((note) =>
          note.id === noteId
            ? {
                ...note,
                ...patch,
                updatedAt: Date.now()
              }
            : note
        )
      );
    },
    [setStoredSimpleNotes]
  );

  const saveActiveSimpleNote = useCallback(() => {
    const nextTitleRaw = (simpleNoteTitleDraft || "").trim();
    const nextBody = (simpleNoteBodyDraft || "").trim();
    if (!nextTitleRaw && !nextBody) return;
    const nextTitle = deriveNoteTitle(nextTitleRaw, nextBody);

    if (isCreatingSimpleNote) {
      const now = Date.now();
      const nextNote: SimpleQuickNote = {
        id: `qnote-${now}-${Math.random().toString(36).slice(2, 8)}`,
        title: nextTitle,
        body: nextBody,
        createdAt: now,
        updatedAt: now
      };
      setStoredSimpleNotes((prev) => [nextNote, ...(Array.isArray(prev) ? prev : [])]);
    } else if (activeSimpleNote) {
      updateSimpleNote(activeSimpleNote.id, {
        title: nextTitle,
        body: nextBody
      });
    }

    setIsCreatingSimpleNote(false);
    setActiveSimpleNoteId(null);
  }, [
    activeSimpleNote,
    isCreatingSimpleNote,
    simpleNoteTitleDraft,
    simpleNoteBodyDraft,
    setStoredSimpleNotes,
    updateSimpleNote
  ]);

  const deleteActiveSimpleNote = useCallback(() => {
    if (isCreatingSimpleNote || !activeSimpleNote) return;
    setStoredSimpleNotes((prev) =>
      (Array.isArray(prev) ? prev : []).filter((note) => note.id !== activeSimpleNote.id)
    );
    setActiveSimpleNoteId(null);
    setSimpleNoteTitleDraft("");
    setSimpleNoteBodyDraft("");
  }, [activeSimpleNote, isCreatingSimpleNote, setStoredSimpleNotes]);

  const quickNoteHasDraftChanges = isCreatingSimpleNote
    ? Boolean((simpleNoteTitleDraft || "").trim() || (simpleNoteBodyDraft || "").trim())
    : Boolean(
        activeSimpleNote &&
          (activeSimpleNote.title !== simpleNoteTitleDraft ||
            activeSimpleNote.body !== simpleNoteBodyDraft)
      );

  return (
    <div className="quick-panel-section">
      <div className="study-card quick-notes-card">
        <div className="quick-notes-head">
          <h4>Quick Notes</h4>
          <button className="quick-item-action" onClick={createSimpleNote} type="button">
            New note
          </button>
        </div>

        {orderedSimpleNotes.length > 0 || isCreatingSimpleNote ? (
          <div className="quick-notes-shell">
            {orderedSimpleNotes.length > 0 && (
              <div className="quick-note-tabs">
                {orderedSimpleNotes.map((note) => {
                  const title = deriveNoteTitle(note.title, note.body);
                  const isActive = !isCreatingSimpleNote && note.id === activeSimpleNote?.id;
                  return (
                    <button
                      key={note.id}
                      className={`quick-note-tab${isActive ? " active" : ""}`}
                      onClick={() => {
                        setIsCreatingSimpleNote(false);
                        setActiveSimpleNoteId(note.id);
                      }}
                      type="button"
                    >
                      <span className="quick-note-tab-title">{title}</span>
                      <span className="quick-note-tab-time">
                        {formatRelativeTime(note.updatedAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {(activeSimpleNote || isCreatingSimpleNote) && (
              <div className="quick-note-editor">
                <input
                  className="quick-note-title-input"
                  value={simpleNoteTitleDraft}
                  onChange={(event) => setSimpleNoteTitleDraft(event.target.value)}
                  placeholder="Title (optional)"
                />
                <textarea
                  className="quick-note-body-input"
                  value={simpleNoteBodyDraft}
                  onChange={(event) => setSimpleNoteBodyDraft(event.target.value)}
                  placeholder="Write your note..."
                  rows={6}
                />
                <div className="quick-note-editor-meta">
                  <span>
                    {isCreatingSimpleNote
                      ? "New note"
                      : quickNoteHasDraftChanges
                        ? "Unsaved changes"
                        : activeSimpleNote
                          ? `Updated ${formatRelativeTime(activeSimpleNote.updatedAt)}`
                          : ""}
                  </span>
                  <div className="quick-note-editor-actions">
                    {!isCreatingSimpleNote && activeSimpleNote && (
                      <button
                        className="quick-item-action danger"
                        onClick={deleteActiveSimpleNote}
                        type="button"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      className="quick-item-action save"
                      onClick={saveActiveSimpleNote}
                      type="button"
                      disabled={!quickNoteHasDraftChanges}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="quick-empty quick-notes-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <p>No quick notes yet</p>
            <span>Create one simple note like a phone notes app.</span>
            <button className="action-btn" onClick={createSimpleNote} type="button">
              Create first note
            </button>
          </div>
        )}
      </div>

      <div className="study-card notes-card">
        <h4>Ayah Notes</h4>
        {sortedNotes?.length > 0 ? (
          <ul className="quick-list">
            {sortedNotes.map((note) => {
              const name = surahByNumber?.get(note.surah)?.englishName || `Surah ${note.surah}`;
              const preview = note.value.length > 60 ? `${note.value.slice(0, 60)}...` : note.value;
              return (
                <li key={note.key} className="quick-list-item">
                  <div className="quick-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div className="quick-item-content">
                    <span className="quick-item-title">
                      {name} - Ayah {note.ayah}
                    </span>
                    <span className="quick-item-sub">{preview}</span>
                  </div>
                  <button
                    className="quick-item-action"
                    onClick={() => {
                      onOpenNote(note.surah, note.ayah);
                      onClosePanel();
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="quick-item-action"
                    onClick={() => {
                      onJumpToAyah(note.surah, note.ayah);
                      onOpenNote(note.surah, note.ayah);
                      onClosePanel();
                    }}
                    type="button"
                  >
                    Open
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="quick-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <p>No notes yet</p>
            <span>Tap the note icon on any ayah to add thoughts</span>
          </div>
        )}
      </div>
    </div>
  );
}
