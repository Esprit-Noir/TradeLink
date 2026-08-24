"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

const EVENT_LABELS: Record<string, string> = {
  breached: "Challenge breached / failed",
  target_hit: "Profit target reached",
  alert_80pct: "Drawdown alert at 80%",
  alert_90pct: "Drawdown alert at 90%",
  min_days_not_met: "Min trading days not met",
  stop_trading: "Stop-trading alert",
  goal_reached: "Profit goal reached",
  deadline_5d: "Deadline in 5 days",
  deadline_1d: "Deadline in 1 day",
}

export function NotificationPreferences() {
  const [eventTypes, setEventTypes] = useState<Record<string, boolean>>({})
  const [defaults, setDefaults] = useState({ stopTradingPct: 85, profitGoalPct: 50 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [browserEnabled, setBrowserEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported")

  useEffect(() => {
    setBrowserEnabled(localStorage.getItem("tradelink_browser_notifications") === "1")
    setPermission("Notification" in window ? Notification.permission : "unsupported")
  }, [])

  const toggleBrowser = async (enabled: boolean) => {
    if (enabled) {
      if (!("Notification" in window)) {
        toast.error("Browser notifications are not supported here")
        return
      }
      const p = await Notification.requestPermission()
      setPermission(p)
      if (p === "granted") {
        localStorage.setItem("tradelink_browser_notifications", "1")
        setBrowserEnabled(true)
        toast.success("Browser notifications enabled")
      } else {
        toast.error("Permission denied by the browser")
      }
    } else {
      localStorage.removeItem("tradelink_browser_notifications")
      setBrowserEnabled(false)
    }
  }

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then(r => r.json())
      .then(d => {
        setEventTypes(d.eventTypes || {})
        setDefaults(d.defaults || {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventTypes, defaults }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Notification preferences saved")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="chart-card" style={{ padding: "1.5rem" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Notification Preferences</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        Choose which prop-firm events show up in your notification center.
      </p>

      {loading && <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>Loading…</div>}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Object.keys(EVENT_LABELS).map(key => (
            <label key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", cursor: "pointer", borderBottom: "1px solid var(--color-gray-800)" }}>
              <span style={{ fontSize: "0.88rem", color: "var(--color-gray-200)" }}>{EVENT_LABELS[key]}</span>
              <input
                type="checkbox"
                checked={Boolean(eventTypes[key])}
                onChange={e => setEventTypes(p => ({ ...p, [key]: e.target.checked }))}
                style={{ width: 17, height: 17, accentColor: "var(--color-brand-500)" }}
              />
            </label>
          ))}

          <div style={{ marginTop: "0.75rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div className="form-group" style={{ minWidth: 160 }}>
              <label className="label">Default stop-trading threshold (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                className="input"
                value={defaults.stopTradingPct}
                onChange={e => setDefaults(d => ({ ...d, stopTradingPct: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group" style={{ minWidth: 160 }}>
              <label className="label">Default profit goal (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                className="input"
                value={defaults.profitGoalPct}
                onChange={e => setDefaults(d => ({ ...d, profitGoalPct: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
            These defaults prefill the Alert Settings when you create a new challenge.
          </div>

          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-gray-800)" }}>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--color-gray-200)" }}>Browser notifications</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                  Receive desktop/push-style alerts when a new prop-firm event happens.
                  {permission === "denied" && " Permission was denied in your browser — allow it in the site settings."}
                  {permission === "default" && " You'll be asked for permission when you enable this."}
                </div>
              </div>
              <input
                type="checkbox"
                checked={browserEnabled}
                onChange={e => toggleBrowser(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: "var(--color-brand-500)", flexShrink: 0 }}
              />
            </label>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save preferences"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
