"use client";

import { ReadingPlan, BookmarkList, NoteList } from "../sidebar";
import { getTimeAgo } from "../sidebar/LastReadCard";
import { getLocalDateString } from "../../lib/utils";
import { useBookmarkContext, useQuranData, usePreferences } from "../../contexts";
import type { PlanSummary } from "../../hooks/home/useHomePlan";

type VerseRef = { surah: number; ayah: number } | null;

type StudyPanelProps = {
  planSummary: PlanSummary;
  onJumpToAyah: (surah: number, ayah: number) => void;
  formatRangeLabel: (start: VerseRef, end: VerseRef) => string;
  continueSession?: {
    surah: number;
    ayah: number;
    surahName: string;
    updatedAt: number;
  } | null;
  onContinueSession?: () => void;
};

export default function StudyPanel({
  planSummary,
  onJumpToAyah,
  formatRangeLabel,
  continueSession,
  onContinueSession
}: StudyPanelProps) {
  const { surahs, surahByNumber } = useQuranData();
  const { readingPlan, setReadingPlan } = usePreferences();
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
