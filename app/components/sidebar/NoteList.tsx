"use client";

import type { Surah } from "../../lib/types";

type NoteEntry = {
  key: string;
  surah: number;
  ayah: number;
  value: string;
};

type NoteListProps = {
  sortedNotes: NoteEntry[];
  surahByNumber: Map<number, Surah>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onOpenNote: (surah: number, ayah: number) => void;
};

export default function NoteList({
  sortedNotes,
  surahByNumber,
  onJumpToAyah,
  onOpenNote
}: NoteListProps) {
  return (
    <div className="study-section">
      <h3>Notes</h3>
      {sortedNotes.length ? (
        <ul className="study-list">
          {sortedNotes.map((note) => {
            const name = surahByNumber.get(note.surah)?.englishName || `Surah ${note.surah}`;
            const preview = note.value.length > 80 ? `${note.value.slice(0, 80)}...` : note.value;
            return (
              <li key={note.key} className="study-item">
                <div>
                  <p className="study-title">
                    {name} - Ayah {note.ayah}
                  </p>
                  <p className="study-sub">{preview}</p>
                </div>
                <div className="study-actions">
                  <button className="action-btn" onClick={() => onOpenNote(note.surah, note.ayah)}>
                    Edit
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => {
                      onJumpToAyah(note.surah, note.ayah);
                      onOpenNote(note.surah, note.ayah);
                    }}
                  >
                    Open
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="status">No notes yet.</p>
      )}
    </div>
  );
}
