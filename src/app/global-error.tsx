"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "var(--background, #06090d)", color: "var(--color-gray-200, #e4e4e7)", fontFamily: "inherit" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem", textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Something went wrong</h2>
          <p style={{ color: "var(--color-gray-500)", maxWidth: 420, lineHeight: 1.6, fontSize: "0.85rem" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button onClick={reset} style={{ padding: "0.5rem 1.25rem", borderRadius: 8, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "inherit", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}