"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ width: "64px", height: "64px", background: "#f2f4ef", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e76c54" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "24px", fontWeight: 700, color: "#1c211b" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 24px", color: "#7b8178", maxWidth: "400px", lineHeight: 1.6 }}>
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            style={{ padding: "12px 24px", background: "#d8f46a", color: "#1c211b", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
          >
            Try again
          </button>
          <p style={{ margin: "16px 0 0", fontSize: "12px", color: "#7b8178" }}>
            Error reference: {error.digest}
          </p>
        </div>
      </body>
    </html>
  );
}