"use client";

import type { ReactNode } from "react";
import type { QuickPanelTab } from "./StudyQuickPanelTypes";

type RailItem = {
  id: QuickPanelTab;
  label: string;
  icon: ReactNode;
};

const RAIL_ITEMS: RailItem[] = [
  {
    id: "study",
    label: "Study",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4h14a2 2 0 0 1 2 2v13" />
        <path d="M4 4v13a2 2 0 0 0 2 2h14" />
      </svg>
    )
  },
  {
    id: "tool",
    label: "Tool",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 6.5 17.5 3.5a2.121 2.121 0 1 1 3 3l-3.01 3.01" />
        <path d="M12.5 8.5 4 17v3h3l8.5-8.5" />
        <path d="M7 12H3" />
        <path d="M21 21h-4" />
        <path d="M14 14h-2" />
      </svg>
    )
  },
  {
    id: "tafsir",
    label: "Tafsir",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4h14a2 2 0 0 1 2 2v13" />
        <path d="M4 4v13a2 2 0 0 0 2 2h14" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    )
  },
  {
    id: "search",
    label: "Search",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    )
  },
  {
    id: "notes",
    label: "Notes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    )
  }
];

type StudyModeRailProps = {
  activeTab: QuickPanelTab;
  isOpen: boolean;
  onSelectTab: (tab: QuickPanelTab) => void;
};

export default function StudyModeRail({ activeTab, isOpen, onSelectTab }: StudyModeRailProps) {
  return (
    <div className="study-rail">
      {RAIL_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`study-rail-btn${activeTab === item.id && isOpen ? " active" : ""}`}
          onClick={() => onSelectTab(item.id)}
          title={item.label}
          type="button"
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
