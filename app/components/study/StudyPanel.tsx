"use client";

import { ReadingPlan, BookmarkList, NoteList } from "../sidebar";
import { getTimeAgo } from "../sidebar/LastReadCard";
import { getLocalDateString } from "../../lib/utils";
import { useBookmarkContext, useQuranData, usePreferences, useActions } from "../../contexts";

type StudyPanelProps = {
  continueSession?: {
    surah: number;
    ayah: number;
    surahName: string;
    updatedAt: number;
  } | null;
  onContinueSession?: () => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export default function StudyPanel({
  continueSession,
  onContinueSession,
  isCollapsed = false,
  onToggleCollapsed
}: StudyPanelProps) {
  const { surahs, surahByNumber } = useQuranData();
  const { readingPlan, setReadingPlan } = usePreferences();
  const { planSummary, jumpToAyah: onJumpToAyah, formatRangeLabel } = useActions();
  const { sortedBookmarks, sortedNotes, toggleBookmark: onToggleBookmark, openNote: onOpenNote } = useBookmarkContext();
  const continueTimeAgo = continueSession ? getTimeAgo(continueSession.updatedAt) : "";

  return (
    <aside
      className={`panel study-panel${isCollapsed ? " is-collapsed" : ""}`}
      aria-label="Study sidebar"
    >
      <div className="study-panel-collapsed-content" aria-hidden={!isCollapsed}>
        <button
          type="button"
          className="study-panel-collapse-toggle"
          onClick={onToggleCollapsed}
          aria-label="Expand Study sidebar"
          title="Expand Study sidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="4" width="17" height="16" rx="3" />
            <path d="M9 4v16" />
          </svg>
        </button>
      </div>

      <div className="study-panel-expanded-content">
        <div className="panel-header study-panel-header">
          <div>
            <h2>Study</h2>
            <p className="meta">Plan, bookmarks, and notes</p>
          </div>
          <button
            type="button"
            className="study-panel-collapse-toggle"
            onClick={onToggleCollapsed}
            aria-label="Collapse Study sidebar"
            title="Collapse Study sidebar"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="4" width="17" height="16" rx="3" />
              <path d="M9 4v16" />
            </svg>
          </button>
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
      </div>
    </aside>
  );
}
