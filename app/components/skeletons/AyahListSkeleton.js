"use client";

/** @param {{ count?: number }} props */
export default function AyahListSkeleton({ count = 5 }) {
  return (
    <ol className="ayah-list skeleton-list">
      {Array.from({ length: count }).map((_, index) => {
        /** @type {import("react").CSSProperties & Record<string, string | number>} */
        const itemStyle = { "--i": index };
        return (
          <li
            key={index}
            className="ayah-card skeleton"
            style={itemStyle}
          >
          <div className="ayah-header">
            <span className="skeleton-box skeleton-text-sm"></span>
            <div className="ayah-actions">
              <span className="skeleton-box skeleton-btn"></span>
              <span className="skeleton-box skeleton-btn"></span>
              <span className="skeleton-box skeleton-btn"></span>
            </div>
          </div>
          <div className="skeleton-box skeleton-arabic-line"></div>
          <div className="skeleton-box skeleton-arabic-line short"></div>
          <div className="skeleton-translation-lines">
            <div className="skeleton-box skeleton-text-line"></div>
            <div className="skeleton-box skeleton-text-line"></div>
            <div className="skeleton-box skeleton-text-line short"></div>
          </div>
        </li>
        );
      })}
    </ol>
  );
}
