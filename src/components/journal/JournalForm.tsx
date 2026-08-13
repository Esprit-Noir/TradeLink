"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type JournalFormProps = {
  date: string
  initialData?: any
}

export function JournalForm({ date, initialData }: JournalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [mood, setMood] = useState(initialData?.mood || "")
  const [macroContext, setMacroContext] = useState(initialData?.macroContext || "")
  const [sessionPlan, setSessionPlan] = useState(initialData?.sessionPlan || "")
  const [endOfDaySummary, setEndOfDaySummary] = useState(initialData?.endOfDaySummary || "")
  const [rating, setRating] = useState<number | null>(initialData?.rating || null)

  const moods = [
    { label: "🟢 Calm", value: "calm" },
    { label: "🟡 Anxious", value: "anxious" },
    { label: "🔴 Frustrated", value: "frustrated" },
    { label: "🟣 Euphoric", value: "euphoric" },
    { label: "🔵 Tired", value: "tired" },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/journal/${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, macroContext, sessionPlan, endOfDaySummary, rating }),
      })
      if (res.ok) {
        router.refresh()
        // Optional: show a toast notification here
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Daily Journal</h2>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="btn btn-primary"
        >
          {saving ? "Saving..." : "Save Journal"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        
        {/* Mood Selection */}
        <div>
          <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Pre-market Mood</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {moods.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  border: `1px solid ${mood === m.value ? "var(--color-brand-500)" : "var(--color-gray-700)"}`,
                  background: mood === m.value ? "rgba(59,130,246,0.1)" : "var(--color-gray-900)",
                  color: mood === m.value ? "var(--color-brand-400)" : "var(--color-gray-400)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "all 0.2s"
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Macro & Plan */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="form-group">
            <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Macro Context & News</label>
            <textarea 
              className="input" 
              value={macroContext} 
              onChange={e => setMacroContext(e.target.value)}
              placeholder="CPI at 8:30am, expecting volatility..."
              style={{ minHeight: "100px", resize: "vertical" }}
            />
          </div>
          <div className="form-group">
            <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Session Plan</label>
            <textarea 
              className="input" 
              value={sessionPlan} 
              onChange={e => setSessionPlan(e.target.value)}
              placeholder="Looking for shorts on NQ below 15000..."
              style={{ minHeight: "100px", resize: "vertical" }}
            />
          </div>
        </div>

        {/* End of Day */}
        <div className="form-group">
          <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>End of Day Summary</label>
          <textarea 
            className="input" 
            value={endOfDaySummary} 
            onChange={e => setEndOfDaySummary(e.target.value)}
            placeholder="Followed my plan. Took one break-even trade. Market was choppy..."
            style={{ minHeight: "120px", resize: "vertical" }}
          />
        </div>

        {/* Discipline Rating */}
        <div>
          <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Discipline Rating</label>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: rating && star <= rating ? "#eab308" : "var(--color-gray-700)",
                  transition: "color 0.2s"
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
