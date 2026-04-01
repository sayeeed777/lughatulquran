"use client";

type StudyAyahSkeletonProps = {
  count?: number;
};

export default function StudyAyahSkeleton({ count = 5 }: StudyAyahSkeletonProps) {
  return (
    <div className="study-skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="study-skeleton-card skeleton">
          <div className="study-skeleton-header">
            <div className="skeleton-box study-skeleton-badge" />
            <div className="skeleton-box study-skeleton-actions" />
          </div>
          <div className="study-skeleton-body">
            <div className="skeleton-box study-skeleton-arabic" />
            <div className="skeleton-box study-skeleton-arabic short" />
          </div>
          <div className="study-skeleton-translation">
            <div className="skeleton-box study-skeleton-line" />
            <div className="skeleton-box study-skeleton-line" />
            <div className="skeleton-box study-skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}
