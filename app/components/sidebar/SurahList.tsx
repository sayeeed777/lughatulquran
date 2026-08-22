"use client";

import { useEffect, useRef, useState } from "react";
import { SurahListSkeleton } from "../skeletons";
import { InlineError, SettingsIcon, ThemeChooser } from "../common";
import { useQuranData, useUIState, useActions } from "../../contexts";

type SurahListProps = {
  onOpenPrayer?: () => void;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const JUZ_STARTS: Record<number, string> = {
  1: "Al-Fatihah 1:1",
  2: "Al-Baqarah 2:142",
  3: "Al-Baqarah 2:253",
  4: "Ali 'Imran 3:93",
  5: "An-Nisa 4:24",
  6: "An-Nisa 4:148",
  7: "Al-Ma'idah 5:82",
  8: "Al-An'am 6:111",
  9: "Al-A'raf 7:88",
  10: "Al-Anfal 8:41",
  11: "At-Tawbah 9:93",
  12: "Hud 11:6",
  13: "Yusuf 12:53",
  14: "Al-Hijr 15:1",
  15: "Al-Isra 17:1",
  16: "Al-Kahf 18:75",
  17: "Al-Anbiya 21:1",
  18: "Al-Mu'minun 23:1",
  19: "Al-Furqan 25:21",
  20: "An-Naml 27:56",
  21: "Al-Ankabut 29:46",
  22: "Al-Ahzab 33:31",
  23: "Ya-Sin 36:28",
  24: "Az-Zumar 39:32",
  25: "Fussilat 41:47",
  26: "Al-Ahqaf 46:1",
  27: "Adh-Dhariyat 51:31",
  28: "Al-Mujadila 58:1",
  29: "Al-Mulk 67:1",
  30: "An-Naba 78:1",
};

function ScopeModeSwitcher() {
  const { readerScopeMode, setReaderScopeMode } = useUIState();

  return (
    <div className="scope-mode-switcher">
      <button
        className={`scope-mode-btn${readerScopeMode === "surah" ? " active" : ""}`}
        onClick={() => setReaderScopeMode("surah")}
        type="button"
      >
        Surah
      </button>
      <button
        className={`scope-mode-btn${readerScopeMode === "juz" ? " active" : ""}`}
        onClick={() => setReaderScopeMode("juz")}
        type="button"
      >
        Juz
      </button>
      <button
        className={`scope-mode-btn${readerScopeMode === "page" ? " active" : ""}`}
        onClick={() => setReaderScopeMode("page")}
        type="button"
      >
        Page
      </button>
    </div>
  );
}

function JuzList() {
  const { readerJuzNumber } = useUIState();
  const { handleSelectJuz } = useActions();

  return (
    <ul className="surah-list">
      {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
        <li key={juz}>
          <button
            className={`surah-item${readerJuzNumber === juz ? " active" : ""}`}
            onClick={() => handleSelectJuz(juz)}
          >
            <span className="surah-number">{juz}</span>
            <span className="surah-names">
              <span className="surah-english">Juz {juz}</span>
              <span className="surah-translation">{JUZ_STARTS[juz] || ""}</span>
            </span>
            <span className="surah-arabic" lang="ar" dir="rtl">
              {`\u0627\u0644\u062C\u0632\u0621 ${juz.toLocaleString("ar-SA")}`}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function PageSelector() {
  const { readerPageNumber } = useUIState();
  const { handleSelectPage } = useActions();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const active = grid.querySelector(".page-grid-btn.active") as HTMLElement | null;
    if (!active) return;
    // Scroll active button into view within the grid
    const gridTop = grid.scrollTop;
    const gridHeight = grid.clientHeight;
    const btnTop = active.offsetTop - grid.offsetTop;
    const btnHeight = active.offsetHeight;
    if (btnTop < gridTop || btnTop + btnHeight > gridTop + gridHeight) {
      grid.scrollTop = btnTop - gridHeight / 2 + btnHeight / 2;
    }
  }, [readerPageNumber]);

  return (
    <div className="page-selector">
      <div className="page-nav-row">
        <button
          className="page-nav-btn"
          onClick={() => handleSelectPage(Math.max(1, readerPageNumber - 1))}
          disabled={readerPageNumber <= 1}
          aria-label="Previous page"
          type="button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="page-nav-center">
          <label className="page-select-wrap">
            <select
              className="page-select"
              value={readerPageNumber}
              onChange={(e) => handleSelectPage(Number(e.target.value))}
            >
              {Array.from({ length: 604 }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  Page {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="page-nav-btn"
          onClick={() => handleSelectPage(Math.min(604, readerPageNumber + 1))}
          disabled={readerPageNumber >= 604}
          aria-label="Next page"
          type="button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="page-grid" ref={gridRef}>
        {Array.from({ length: 604 }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`page-grid-btn${p === readerPageNumber ? " active" : ""}`}
            onClick={() => handleSelectPage(p)}
            type="button"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SurahList({
  onOpenPrayer,
  onOpenSettings,
  onOpenSearch,
  isCollapsed = false,
  onToggleCollapsed
}: SurahListProps) {
  const { surahs, filteredSurahs, selectedSurah, loadingSurahs: loading, surahsError: error } = useQuranData();
  const { query, setQuery, readerScopeMode } = useUIState();
  const { handleSelectSurah: onSelectSurah, retryData: onRetry } = useActions();
  const [isQuickSurahOpen, setIsQuickSurahOpen] = useState(false);
  const [quickSurahQuery, setQuickSurahQuery] = useState("");
  const quickSurahPanelRef = useRef<HTMLDivElement>(null);
  const quickSurahSearchRef = useRef<HTMLInputElement>(null);
  const effectiveQuery = String(query || "").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim();
  const visibleSurahs = effectiveQuery ? filteredSurahs : surahs;
  const normalizedQuickQuery = quickSurahQuery.trim().toLocaleLowerCase();
  const quickSurahs = normalizedQuickQuery
    ? surahs.filter((surah) => (
        `${surah.number} ${surah.englishName} ${surah.englishNameTranslation} ${surah.name}`
          .toLocaleLowerCase()
          .includes(normalizedQuickQuery)
      ))
    : surahs;

  useEffect(() => {
    if (!isQuickSurahOpen) return;

    const focusFrame = window.requestAnimationFrame(() => quickSurahSearchRef.current?.focus());
    const handlePointerDown = (event: PointerEvent) => {
      if (!quickSurahPanelRef.current?.contains(event.target as Node)) {
        setIsQuickSurahOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsQuickSurahOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isQuickSurahOpen]);

  const collapseToggle = (
    <button
      type="button"
      className="surah-panel-collapse-toggle"
      onClick={() => {
        setIsQuickSurahOpen(false);
        onToggleCollapsed?.();
      }}
      aria-label={isCollapsed ? "Expand Surah sidebar" : "Collapse Surah sidebar"}
      title={isCollapsed ? "Expand Surah sidebar" : "Collapse Surah sidebar"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4" width="17" height="16" rx="3" />
        <path d="M15 4v16" />
      </svg>
    </button>
  );

  const headerActions = (onOpenPrayer || onOpenSettings || onOpenSearch) ? (
    <div className="surah-header-actions">
      <div className="topbar-icon-btns surah-icon-btns">
        {onOpenSearch && (
          <button className="header-icon-btn" onClick={onOpenSearch} aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        )}
        <ThemeChooser />
        {onOpenSettings && (
          <button className="header-icon-btn" onClick={onOpenSettings} aria-label="Settings">
            <SettingsIcon />
          </button>
        )}
      </div>
    </div>
  ) : null;

  if (loading) {
    return (
      <aside
        className={`panel surah-panel${isCollapsed ? " is-collapsed" : ""}`}
        aria-label="Surah sidebar"
      >
        <div className="surah-panel-header">
          <h2>Surahs</h2>
          <div className="surah-panel-header-controls">
            {!isCollapsed && collapseToggle}
            {headerActions}
          </div>
        </div>
        {isCollapsed && (
          <div className="surah-panel-collapsed-toolbar">
            {collapseToggle}
            <button className="surah-panel-quick-trigger" type="button" disabled>
              –
            </button>
          </div>
        )}
        <ScopeModeSwitcher />
        <div className="surah-search-wrapper">
          <input className="search" placeholder="Search surahs…" value="" disabled readOnly />
        </div>
        <SurahListSkeleton />
      </aside>
    );
  }

  return (
    <aside
      className={`panel surah-panel${isCollapsed ? " is-collapsed" : ""}`}
      aria-label="Surah sidebar"
    >
      <div className="surah-panel-header">
        <h2>
          {readerScopeMode === "surah" ? "Surahs" : readerScopeMode === "juz" ? "Juz" : "Pages"}
        </h2>
        <div className="surah-panel-header-controls">
          {!isCollapsed && collapseToggle}
          {headerActions}
        </div>
      </div>

      {isCollapsed && (
        <div className="surah-panel-collapsed-toolbar">
          {collapseToggle}
          <div className="surah-panel-quick-select" ref={quickSurahPanelRef}>
            <button
              type="button"
              className="surah-panel-quick-trigger"
              onClick={() => {
                setQuickSurahQuery("");
                setIsQuickSurahOpen((open) => !open);
              }}
              aria-label={`Quick Surah select, currently ${selectedSurah?.englishName || "unknown"}`}
              aria-expanded={isQuickSurahOpen}
              aria-controls="surah-quick-select-popover"
              title="Quick Surah select"
            >
              <span>{selectedSurah?.number ?? "–"}</span>
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="m3 4.5 3 3 3-3" />
              </svg>
            </button>

            {isQuickSurahOpen && (
              <div
                id="surah-quick-select-popover"
                className="surah-quick-select-popover"
              role="dialog"
              aria-label="Quick Surah select"
            >
                <div className="surah-quick-select-header">
                  <div>
                    <p className="surah-quick-select-title">Jump to Surah</p>
                    <p className="surah-quick-select-current">
                      {selectedSurah ? `${selectedSurah.number}. ${selectedSurah.englishName}` : "Choose a Surah"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="surah-quick-select-close"
                    onClick={() => setIsQuickSurahOpen(false)}
                    aria-label="Close quick Surah select"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m7 7 10 10M17 7 7 17" />
                    </svg>
                  </button>
                </div>

                <div className="surah-quick-select-search">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 4 4" />
                  </svg>
                  <input
                    ref={quickSurahSearchRef}
                    value={quickSurahQuery}
                    onChange={(event) => setQuickSurahQuery(event.target.value)}
                    placeholder="Search name or number…"
                    aria-label="Search Surahs for quick selection"
                  />
                </div>

                <div className="surah-quick-select-list" role="listbox" aria-label="Surahs">
                  {quickSurahs.length ? quickSurahs.map((surah) => (
                    <button
                      key={surah.number}
                      type="button"
                      className={`surah-quick-select-item${selectedSurah?.number === surah.number ? " is-current" : ""}`}
                      onClick={() => {
                        onSelectSurah(surah);
                        setIsQuickSurahOpen(false);
                      }}
                      role="option"
                      aria-selected={selectedSurah?.number === surah.number}
                    >
                      <span className="surah-quick-select-number">{surah.number}</span>
                      <span className="surah-quick-select-name">{surah.englishName}</span>
                      <span className="surah-quick-select-arabic" lang="ar" dir="rtl">{surah.name}</span>
                    </button>
                  )) : (
                    <p className="surah-quick-select-empty">No Surahs found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ScopeModeSwitcher />

      {readerScopeMode === "surah" && (
        <>
          <div className="surah-search-wrapper">
            <input
              className="search"
              placeholder="Search surahs…"
              aria-label="Search surahs"
              value={query || ""}
              onChange={(event) => setQuery?.(event.target.value)}
            />
          </div>
          {error && (
            <InlineError title="Surahs unavailable" message={error} onRetry={onRetry} compact />
          )}
          {visibleSurahs.length ? (
            <ul className="surah-list">
              {visibleSurahs.map((surah) => (
                <li key={surah.number}>
                  <button
                    className={`surah-item${selectedSurah?.number === surah.number ? " active" : ""}`}
                    onClick={() => onSelectSurah(surah)}
                  >
                    <span className="surah-number">{surah.number}</span>
                    <span className="surah-names">
                      <span className="surah-english">{surah.englishName}</span>
                      <span className="surah-translation">{surah.englishNameTranslation}</span>
                    </span>
                    <span className="surah-arabic" lang="ar" dir="rtl">
                      {surah.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="meta">No surahs found. Try another search.</p>
          )}
        </>
      )}

      {readerScopeMode === "juz" && <JuzList />}
      {readerScopeMode === "page" && <PageSelector />}
    </aside>
  );
}
