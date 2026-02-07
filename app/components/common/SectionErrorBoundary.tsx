"use client";

import type { ReactNode } from "react";
import ErrorBoundary from "../ErrorBoundary";

type SectionErrorBoundaryProps = {
  title?: string;
  children: ReactNode;
};

export default function SectionErrorBoundary({
  title = "Section failed to load",
  children
}: SectionErrorBoundaryProps) {
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
