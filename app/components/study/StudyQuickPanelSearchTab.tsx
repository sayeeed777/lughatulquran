"use client";

import type { StudyQuickPanelContentProps } from "./StudyQuickPanelTypes";

type StudyQuickPanelSearchTabProps = Pick<
  StudyQuickPanelContentProps,
  | "searchQuery"
  | "setSearchQuery"
  | "runSearch"
  | "searchLoading"
  | "searchError"
  | "searchHasRun"
  | "searchResults"
  | "surahByNumber"
  | "onJumpToAyah"
  | "onClosePanel"
>;

export default function StudyQuickPanelSearchTab({
  searchQuery,
  setSearchQuery,
  runSearch,
  searchLoading,
  searchError,
  searchHasRun,
  searchResults,
  surahByNumber,
  onJumpToAyah,
  onClosePanel
}: StudyQuickPanelSearchTabProps) {
  return (
    <div className="quick-panel-section">
      <div className="study-card search-card">
        <h4>Search the Quran</h4>
        <div className="search-row">
          <input
            type="text"
            placeholder="Keyword or topic"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch();
            }}
          />
          <button className="control-btn primary" onClick={runSearch} type="button">
            Search
          </button>
        </div>
        {searchLoading && <p className="status">Searching...</p>}
        {searchError && <p className="status error">{searchError}</p>}
        {!searchLoading && !searchError && searchResults.length === 0 && (
          <p className="status">{searchHasRun ? "No results found." : "Type a keyword, then press Search."}</p>
        )}
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((result, index) => {
              const name = result.surah
                ? surahByNumber.get(result.surah)?.englishName || `Surah ${result.surah}`
                : "Surah";
              const location = result.ayah ? `Ayah ${result.ayah}` : "";
              return (
                <li key={`${result.surah}-${result.ayah}-${index}`}>
                  <div className="search-result-main">
                    <span className="search-result-title">
                      {name} {location}
                    </span>
                    <span className="search-result-text">
                      {result.translation || result.text || "Result"}
                    </span>
                  </div>
                  {result.surah && result.ayah && (
                    <button
                      className="quick-item-action"
                      onClick={() => {
                        onJumpToAyah(result.surah!, result.ayah!);
                        onClosePanel();
                      }}
                      type="button"
                    >
                      Go
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
