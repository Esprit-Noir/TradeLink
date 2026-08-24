"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Moon, Sun, ClipboardCheck, ClipboardList } from "lucide-react"

type JournalFormProps = {
  date: string
  initialData?: any
}

const MOODS = [
  { label: "🟢 Calm", value: "calm" },
  { label: "🟡 Anxious", value: "anxious" },
  { label: "🔴 Frustrated", value: "frustrated" },
  { label: "🟣 Euphoric", value: "euphoric" },
  { label: "🔵 Tired", value: "tired" },
  { label: "⚪ Neutral", value: "neutral" },
]

const DISCIPLINE_CHECKS = [
  { key: "followed_plan", label: "Followed my trading plan" },
  { key: "respected_stop", label: "Set and respected my stop loss" },
  { key: "no_revenge", label: "No revenge trading" },
  { key: "position_size", label: "Respected position sizing" },
  { key: "waited_confirmation", label: "Waited for setup confirmation" },
  { key: "logged_emotions", label: "Logged emotions on each trade" },
]

export function JournalForm({ date, initialData }: JournalFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [mood, setMood] = useState(initialData?.mood || "")
  const [sleepHours, setSleepHours] = useState(initialData?.sleepHours?.toString() || "")
  const [macroContext, setMacroContext] = useState(initialData?.macroContext || "")
  const [sessionPlan, setSessionPlan] = useState(initialData?.sessionPlan || "")

  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    const stored = initialData?.disciplineChecks as Record<string, boolean> | undefined
    return DISCIPLINE_CHECKS.reduce<Record<string, boolean>>((acc, c) => {
      acc[c.key] = typeof stored?.[c.key] === "boolean" ? stored[c.key] : false
      return acc
    }, {})
  })

  const [endOfDaySummary, setEndOfDaySummary] = useState(initialData?.endOfDaySummary || "")
  const [nightReflection, setNightReflection] = useState(initialData?.nightReflection || "")
  const [rating, setRating] = useState<number | null>(initialData?.rating || null)

  const doneChecks = DISCIPLINE_CHECKS.filter(c => checks[c.key]).length
  const disciplinePct = Math.round((doneChecks / DISCIPLINE_CHECKS.length) * 100)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/journal/${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          macroContext,
          sessionPlan,
          endOfDaySummary,
          rating,
          sleepHours: sleepHours ? Number(sleepHours) : null,
          disciplineChecks: checks,
          nightReflection,
        }),
      })
      if (res.ok) {
        toast.success("Journal saved.")
        const data = await res.json()
        if (data.unlocks && data.unlocks.length > 0) {
          data.unlocks.forEach((code: string) => toast.success(`🏆 Achievement Unlocked: ${code.replace(/_/g, ' ').toUpperCase()}!`))
        }
        router.refresh()
      } else {
        toast.error("Failed to save journal.")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to save journal.")
    } finally {
      setSaving(false)
    }
  }

  const toggleCheck = (key: string) => setChecks(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="chart-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Daily Journal</h2>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? "Saving..." : "Save Journal"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

        {/* ── Pre-market ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Sun size={16} style={{ color: "var(--color-warning)" }} />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-300)" }}>Pre-market</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.25rem" }}>
            <div>
              <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Mood</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "20px",
                      border: `1px solid ${mood === m.value ? "var(--color-brand-500)" : "var(--color-gray-700)"}`,
                      background: mood === m.value ? "rgba(139,92,246,0.1)" : "var(--color-gray-900)",
                      color: mood === m.value ? "var(--color-brand-300)" : "var(--color-gray-400)",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Sleep (hours)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={16}
                value={sleepHours}
                onChange={e => setSleepHours(e.target.value)}
                placeholder="e.g. 7.5"
              />
            </div>
          </div>

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
        </section>

        {/* ── Discipline checklist ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <ClipboardCheck size={16} style={{ color: "var(--color-brand-500)" }} />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-300)" }}>Discipline Checklist</h3>
            <span style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 700, color: disciplinePct === 100 ? "var(--color-profit)" : disciplinePct >= 50 ? "var(--color-warning)" : "var(--color-loss)" }}>
              {doneChecks}/{DISCIPLINE_CHECKS.length} ({disciplinePct}%)
            </span>
          </div>
          <div style={{ background: "var(--color-gray-800)", borderRadius: "6px", height: "6px", overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{
              height: "100%", width: `${disciplinePct}%`, borderRadius: "6px",
              background: disciplinePct === 100 ? "var(--color-profit)" : disciplinePct >= 50 ? "var(--color-warning)" : "var(--color-loss)",
              transition: "width 400ms ease",
            }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {DISCIPLINE_CHECKS.map(c => (
              <label
                key={c.key}
                onClick={() => toggleCheck(c.key)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer",
                  padding: "0.65rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem",
                  background: checks[c.key] ? "rgba(16,185,129,0.08)" : "var(--color-gray-900)",
                  border: `1px solid ${checks[c.key] ? "rgba(16,185,129,0.3)" : "var(--color-gray-800)"}`,
                  color: checks[c.key] ? "var(--color-gray-100)" : "var(--color-gray-400)",
                  userSelect: "none", transition: "all 0.15s",
                }}
              >
                <input type="checkbox" checked={!!checks[c.key]} readOnly style={{ accentColor: "var(--color-profit)", pointerEvents: "none" }} />
                {c.label}
              </label>
            ))}
          </div>
        </section>

        {/* ── End of day ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Moon size={16} style={{ color: "var(--color-info)" }} />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-300)" }}>End of Day</h3>
          </div>

          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>End of Day Summary</label>
            <textarea
              className="input"
              value={endOfDaySummary}
              onChange={e => setEndOfDaySummary(e.target.value)}
              placeholder="Followed my plan. Took one break-even trade. Market was choppy..."
              style={{ minHeight: "100px", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="form-group">
              <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Night Reflection — what to improve tomorrow</label>
              <textarea
                className="input"
                value={nightReflection}
                onChange={e => setNightReflection(e.target.value)}
                placeholder="I chased two losses today. Tomorrow I'll size down and wait for confirmation..."
                style={{ minHeight: "90px", resize: "vertical" }}
              />
            </div>
            <div>
              <label className="label" style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Discipline Rating</label>
              <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem" }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.75rem",
                      color: rating && star <= rating ? "#eab308" : "var(--color-gray-700)",
                      transition: "color 0.2s",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-600)", marginTop: "0.35rem" }}>
                {rating ? ["Very poor", "Poor", "Average", "Good", "Excellent"][rating - 1] : "Rate your discipline today"}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
