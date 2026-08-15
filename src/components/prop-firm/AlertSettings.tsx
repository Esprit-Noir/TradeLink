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
    <div style={{ background: "var(--color-gray-900)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem" }}>Alert Settings</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: config.enableStopTrading ? "var(--color-loss)" : "var(--color-gray-300)" }}>Stop-trading alert</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)", marginTop: "0.2rem" }}>
              Notify when you use <span style={{ color: "var(--color-gray-300)", fontWeight: 600 }}>{config.stopTradingPct}%</span> of your max drawdown so you stop for the day.
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
            <span style={{ fontSize: "0.8rem", color: config.enableStopTrading ? "var(--color-gray-100)" : "var(--color-gray-500)", fontWeight: config.enableStopTrading ? 600 : 400 }}>Enabled</span>
          </label>
        </div>

        <div style={{ height: "1px", background: "var(--color-gray-800)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: config.enableProfitGoal ? "var(--color-profit)" : "var(--color-gray-300)" }}>Profit goal alert</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)", marginTop: "0.2rem" }}>
              Notify when you reach <span style={{ color: "var(--color-gray-300)", fontWeight: 600 }}>{config.profitGoalPct}%</span> of the profit target.
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
            <span style={{ fontSize: "0.8rem", color: config.enableProfitGoal ? "var(--color-gray-100)" : "var(--color-gray-500)", fontWeight: config.enableProfitGoal ? 600 : 400 }}>Enabled</span>
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
