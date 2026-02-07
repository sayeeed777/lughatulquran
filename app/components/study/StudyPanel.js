"use client";

import { ReadingPlan, BookmarkList, NoteList } from "../sidebar";

/**
 * @param {{
 *  surahs: any[],
 *  surahByNumber: Map<number, any>,
 *  readingPlan: any,
 *  setReadingPlan: (value: any) => void,
 *  planSummary: any,
 *  sortedBookmarks: any[],
 *  sortedNotes: any[],
 *  onJumpToAyah: (surah: number, ayah: number) => void,
 *  onToggleBookmark: (surah: number, ayah: number) => void,
 *  onOpenNote: (surah: number, ayah: number) => void,
 *  formatRangeLabel: (start: any, end: any) => string,
 *  getLocalDateString: () => string,
 *  lastRead?: any
 * }} props
 */
export default function StudyPanel({
  surahs,
  surahByNumber,
  readingPlan,
  setReadingPlan,
  planSummary,
  sortedBookmarks,
  sortedNotes,
  onJumpToAyah,
  onToggleBookmark,
  onOpenNote,
  formatRangeLabel,
  getLocalDateString
}) {
  return (
    <aside className="panel study-panel">
      <div className="panel-header">
        <h2>Study</h2>
        <p className="meta">Plan, bookmarks, and notes</p>
      </div>

      <ReadingPlan
        surahs={surahs}
        surahByNumber={surahByNumber}
        readingPlan={readingPlan}
        setReadingPlan={setReadingPlan}
        planSummary={planSummary}
        onJumpToAyah={onJumpToAyah}
        formatRangeLabel={formatRangeLabel}
        getLocalDateString={getLocalDateString}
      />

      <BookmarkList
        sortedBookmarks={sortedBookmarks}
        surahByNumber={surahByNumber}
        onJumpToAyah={onJumpToAyah}
        onToggleBookmark={onToggleBookmark}
      />

      <NoteList
        sortedNotes={sortedNotes}
        surahByNumber={surahByNumber}
        onJumpToAyah={onJumpToAyah}
        onOpenNote={onOpenNote}
      />
    </aside>
  );
}
