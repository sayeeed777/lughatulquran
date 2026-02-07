"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function SectionErrorBoundary({ title = "Section failed to load", children }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="panel error-panel" role="alert">
          <h3>{title}</h3>
          <p className="meta">Please refresh or try again.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
