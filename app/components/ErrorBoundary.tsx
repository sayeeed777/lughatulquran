"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { reportError } from "../lib/telemetry";

type ErrorBoundaryProps = {
  children?: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    reportError(error, { componentStack: errorInfo?.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Something went wrong</h2>
            <p className="error-message">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="error-actions">
              <button className="action-btn" onClick={this.handleRetry}>
                Try again
              </button>
              <button
                className="action-btn"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="error-details">
                <summary>Error details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
