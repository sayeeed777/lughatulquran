"use client";

import StudyQuickNotesSection from "./StudyQuickNotesSection";
import StudyQuickPanelSearchTab from "./StudyQuickPanelSearchTab";
import StudyQuickPanelStudyTab from "./StudyQuickPanelStudyTab";
import StudyQuickPanelTafsirTab from "./StudyQuickPanelTafsirTab";
import StudyQuickPanelToolTab from "./StudyQuickPanelToolTab";
import type { StudyQuickPanelContentProps } from "./StudyQuickPanelTypes";

export default function StudyQuickPanelContent(props: StudyQuickPanelContentProps) {
  if (props.tab === "study") {
    return <StudyQuickPanelStudyTab {...props} />;
  }

  if (props.tab === "tool") {
    return <StudyQuickPanelToolTab {...props} />;
  }

  if (props.tab === "tafsir") {
    return <StudyQuickPanelTafsirTab {...props} />;
  }

  if (props.tab === "search") {
    return <StudyQuickPanelSearchTab {...props} />;
  }

  return (
    <StudyQuickNotesSection
      sortedNotes={props.sortedNotes}
      surahByNumber={props.surahByNumber}
      onJumpToAyah={props.onJumpToAyah}
      onClosePanel={props.onClosePanel}
      onOpenNote={props.onOpenNote}
    />
  );
}

export type { QuickPanelTab, StudyQuickPanelContentProps } from "./StudyQuickPanelTypes";
