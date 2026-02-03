"use client";

import ReadingPlan from "./ReadingPlan";
import BookmarkList from "./BookmarkList";
import NoteList from "./NoteList";

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
