"use client"

import { useState } from "react"
import { toast } from "sonner"

export function AlertSettings({ challengeId, initialConfig }: { challengeId: string; initialConfig: any }) {
  const [config, setConfig] = useState(() => ({
    stopTradingPct: Number(initialConfig?.stopTradingPct ?? 85),
    profitGoalPct: Number(initialConfig?.profitGoalPct ?? 50),
    enableStopTrading: Boolean(initialConfig?.enableStopTrading ?? false),
    enableProfitGoal: Boolean(initialConfig?.enableProfitGoal ?? false),
  }))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertConfig: config }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Alert settings saved")
    } catch {
      toast.error("Failed to save alert settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div className="chart-title" style={{ marginBottom: "1rem" }}>Alert Settings</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Stop-trading alert</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
              Notify when you use {config.stopTradingPct}% of your max drawdown so you stop for the day.
            </div>
          </div>
          <input
            type="number"
            min={1}
            max={100}
            value={config.stopTradingPct}
            onChange={e => setConfig(c => ({ ...c, stopTradingPct: Number(e.target.value) }))}
            style={{ width: 70 }}
            className="input"
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={config.enableStopTrading}
              onChange={e => setConfig(c => ({ ...c, enableStopTrading: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "var(--color-brand-500)" }}
            />
            <span style={{ fontSize: "0.8rem" }}>Enabled</span>
          </label>
        </div>

        <div style={{ height: "1px", background: "var(--color-gray-800)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Profit goal alert</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
              Notify when you reach {config.profitGoalPct}% of the profit target.
            </div>
          </div>
          <input
            type="number"
            min={1}
            max={100}
            value={config.profitGoalPct}
            onChange={e => setConfig(c => ({ ...c, profitGoalPct: Number(e.target.value) }))}
            style={{ width: 70 }}
            className="input"
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={config.enableProfitGoal}
              onChange={e => setConfig(c => ({ ...c, enableProfitGoal: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "var(--color-brand-500)" }}
            />
            <span style={{ fontSize: "0.8rem" }}>Enabled</span>
          </label>
        </div>
      </div>

      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-outline" onClick={save} disabled={saving} style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
          {saving ? "Saving…" : "Save alert settings"}
        </button>
      </div>
    </div>
  )
}
