"use client"

import { useState } from "react"

type Props = {
  monthPnl: number
  initialGoal: number | null
  monthLabel: string
}

export function MonthlyGoalWidget({ monthPnl, initialGoal, monthLabel }: Props) {
  const [goal, setGoal] = useState<number | null>(initialGoal)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(initialGoal?.toString() || "")
  const [saving, setSaving] = useState(false)

  const progress = goal && goal > 0 ? Math.min((monthPnl / goal) * 100, 100) : 0
  const isAchieved = goal !== null && monthPnl >= goal
  const isNegative = monthPnl < 0

  const saveGoal = async () => {
    const val = parseFloat(editValue)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyGoal: val }),
      })
      setGoal(val)
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.25rem" }}>
            Monthly Objective — {monthLabel}
          </div>
          {goal !== null ? (
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)" }}>
              Target: <span style={{ color: "var(--color-gray-200)", fontWeight: 600 }}>${goal.toFixed(0)}</span>
            </div>
          ) : (
            <div style={{ fontSize: "0.8rem", color: "var(--color-gray-600)", fontStyle: "italic" }}>No goal set</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isAchieved && (
            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "6px", background: "rgba(16,185,129,0.15)", color: "var(--color-profit)", border: "1px solid rgba(16,185,129,0.25)" }}>
              ✓ ACHIEVED
            </span>
          )}
          <button
            onClick={() => { setEditing(!editing); setEditValue(goal?.toString() || "") }}
            style={{ background: "none", border: "1px solid var(--color-gray-800)", borderRadius: "6px", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--color-gray-400)" }}
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
            onChange={e => setEditValue(e.target.value)}
            placeholder="e.g. 2000"
            onKeyDown={e => e.key === "Enter" && saveGoal()}
            style={{ flex: 1, fontSize: "0.9rem" }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={saveGoal} disabled={saving} style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
            {saving ? "..." : "Save"}
          </button>
        </div>
      )}

      {goal !== null && goal > 0 && (
        <>
          <div style={{ background: "var(--color-gray-800)", borderRadius: "6px", height: "8px", overflow: "hidden", marginBottom: "0.75rem" }}>
            <div style={{
              height: "100%",
              width: `${Math.max(0, progress)}%`,
              borderRadius: "6px",
              background: isAchieved
                ? "var(--color-profit)"
                : isNegative
                ? "var(--color-loss)"
                : `linear-gradient(90deg, var(--color-brand-600), var(--color-brand-400))`,
              transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
            }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: monthPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontVariantNumeric: "tabular-nums" }}>
              {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>
              {isAchieved ? `🎯 +$${(monthPnl - goal).toFixed(2)} over goal` : isNegative ? `$${(goal - monthPnl).toFixed(2)} to recover + reach goal` : `$${(goal - monthPnl).toFixed(2)} remaining`}
            </div>
          </div>
        </>
      )}

      {(goal === null || goal === 0) && !editing && (
        <div style={{ textAlign: "center", padding: "0.75rem 0", fontSize: "0.8rem", color: "var(--color-gray-600)" }}>
          Set a monthly P&L target to track your progress.
        </div>
      )}
    </div>
  )
}
