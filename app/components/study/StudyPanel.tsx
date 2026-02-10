"use client";

import type { ReadingPlan as ReadingPlanState, Surah } from "../../lib/types";
import { ReadingPlan, BookmarkList, NoteList } from "../sidebar";
import { useBookmarkContext } from "../../contexts";

type StudyPanelProps = {
  surahs: Surah[];
  surahByNumber: Map<number, Surah>;
  readingPlan: ReadingPlanState;
  setReadingPlan: (value: ReadingPlanState | ((prev: ReadingPlanState) => ReadingPlanState)) => void;
  planSummary: any;
  onJumpToAyah: (surah: number, ayah: number) => void;
  formatRangeLabel: (start: any, end: any) => string;
  getLocalDateString: () => string;
  continueSession?: {
    surah: number;
    ayah: number;
    surahName: string;
    updatedAt: number;
  } | null;
  onContinueSession?: () => void;
};

export default function StudyPanel({
  surahs,
  surahByNumber,
  readingPlan,
  setReadingPlan,
  planSummary,
  onJumpToAyah,
  formatRangeLabel,
  getLocalDateString,
  continueSession,
  onContinueSession
}: StudyPanelProps) {
  const { sortedBookmarks, sortedNotes, toggleBookmark: onToggleBookmark, openNote: onOpenNote } = useBookmarkContext();
  const continueTimeAgo = continueSession ? getTimeAgo(continueSession.updatedAt) : "";

  return (
    <aside className="panel study-panel">
      <div className="panel-header">
        <h2>Study</h2>
        <p className="meta">Plan, bookmarks, and notes</p>
      </div>

      {continueSession && onContinueSession && (
        <div className="study-section study-resume-section">
          <h3>Continue</h3>
          <p className="study-resume-location">
            {continueSession.surahName} · Ayah {continueSession.ayah}
          </p>
          <p className="study-resume-time">{continueTimeAgo}</p>
          <button className="action-btn" onClick={onContinueSession}>
            Continue where you left off
          </button>
        </div>
      )}

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

function getTimeAgo(timestamp: number) {
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} min ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
