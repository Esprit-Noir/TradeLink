"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, RefreshCw, ArrowLeft, LayoutDashboard } from "lucide-react"

export default function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[Overview Error]", error)
  }, [error])

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: "1rem",
      textAlign: "center", padding: "2rem"
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <LayoutDashboard size={24} style={{ color: "var(--color-loss)" }} />
      </div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "var(--color-gray-200)" }}>
        Overview failed to load
      </h2>
      <p style={{ color: "var(--color-gray-500)", maxWidth: 420, lineHeight: 1.6, fontSize: "0.85rem" }}>
        {error.message || "Could not load overview data."}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button onClick={() => router.push("/dashboard")} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Dashboard
        </button>
        <button onClick={reset} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    </div>
  )
}
