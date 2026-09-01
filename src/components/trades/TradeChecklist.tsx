"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Save } from "lucide-react"
import { toast } from "sonner"

interface ChecklistItem {
  key: string
  label: string
}

const PRE_TRADE_ITEMS: ChecklistItem[] = [
  { key: "planFollowed", label: "Followed my trading plan" },
  { key: "stopSet", label: "Set stop loss before entry" },
  { key: "riskChecked", label: "Checked risk/reward ratio" },
  { key: "sizeCalculated", label: "Position size calculated" },
  { key: "setupConfirmed", label: "Setup confirmed on chart" },
  { key: "noFomo", label: "No FOMO — patient entry" },
]

const POST_TRADE_ITEMS: ChecklistItem[] = [
  { key: "planRespected", label: "Followed the plan during trade" },
  { key: "stopRespected", label: "Did not move stop loss" },
  { key: "tpRespected", label: "Took profit at target" },
  { key: "noRevenge", label: "No revenge trading" },
  { key: "emotionsManaged", label: "Emotions managed" },
  { key: "lessonsLogged", label: "Logged lessons learned" },
]

interface TradeChecklistProps {
  tradeId: string
  preChecklist?: Record<string, boolean> | null
  postChecklist?: Record<string, boolean> | null
  onUpdate?: () => void
}

export function TradeChecklist({ tradeId, preChecklist, postChecklist, onUpdate }: TradeChecklistProps) {
  const [pre, setPre] = useState<Record<string, boolean>>(preChecklist ?? {})
  const [post, setPost] = useState<Record<string, boolean>>(postChecklist ?? {})
  const [saving, setSaving] = useState<"pre" | "post" | null>(null)

  const toggle = (type: "pre" | "post", key: string) => {
    if (type === "pre") {
      setPre(prev => ({ ...prev, [key]: !prev[key] }))
    } else {
      setPost(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  const save = async (type: "pre" | "post") => {
    setSaving(type)
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type === "pre" ? { preChecklist: pre } : { postChecklist: post }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(`${type === "pre" ? "Pre" : "Post"}-trade checklist saved`)
      onUpdate?.()
    } catch {
      toast.error("Failed to save checklist")
    } finally {
      setSaving(null)
    }
  }

  const renderChecklist = (type: "pre" | "post", items: ChecklistItem[], data: Record<string, boolean>) => {
    const checked = items.filter(i => data[i.key]).length
    const total = items.length

    return (
      <div style={{
        padding: "1rem", borderRadius: 10,
        background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)",
        flex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
              {type === "pre" ? "Pre-Trade" : "Post-Trade"}
            </span>
            <span style={{
              fontSize: "0.65rem", padding: "2px 6px", borderRadius: 4,
              background: checked === total ? "rgba(0,199,88,0.15)" : "var(--color-gray-800)",
              color: checked === total ? "var(--color-profit)" : "var(--color-gray-500)",
              fontWeight: 600,
            }}>
              {checked}/{total}
            </span>
          </div>
          <button
            onClick={() => save(type)}
            disabled={saving === type}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 6,
              background: "var(--color-brand-500)", color: "#000",
              border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700,
            }}
          >
            <Save size={12} />
            {saving === type ? "..." : "Save"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map(item => {
            const isChecked = !!data[item.key]
            return (
              <button
                key={item.key}
                onClick={() => toggle(type, item.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", borderRadius: 6,
                  background: isChecked ? "rgba(0,199,88,0.08)" : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  transition: "background 0.15s",
                }}
              >
                {isChecked
                  ? <CheckCircle2 size={15} style={{ color: "var(--color-profit)", flexShrink: 0 }} />
                  : <Circle size={15} style={{ color: "var(--color-gray-600)", flexShrink: 0 }} />
                }
                <span style={{
                  fontSize: "0.78rem", fontWeight: 500,
                  color: isChecked ? "var(--color-profit)" : "var(--color-gray-400)",
                  textDecoration: isChecked ? "line-through" : "none",
                }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {renderChecklist("pre", PRE_TRADE_ITEMS, pre)}
      {renderChecklist("post", POST_TRADE_ITEMS, post)}
    </div>
  )
}
