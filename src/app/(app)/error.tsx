"use client"

import { useEffect } from "react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "1rem",
      textAlign: "center",
      padding: "2rem"
    }}>
      <div style={{ fontSize: "3rem", lineHeight: 1 }}>⚠️</div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, color: "var(--color-gray-200)" }}>Something went wrong</h2>
      <p style={{ color: "var(--color-gray-500)", maxWidth: 400, lineHeight: 1.6, fontFamily: "monospace", fontSize: "0.85rem", background: "var(--color-gray-900)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-gray-800)" }}>
        {error.message}
      </p>
      <button onClick={reset} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
        Try again
      </button>
    </div>
  )
}
