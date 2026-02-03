"use client";

import SurahListSkeleton from "./skeletons/SurahListSkeleton";

export default function SurahList({
  surahs,
  filteredSurahs,
  selectedSurah,
  query,
  setQuery,
  onSelectSurah,
  loading
}) {
  if (loading) {
    return (
      <aside className="panel surah-panel">
        <div className="surah-panel-header">
          <h2>Surahs</h2>
        </div>
        <div className="surah-search-wrapper">
          <input
            className="search"
            placeholder="Search by name or number"
            value=""
            disabled
            readOnly
          />
        </div>
        <SurahListSkeleton />
      </aside>
    );
  }

  return (
    <aside className="panel surah-panel">
      <div className="surah-panel-header">
        <h2>Surahs</h2>
      </div>
      <div className="surah-search-wrapper">
        <input
          className="search"
          placeholder="Search by name or number"
          value={query || ""}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <ul className="surah-list">
        {filteredSurahs.map((surah) => (
          <li key={surah.number}>
            <button
              className={`surah-item${
                selectedSurah?.number === surah.number ? " active" : ""
              }`}
              onClick={() => onSelectSurah(surah)}
            >
              <span className="surah-number">{surah.number}</span>
              <span className="surah-names">
                <span className="surah-english">{surah.englishName}</span>
                <span className="surah-translation">
                  {surah.englishNameTranslation}
                </span>
              </span>
              <span className="surah-arabic" lang="ar" dir="rtl">
                {surah.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
