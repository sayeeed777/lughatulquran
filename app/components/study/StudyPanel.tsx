"use client";

import type { ReadingPlan as ReadingPlanState, Surah } from "../../lib/types";
import { ReadingPlan, BookmarkList, NoteList } from "../sidebar";

type StudyPanelProps = {
  surahs: Surah[];
  surahByNumber: Map<number, Surah>;
  readingPlan: ReadingPlanState;
  setReadingPlan: (value: ReadingPlanState | ((prev: ReadingPlanState) => ReadingPlanState)) => void;
  planSummary: any;
  sortedBookmarks: string[];
  sortedNotes: Array<{ key: string; surah: number; ayah: number; value: string }>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onToggleBookmark: (surah: number, ayah: number) => void;
  onOpenNote: (surah: number, ayah: number) => void;
  formatRangeLabel: (start: any, end: any) => string;
  getLocalDateString: () => string;
  lastRead?: any;
};

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
}: StudyPanelProps) {
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
