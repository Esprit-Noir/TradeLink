// components/behavioral/BehaviorScore.tsx
// Behavioral Score gauge + pattern cards
"use client"

import { useEffect, useState } from "react"
import type { BehavioralResult, DetectedPattern } from "@/lib/behavioral"

export function BehaviorScore() {
  const [data, setData] = useState<BehavioralResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/behavioral")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <ScoreSkeleton />
  if (!data) return null

  const score = data.disciplineScore
  const scoreClass = score >= 85 ? "score-excellent" : score >= 70 ? "score-good" : score >= 50 ? "score-medium" : score >= 30 ? "score-poor" : "score-critical"
  const scoreLabel = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : score >= 30 ? "Poor" : "Critical"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Score Card */}
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gray-500)", marginBottom: "1rem" }}>
          Discipline Score
        </div>
        <ScoreGauge score={score} scoreClass={scoreClass} />
        <div style={{ marginTop: "0.75rem", fontSize: "1rem", fontWeight: 600, color: "var(--color-gray-300)" }}>
          {scoreLabel}
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--color-gray-500)", maxWidth: 280, margin: "0.5rem auto 0" }}>
          {data.summary}
        </div>
      </div>

      {/* Patterns */}
      {data.patterns.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--color-gray-500)" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
          <div style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>No patterns detected</div>
          <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Keep trading your plan consistently.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gray-500)" }}>
            Detected Patterns
          </div>
          {data.patterns.map((pattern) => (
            <PatternCard key={pattern.type} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Score Gauge (SVG) ────────────────────────────────────────────────────────
function ScoreGauge({ score, scoreClass }: { score: number; scoreClass: string }) {
  const radius = 56
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
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="var(--color-gray-800)"
          strokeWidth="10"
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(135 70 70)"
        />
        {/* Progress */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(135 70 70)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      {/* Score number */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
      }}>
        <span className={scoreClass} style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", fontWeight: 600 }}>/100</span>
      </div>
    </div>
  )
}

// ─── Pattern Card ─────────────────────────────────────────────────────────────
function PatternCard({ pattern }: { pattern: DetectedPattern }) {
  const [expanded, setExpanded] = useState(false)

  const severityColor = {
    low: "var(--color-warning)",
    medium: "#f97316",
    high: "var(--color-loss)",
  }[pattern.severity]

  const severityBg = {
    low: "rgba(245, 158, 11, 0.1)",
    medium: "rgba(249, 115, 22, 0.1)",
    high: "rgba(239, 68, 68, 0.1)",
  }[pattern.severity]

  return (
    <div
      className="card card-hover"
      onClick={() => setExpanded(!expanded)}
      style={{ cursor: "pointer", borderColor: expanded ? "var(--color-gray-700)" : undefined }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        {/* Severity indicator */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: severityBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 2,
        }}>
          <span style={{ color: severityColor, fontSize: "1rem" }}>
            {pattern.severity === "high" ? "⚠️" : pattern.severity === "medium" ? "🔸" : "💡"}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-gray-200)" }}>
              {pattern.label}
            </span>
            <span className="badge" style={{
              background: severityBg,
              color: severityColor,
              border: `1px solid ${severityColor}30`,
            }}>
              {pattern.severity}
            </span>
            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
              {pattern.count}× detected
            </span>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginTop: "0.35rem", lineHeight: 1.5 }}>
            {pattern.description}
          </p>

          {/* Impact P&L */}
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                P&L Impact
              </span>
              <div style={{
                fontWeight: 700, fontSize: "0.95rem",
                color: pattern.impactPnl < 0 ? "var(--color-loss)" : "var(--color-profit)",
              }}>
                {pattern.impactPnl >= 0 ? "+" : ""}${Math.abs(pattern.impactPnl).toLocaleString()}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Trades Affected
              </span>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-gray-300)" }}>
                {pattern.affectedTradeIds.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded: list of affected trades */}
      {expanded && pattern.affectedTradeIds.length > 0 && (
        <div style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--color-gray-800)",
        }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.5rem" }}>
            Affected Trade IDs
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {pattern.affectedTradeIds.slice(0, 10).map((id) => (
              <a
                key={id}
                href={`/trades/${id}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "0.7rem",
                  background: "var(--color-gray-800)",
                  color: "var(--color-brand-300)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  textDecoration: "none",
                }}
              >
                {id.slice(-8)}
              </a>
            ))}
            {pattern.affectedTradeIds.length > 10 && (
              <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", padding: "0.2rem 0.5rem" }}>
                +{pattern.affectedTradeIds.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="skeleton" style={{ height: 200 }} />
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 120 }} />
    </div>
  )
}
