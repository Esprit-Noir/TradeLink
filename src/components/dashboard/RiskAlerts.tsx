"use client"

import { useState, useEffect } from "react"
import { BellRing, AlertTriangle, ShieldAlert, Info } from "lucide-react"

type Alert = {
  type: string
  severity: "info" | "warning" | "critical"
  message: string
  challengeId?: string
  challengeName?: string
  value?: string
}

const severityMeta: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "var(--color-loss)", bg: "rgba(239,68,68,0.08)" },
  warning: { label: "Warning", color: "var(--color-warning)", bg: "rgba(245,158,11,0.08)" },
  info: { label: "Info", color: "var(--color-info)", bg: "rgba(59,130,246,0.08)" },
}

export function RiskAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/risk-alerts")
      .then(r => r.json())
      .then(d => setAlerts(d.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="card skeleton" style={{ height: "140px" }} />
  }

  const icon = (sev: string) => {
    if (sev === "critical") return <ShieldAlert size={15} style={{ color: "var(--color-loss)" }} />
    if (sev === "warning") return <AlertTriangle size={15} style={{ color: "var(--color-warning)" }} />
    return <Info size={15} style={{ color: "var(--color-info)" }} />
  }

  return (
    <div className="chart-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <BellRing size={16} style={{ color: "var(--color-brand-500)" }} />
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Risk Alerts & Rules</h3>
        {alerts.length > 0 && (
          <span style={{ marginLeft: "auto", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: "var(--color-gray-800)", color: "var(--color-gray-300)" }}>
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem", borderRadius: "8px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
          <span style={{ color: "var(--color-profit)", fontSize: "1rem" }}>✓</span> No risk alerts right now. All rules are within limits.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {alerts.map((a, i) => {
            const meta = severityMeta[a.severity]
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.7rem 0.85rem", borderRadius: "8px", background: meta.bg, border: `1px solid ${meta.color}33` }}>
                <div style={{ marginTop: "1px" }}>{icon(a.severity)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: meta.color, marginBottom: "0.15rem" }}>
                    {a.challengeName ? `${a.challengeName} — ` : ""}{meta.label}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-gray-200)" }}>{a.message}</div>
                </div>
                {a.value && (
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: meta.color, whiteSpace: "nowrap" }}>{a.value}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
