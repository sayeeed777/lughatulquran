/**
 * Components Barrel Export
 * 
 * Organized component structure:
 * - common/   → Shared UI primitives (Tooltip, ProgressBar, etc.)
 * - modals/   → Modal/overlay components
 * - reader/   → Main reading panel components
 * - study/    → Study mode components  
 * - sidebar/  → Left sidebar components
 * - skeletons/ → Loading state components
 */

// Common UI Components
export { Tooltip, ProgressBar, BackToTop, AudioPlayer, SectionErrorBoundary } from "./common";
export { SearchIcon, SunIcon, MoonIcon, SettingsIcon, ClockIcon, ThemeIcon } from "./common";

// Modal Components
export { SettingsModal, PrayerPanel, CompareModal, NoteModal, KeyboardShortcutsHelp } from "./modals";

// Reader Components
export { ReaderPanel, AyahCard, BismillahBanner } from "./reader";

// Study Mode Components
export { StudyModeView, StudyPanel } from "./study";

// Sidebar Components
export { SurahList, LastReadCard, BookmarkList, NoteList, ReadingPlan } from "./sidebar";

// Error Boundary (root level)
export { default as ErrorBoundary } from "./ErrorBoundary";

// Skeleton Components
export * from "./skeletons";
