"use client";

import type { Surah } from "../../lib/types";
import { parseVerseKey } from "../../lib/utils";

type BookmarkListProps = {
  sortedBookmarks: string[];
  surahByNumber: Map<number, Surah>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
};

export default function BookmarkList({
  sortedBookmarks,
  surahByNumber,
  onJumpToAyah,
  onToggleBookmark
}: BookmarkListProps) {
  return (
    <div className="study-section">
      <h3>Bookmarks</h3>
      {sortedBookmarks.length ? (
        <ul className="study-list">
          {sortedBookmarks.map((key) => {
            const { surah, ayah } = parseVerseKey(key);
            const name = surahByNumber.get(surah)?.englishName || `Surah ${surah}`;
            return (
              <li key={key} className="study-item">
                <div>
                  <p className="study-title">{name}</p>
                  <p className="study-sub">Ayah {ayah}</p>
                </div>
                <div className="study-actions">
                  <button className="action-btn action-btn--primary" onClick={() => onJumpToAyah(surah, ayah)}>
                    Open
                  </button>
                  <button className="action-btn action-btn--danger" onClick={() => onToggleBookmark(surah, ayah)}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">&#x1F516;</span>
          <p className="empty-state-text">No bookmarks yet. Tap the bookmark icon on any ayah to save it here.</p>
        </div>
      )}
    </div>
  );
}
