"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Surah } from "../../lib/types";

type NoteTarget = {
  surah: number;
  ayah: number;
  key: string;
} | null;

type NoteModalProps = {
  noteTarget: NoteTarget;
  noteDraft: string;
  setNoteDraft: Dispatch<SetStateAction<string>>;
  surahByNumber: Map<number, Surah>;
  onClose: () => void;
  onSave: () => void;
};

export default function NoteModal({
  noteTarget,
  noteDraft,
  setNoteDraft,
  surahByNumber,
  onClose,
  onSave
}: NoteModalProps) {
  if (!noteTarget) {
    return null;
  }

  return (
    <div className="note-panel" role="dialog" aria-modal="true">
      <div className="compare-header">
        <div>
          <p className="eyebrow">Notes</p>
          <h3>
            {surahByNumber.get(noteTarget.surah)?.englishName ||
              `Surah ${noteTarget.surah}`} - Ayah {noteTarget.ayah}
          </h3>
        </div>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="note-body">
        <textarea
          value={noteDraft || ""}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="Write your reflection or note here..."
          rows={6}
        />
        <div className="note-actions">
          <button className="action-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="action-btn saved" onClick={onSave}>
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}
