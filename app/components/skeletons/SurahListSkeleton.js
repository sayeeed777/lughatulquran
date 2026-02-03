"use client";

export default function SurahListSkeleton({ count = 10 }) {
  return (
    <ul className="surah-list skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <div className="surah-item skeleton">
            <span className="skeleton-box surah-number-skeleton"></span>
            <span className="surah-names">
              <span className="skeleton-box skeleton-text-lg"></span>
              <span className="skeleton-box skeleton-text-sm"></span>
            </span>
            <span className="skeleton-box skeleton-arabic"></span>
          </div>
        </li>
      ))}
    </ul>
  );
}
