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

  const cancelEditing = useCallback(() => {
    setIsCreatingSimpleNote(false);
    setActiveSimpleNoteId(null);
    setSimpleNoteTitleDraft("");
    setSimpleNoteBodyDraft("");
  }, []);

  const quickNoteHasDraftChanges = isCreatingSimpleNote
    ? Boolean((simpleNoteTitleDraft || "").trim() || (simpleNoteBodyDraft || "").trim())
    : Boolean(
        activeSimpleNote &&
          (activeSimpleNote.title !== simpleNoteTitleDraft ||
            activeSimpleNote.body !== simpleNoteBodyDraft)
      );

  const isEditing = activeSimpleNote || isCreatingSimpleNote;

  return (
    <div className="quick-panel-section notes-panel-redesign">
      {/* ── Quick Notes Section ── */}
      <div className="notes-section">
        <div className="notes-section-header">
          <span className="notes-section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Quick Notes
          </span>
          {!isEditing && (
            <button className="notes-section-action notes-new-btn" onClick={createSimpleNote} type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New
            </button>
          )}
        </div>

        {/* Editor (create or edit) */}
        {isEditing && (
          <div className="notes-editor">
            <input
              className="notes-editor-title"
              value={simpleNoteTitleDraft}
              onChange={(event) => setSimpleNoteTitleDraft(event.target.value)}
              placeholder="Title (optional)"
              autoFocus
            />
            <textarea
              className="notes-editor-body"
              value={simpleNoteBodyDraft}
              onChange={(event) => setSimpleNoteBodyDraft(event.target.value)}
              placeholder="Write your note..."
              rows={6}
            />
            <div className="notes-editor-footer">
              <span className="notes-editor-status">
                {isCreatingSimpleNote
                  ? "New note"
                  : quickNoteHasDraftChanges
                    ? "Unsaved changes"
                    : activeSimpleNote
                      ? `Updated ${formatRelativeTime(activeSimpleNote.updatedAt)}`
                      : ""}
              </span>
              <div className="notes-editor-actions">
                {!isCreatingSimpleNote && activeSimpleNote && (
                  <button
                    className="notes-btn notes-btn--danger"
                    onClick={deleteActiveSimpleNote}
                    type="button"
                  >
                    Delete
                  </button>
                )}
                <button
                  className="notes-btn notes-btn--ghost"
                  onClick={cancelEditing}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="notes-btn notes-btn--primary"
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

        {/* Note list */}
        {!isEditing && orderedSimpleNotes.length > 0 && (
          <div className="notes-list">
            {orderedSimpleNotes.map((note) => {
              const title = deriveNoteTitle(note.title, note.body);
              return (
                <button
                  key={note.id}
                  className="notes-list-item"
                  onClick={() => {
                    setIsCreatingSimpleNote(false);
                    setActiveSimpleNoteId(note.id);
                  }}
                  type="button"
                >
                  <div className="notes-list-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="notes-list-item-content">
                    <span className="notes-list-item-title">{title}</span>
                    <span className="notes-list-item-time">{formatRelativeTime(note.updatedAt)}</span>
                  </div>
                  <svg className="notes-list-item-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isEditing && orderedSimpleNotes.length === 0 && (
          <div className="notes-empty">
            <div className="notes-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <p className="notes-empty-title">No quick notes yet</p>
            <span className="notes-empty-desc">Jot down thoughts, reflections, or reminders</span>
            <button className="notes-btn notes-btn--primary notes-create-btn" onClick={createSimpleNote} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create first note
            </button>
          </div>
        )}
      </div>

      {/* ── Ayah Notes Section ── */}
      <div className="notes-section">
        <div className="notes-section-header">
          <span className="notes-section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            Ayah Notes
          </span>
          {sortedNotes?.length > 0 && (
            <span className="notes-count-badge">{sortedNotes.length}</span>
          )}
        </div>

        {sortedNotes?.length > 0 ? (
          <div className="notes-list">
            {sortedNotes.map((note) => {
              const name = surahByNumber?.get(note.surah)?.englishName || `Surah ${note.surah}`;
              const preview = note.value.length > 60 ? `${note.value.slice(0, 60)}...` : note.value;
              return (
                <div key={note.key} className="notes-ayah-item">
                  <button
                    className="notes-ayah-item-main"
                    onClick={() => {
                      onJumpToAyah(note.surah, note.ayah);
                      onOpenNote(note.surah, note.ayah);
                      onClosePanel();
                    }}
                    type="button"
                  >
                    <div className="notes-ayah-ref">
                      <span className="notes-ayah-ref-num">{note.surah}:{note.ayah}</span>
                    </div>
                    <div className="notes-ayah-item-content">
                      <span className="notes-ayah-name">{name} - Ayah {note.ayah}</span>
                      <span className="notes-ayah-preview">{preview}</span>
                    </div>
                  </button>
                  <button
                    className="notes-btn notes-btn--small"
                    onClick={() => {
                      onOpenNote(note.surah, note.ayah);
                      onClosePanel();
                    }}
                    type="button"
                    aria-label="Edit note"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="notes-empty notes-empty--compact">
            <div className="notes-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="notes-empty-title">No ayah notes yet</p>
            <span className="notes-empty-desc">Tap the note icon on any ayah to add your thoughts</span>
          </div>
        )}
      </div>
    </div>
  );
}
