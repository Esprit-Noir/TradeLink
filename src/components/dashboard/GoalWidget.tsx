"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/formatters"

type GoalWidgetProps = {
  label: string
  currentPnl: number
  initialGoal: number | null
  goalKey: "dailyGoal" | "monthlyGoal"
  placeholder?: string
  emptyMessage?: string
}

export function GoalWidget({ label, currentPnl, initialGoal, goalKey, placeholder = "e.g. 200", emptyMessage = "Set a target to track your progress." }: GoalWidgetProps) {
  const [goal, setGoal] = useState<number | null>(initialGoal)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(initialGoal?.toString() || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = goal && goal > 0 ? Math.min((currentPnl / goal) * 100, 100) : 0
  const isAchieved = goal !== null && currentPnl >= goal
  const isNegative = currentPnl < 0

  const saveGoal = async () => {
    const val = parseFloat(editValue)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [goalKey]: val }),
      })
      if (!res.ok) throw new Error("Failed to save")
      setGoal(val)
      setEditing(false)
    } catch {
      setError("Save failed. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="chart-card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div className="section-label">{label}</div>
          {goal !== null ? (
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)" }}>
              Target: <span style={{ color: "var(--color-gray-200)", fontWeight: 600 }}>{formatCurrency(goal, "USD", true, 0)}</span>
            </div>
          ) : (
            <div style={{ fontSize: "0.8rem", color: "var(--color-gray-600)", fontStyle: "italic" }}>No goal set</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isAchieved && (
            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "6px", background: "var(--profit-muted)", color: "var(--color-profit)", border: "1px solid color-mix(in srgb, var(--color-profit) 25%, transparent)" }}>
              ✓ ACHIEVED
            </span>
          )}
          <button
            onClick={() => { setEditing(!editing); setEditValue(goal?.toString() || ""); setError(null) }}
            className="btn btn-secondary"
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
          >
            {editing ? "Cancel" : goal !== null ? "Edit" : "Set goal"}
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="number"
            className="input"
            value={editValue}
            onChange={e => { setEditValue(e.target.value); setError(null) }}
            placeholder={placeholder}
            onKeyDown={e => e.key === "Enter" && saveGoal()}
            style={{ flex: 1, fontSize: "0.9rem" }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={saveGoal} disabled={saving} style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
            {saving ? "..." : "Save"}
          </button>
        </div>
      )}

      {error && (
        <div style={{ fontSize: "0.8rem", color: "var(--color-loss)", marginBottom: "0.5rem" }}>{error}</div>
      )}

      {goal !== null && goal > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem", rowGap: "0.35rem" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: currentPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(currentPnl, "USD", true, 2)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 500 }}>
              {isAchieved ? `🎯 ${formatCurrency(currentPnl - goal, "USD", true, 2)} over goal` : isNegative ? `${formatCurrency(goal - currentPnl, "USD", true, 2)} to recover + reach goal` : `${formatCurrency(goal - currentPnl, "USD", true, 2)} remaining`}
            </div>
          </div>
          
          <div style={{ background: "var(--color-gray-900)", height: "8px", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--color-gray-800)" }}>
            <div style={{
              height: "100%",
              width: `${Math.max(0, progress)}%`,
              background: isAchieved
                ? "var(--color-profit)"
                : isNegative
                ? "var(--color-loss)"
                : `linear-gradient(90deg, color-mix(in srgb, var(--color-profit) 40%, transparent), var(--color-profit))`,
              transition: "width 0.5s ease-out",
            }} />
          </div>
        </>
      )}

      {(goal === null || goal === 0) && !editing && (
        <div style={{ textAlign: "center", padding: "0.75rem 0", fontSize: "0.8rem", color: "var(--color-gray-600)" }}>
          {emptyMessage}
        </div>
      )}
    </div>
  )
}
