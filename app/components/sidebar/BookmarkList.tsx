"use client";

type Surah = {
  englishName: string;
};

type BookmarkListProps = {
  sortedBookmarks: string[];
  surahByNumber: Map<number, Surah>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
};

const parseVerseKey = (key: string) => {
  const [surah, ayah] = key.split(":").map(Number);
  return { surah, ayah };
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
                  <button className="action-btn" onClick={() => onJumpToAyah(surah, ayah)}>
                    Open
                  </button>
                  <button className="action-btn" onClick={() => onToggleBookmark(surah, ayah)}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="status">No bookmarks yet.</p>
      )}
    </div>
  );
}
