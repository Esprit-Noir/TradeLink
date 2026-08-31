// components/behavioral/BehaviorScore.tsx
// Behavioral Score gauge + pattern cards + advanced metrics
"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Brain } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"
import { formatCurrency } from "@/lib/formatters"
import type { BehavioralResult, DetectedPattern } from "@/lib/behavioral"

const RANGES = [
  { key: "all", label: "All time" },
  { key: "90d", label: "90 days" },
  { key: "30d", label: "30 days" },
]

type HistoryPoint = { disciplineScore: number; computedAt: string }
type RecentFlag = { id: string; symbol: string; side: string; netPnl: number; entryAt: string; type: string; label: string; color: string }

export function BehaviorScore() {
  const t = useTranslations("behavioral")
  const [data, setData] = useState<(BehavioralResult & { history?: HistoryPoint[]; range?: string; recentFlags?: RecentFlag[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("all")

  const load = useCallback(async (r: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/behavioral?range=${r}&accountId=all`)
      const d = await res.json()
      setData(d)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(range)
  }, [range, load])

  if (loading) return <ScoreSkeleton />
  if (!data) return null

  const score = data.disciplineScore
  const scoreClass = score >= 85 ? "score-excellent" : score >= 70 ? "score-good" : score >= 50 ? "score-medium" : score >= 30 ? "score-poor" : "score-critical"
  const scoreLabel = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : score >= 30 ? "Poor" : "Critical"

  const history = data.history || []
  let delta: number | null = null
  if (history.length >= 2) {
    const a = history[history.length - 2]?.disciplineScore
    const b = history[history.length - 1]?.disciplineScore
    if (typeof a === "number" && typeof b === "number") delta = b - a
  }

  const hasOvertrading = data.scoreBreakdown?.penalties.some(p => p.type === "overtrading")

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem" }}>
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: range === r.key ? "var(--color-gray-800)" : "transparent",
                color: range === r.key ? "var(--color-text)" : "var(--color-gray-500)",
                border: "none",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="chart-card p-6 md:col-span-1 border border-[var(--color-gray-800)]"
          style={{ background: "var(--color-gray-900)" }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-gray-500)", marginBottom: "2rem" }}>
            Discipline Score
          </div>
          <ScoreGauge score={score} scoreClass={scoreClass} />
          <div style={{ marginTop: "1.5rem", fontSize: "1.35rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
            {scoreLabel}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "var(--color-gray-400)", lineHeight: 1.6, padding: "0 1rem" }}>
            {data.summary}
          </div>
          <ScoreBreakdownBar breakdown={data.scoreBreakdown} />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="chart-card p-6 md:col-span-2 border border-[var(--color-gray-800)]"
          style={{ background: "var(--color-gray-900)" }}
        >
          <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold uppercase text-xs tracking-wider">
            <Brain size={16} />
            Psychological Profile
          </div>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                { subject: 'Discipline', A: score, fullMark: 100 },
                { subject: 'Patience', A: Math.min(100, score + (data.scoreBreakdown?.penalties.find(p => p.type === 'overtrading') ? -15 : 12)), fullMark: 100 },
                { subject: 'Risk Mgmt', A: Math.min(100, score + (data.scoreBreakdown?.penalties.find(p => p.type === 'stop_violation') ? -20 : 5)), fullMark: 100 },
                { subject: 'Execution', A: Math.min(100, Math.max(0, score - 8)), fullMark: 100 },
                { subject: 'Consistency', A: Math.min(100, Math.max(0, score - 3)), fullMark: 100 },
              ]}>
                <PolarGrid stroke="var(--color-gray-800)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-gray-400)', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Trader" dataKey="A" stroke="var(--color-brand-500)" fill="var(--color-brand-500)" fillOpacity={0.3} />
                <Tooltip contentStyle={{ background: 'var(--color-gray-900)', border: '1px solid var(--color-gray-800)', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="card-hover" style={{ padding: "1.75rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
          Score History
        </div>
        {history.length > 1 ? (
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="computedAt" tickFormatter={(d) => new Date(d).toLocaleDateString()} tick={{ fontSize: 12, fill: "var(--color-gray-500)" }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--color-gray-500)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "var(--radius-sm)", fontSize: 12 }} labelFormatter={(l: unknown) => new Date(l as string).toLocaleString()} />
                <Line type="monotone" dataKey="disciplineScore" stroke="var(--color-brand-500)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-brand-500)", stroke: "var(--color-gray-900)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "var(--color-gray-500)", padding: "2rem 0" }}>
            Not enough history yet. Keep trading to build your behavioral profile.
          </div>
        )}
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-200)", marginBottom: "1rem" }}>
          Violations & Patterns
        </div>
        {data.patterns.length === 0 ? (
          <div className="chart-card" style={{ textAlign: "center", padding: "3rem", color: "var(--color-gray-500)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✅</div>
            <div style={{ fontWeight: 600, color: "var(--color-gray-300)", fontSize: "1.1rem" }}>No severe patterns detected</div>
            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Keep trading your plan consistently.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {data.patterns.map((pattern) => (
              <PatternCard key={pattern.type} pattern={pattern} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function ScoreBreakdownBar({ breakdown }: { breakdown: BehavioralResult["scoreBreakdown"] }) {
  if (!breakdown || breakdown.penalties.length === 0) {
    return (
      <div style={{ marginTop: "1.25rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-profit)", marginBottom: "0.4rem" }}>
          No deductions — perfect discipline
        </div>
        <div style={{ background: "var(--color-gray-800)", borderRadius: 4, height: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", borderRadius: 4, background: "var(--color-profit)" }} />
        </div>
      </div>
    )
  }

  const segments = breakdown.penalties.map(p => ({
    label: p.label,
    width: (p.penalty * Math.min(p.count, 5) / 100) * 100,
    count: p.count,
    color: p.type === "stop_violation" ? "var(--color-loss)" : p.type === "revenge_trading" ? "var(--color-warning)" : "var(--color-info)",
  }))

  return (
    <div style={{ marginTop: "1.25rem", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gray-500)" }}>
          Score breakdown
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-loss)" }}>
          -{breakdown.totalPenalty} pts
        </div>
      </div>
      <div style={{ display: "flex", background: "var(--color-gray-800)", borderRadius: 4, height: 8, overflow: "hidden", width: "100%" }}>
        {segments.map((s, i) => (
          <div key={i} title={`${s.label}: -${s.count} occurrence(s)`} style={{ width: `${s.width}%`, background: s.color }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.6rem", fontSize: "0.75rem" }}>
        {breakdown.penalties.map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "var(--color-gray-400)" }}>
            <span>{p.label} <span style={{ color: "var(--color-gray-600)" }}>×{p.count}</span></span>
            <span style={{ fontWeight: 600, color: "var(--color-loss)" }}>-{p.penalty * Math.min(p.count, 5)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Score Gauge (SVG) ────────────────────────────────────────────────────────
function ScoreGauge({ score, scoreClass }: { score: number; scoreClass: string }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const arc = circumference * 0.75 // 270° arc
  const offset = arc - (score / 100) * arc

  const colorMap: Record<string, string> = {
    "score-excellent": "var(--color-profit)",
    "score-good": "#84cc16",
    "score-medium": "var(--color-warning)",
    "score-poor": "#f97316",
    "score-critical": "var(--color-loss)",
  }
  const strokeColor = colorMap[scoreClass] ?? "var(--color-gray-500)"

  return (
    <div style={{ position: "relative", width: "160px", height: "160px", margin: "0 auto" }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Track */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="var(--color-gray-800)"
          strokeWidth="12"
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(135 80 80)"
        />
        {/* Progress */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(135 80 80)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      {/* Score number */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: strokeColor, lineHeight: 1, marginTop: "0.5rem" }}>
          {score}
        </div>
      </div>
    </div>
  )
}

// ─── Pattern Card ─────────────────────────────────────────────────────────────
function PatternCard({ pattern }: { pattern: DetectedPattern }) {
  const severityColors = {
    low: { bg: "var(--color-gray-900)", border: "var(--color-gray-800)", icon: "⚠️", glow: "none" },
    medium: { bg: "rgba(245, 158, 11, 0.05)", border: "rgba(245, 158, 11, 0.3)", icon: "🔥", glow: "0 4px 20px rgba(245, 158, 11, 0.05)" },
    high: { bg: "rgba(239, 68, 68, 0.05)", border: "rgba(239, 68, 68, 0.3)", icon: "🚨", glow: "0 4px 20px rgba(239, 68, 68, 0.05)" },
  }

  const style = severityColors[pattern.severity]

  return (
    <div className="card-hover" style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: style.glow,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.4rem" }}>{style.icon}</span>
          <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-gray-100)", letterSpacing: "-0.01em" }}>{pattern.label}</span>
        </div>
        <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", padding: "0.3rem 0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.2)", color: pattern.severity === 'high' ? "var(--color-loss)" : "var(--color-warning)", letterSpacing: "0.05em", border: `1px solid ${style.border}` }}>
          {pattern.severity}
        </div>
      </div>
      
      <p style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", lineHeight: 1.6, marginBottom: "1.25rem", flex: 1 }}>
        {pattern.description}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-gray-800)", paddingTop: "1rem", marginTop: "auto" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Affected Trades</div>
          <div style={{ fontWeight: 800, color: "var(--color-gray-200)", fontSize: "1.1rem" }}>{pattern.count}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Impact (P&L)</div>
          <div style={{ fontWeight: 800, color: "var(--color-loss)", fontSize: "1.1rem" }}>
            {formatCurrency(pattern.impactPnl, "USD", true, 2)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ScoreSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
        <div className="skeleton card" style={{ flex: "1 1 300px", height: "350px" }} />
        <div className="skeleton card" style={{ flex: "1 1 300px", height: "350px" }} />
        <div className="skeleton card" style={{ flex: "1 1 300px", height: "350px" }} />
      </div>
      <div className="skeleton card" style={{ height: "300px" }} />
    </div>
  )
}
