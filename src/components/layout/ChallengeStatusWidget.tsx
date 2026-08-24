"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

type SidebarStats = {
  todayPnl: number
  todayTrades: number
  challengeStatus: "safe" | "warning" | "danger" | null
  challengeName: string | null
  challengePct: number
}

export function ChallengeStatusWidget() {
  const pathname = usePathname()
  const [stats, setStats] = useState<SidebarStats | null>(null)

  useEffect(() => {
    fetch("/api/sidebar-stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [pathname])

  if (!stats?.challengeStatus) return null

  return (
    <div className="challenge-status-widget" style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      minWidth: "220px",
      marginRight: "0.5rem",
      padding: "0.35rem 0.75rem",
      borderRadius: "8px",
      background: "color-mix(in srgb, var(--color-gray-900) 50%, transparent)",
      border: `1px solid ${
        stats.challengeStatus === "danger" ? "rgba(239,68,68,0.35)"
        : stats.challengeStatus === "warning" ? "rgba(245,158,11,0.3)"
        : "var(--color-gray-800)"
      }`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-gray-300)" }}>
          {stats.challengeName || "Challenge"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.6rem", color: "var(--color-gray-400)" }}>
            {stats.challengePct.toFixed(1)}% DD
          </span>
          <span style={{
            fontSize: "0.55rem", fontWeight: 800, padding: "0.15rem 0.3rem", borderRadius: "4px",
            background: stats.challengeStatus === "danger" ? "rgba(239,68,68,0.15)"
              : stats.challengeStatus === "warning" ? "rgba(245,158,11,0.15)"
              : "rgba(16,185,129,0.1)",
            color: stats.challengeStatus === "danger" ? "var(--color-loss)"
              : stats.challengeStatus === "warning" ? "var(--color-warning)"
              : "var(--color-profit)",
          }}>
            {stats.challengeStatus === "danger" ? "RISK" : stats.challengeStatus === "warning" ? "CAUTION" : "SAFE"}
          </span>
        </div>
      </div>
      <div style={{ background: "var(--color-gray-800)", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${Math.min(stats.challengePct, 100)}%`,
          borderRadius: "3px",
          background: stats.challengeStatus === "danger" ? "var(--color-loss)"
            : stats.challengeStatus === "warning" ? "var(--color-warning)"
            : "var(--color-profit)",
          transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>
    </div>
  )
}
