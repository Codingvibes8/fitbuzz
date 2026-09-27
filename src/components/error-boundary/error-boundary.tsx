"use client";

import { ErrorBoundary } from "@sentry/nextjs";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (errorData: { error: unknown; componentStack: string; eventId: string; resetError: () => void }) => React.ReactElement;
}

function DefaultFallback({ error, componentStack, eventId, resetError }: { error: unknown; componentStack: string; eventId: string; resetError: () => void }) {
  return (
    <div style={{ padding: "24px", textAlign: "center", border: "1px solid #e5e8e1", borderRadius: "8px", background: "#fafbf8" }}>
      <div style={{ width: "48px", height: "48px", background: "#f2f4ef", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e76c54" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#1c211b" }}>Something went wrong</h2>
      <p style={{ margin: "0 0 16px", color: "#7b8178", fontSize: "14px" }}>
        This component encountered an error. Please try refreshing the page.
      </p>
      <button
        onClick={resetError}
        style={{ padding: "10px 20px", background: "#d8f46a", color: "#1c211b", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
      >
        Retry
      </button>
    </div>
  );
}

export function ErrorBoundaryWrapper({ children, fallback }: Props) {
  return (
    <ErrorBoundary fallback={fallback || DefaultFallback}>
      {children}
    </ErrorBoundary>
  );
}