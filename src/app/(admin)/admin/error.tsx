"use client"

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-400)", marginBottom: 16 }}>
        {error.message || "An unexpected error occurred."}
      </p>
      <button onClick={reset} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
        Try again
      </button>
    </div>
  )
}
