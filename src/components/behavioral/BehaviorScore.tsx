// components/behavioral/BehaviorScore.tsx
// Behavioral Score gauge + pattern cards + advanced metrics
"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts"
import type { BehavioralResult, DetectedPattern, EmotionCost, SetupPerformance } from "@/lib/behavioral"

export function BehaviorScore() {
  const [data, setData] = useState<BehavioralResult & { history?: any[] } | null>(null)
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
      
      {/* TOP ROW: 3 Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
        
        {/* 1. Score Card */}
        <div className="card" style={{ flex: "1 1 300px", textAlign: "center", padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
        </div>

        {/* 2. Emotion Costs */}
        <div className="card" style={{ flex: "1 1 300px", padding: "2rem 1.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
            Cost of Emotions (Tilt)
          </div>
          {data.emotionCosts && data.emotionCosts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, justifyContent: "center" }}>
              {data.emotionCosts.map((ec) => (
                <div key={ec.tag} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--color-gray-900)", borderRadius: "var(--radius-card)", border: "1px solid var(--color-gray-800)" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-gray-100)", textTransform: "capitalize", fontSize: "1.05rem" }}>{ec.tag}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>Occurred in {ec.count} losing trades</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--color-loss)", fontSize: "1.25rem" }}>
                    -${ec.totalLoss.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-gray-500)", padding: "2rem 0", background: "var(--color-gray-900)", borderRadius: "var(--radius-card)", border: "1px dashed var(--color-gray-800)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.8 }}>🧘‍♂️</div>
              <div style={{ fontWeight: 600, color: "var(--color-gray-400)", fontSize: "1rem" }}>Zen Mode</div>
              <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>No emotion-driven losses recorded.</div>
            </div>
          )}
        </div>

        {/* 3. Setup Performance */}
        <div className="card" style={{ flex: "1 1 300px", padding: "2rem 1.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
            Setup Performance
          </div>
          {data.setupPerformance && data.setupPerformance.length > 0 ? (
            <div style={{ flex: 1, minHeight: "240px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.setupPerformance} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="tag" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 13, fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: "var(--color-gray-800)" }}
                    contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "var(--radius-card)", padding: "0.75rem" }}
                    formatter={(val: number) => [`$${val.toFixed(2)}`, "Net P&L"]}
                  />
                  <Bar dataKey="netPnl" radius={[0, 6, 6, 0]} barSize={32}>
                    {data.setupPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-gray-500)", padding: "2rem 0", background: "var(--color-gray-900)", borderRadius: "var(--radius-card)", border: "1px dashed var(--color-gray-800)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.8 }}>📊</div>
              <div style={{ fontWeight: 600, color: "var(--color-gray-400)", fontSize: "1rem" }}>No Data Yet</div>
              <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Start tagging your trades to see performance.</div>
            </div>
          )}
        </div>
      </div>

      {/* 4. History Chart */}
      <div className="card" style={{ padding: "1.5rem", gridColumn: "1 / -1" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
          Score History
        </div>
        {data.history && data.history.length > 1 ? (
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history}>
                <XAxis 
                  dataKey="computedAt" 
                  tickFormatter={(d) => new Date(d).toLocaleDateString()} 
                  tick={{ fontSize: 12, fill: "var(--color-gray-500)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fill: "var(--color-gray-500)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    background: "var(--color-gray-900)",
                    border: "1px solid var(--color-gray-700)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12,
                  }}
                  labelFormatter={(l: any) => new Date(l).toLocaleString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="disciplineScore" 
                  stroke="var(--color-brand-500)" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--color-brand-500)", stroke: "var(--color-gray-900)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "var(--color-gray-500)", padding: "2rem 0" }}>
            Not enough history yet. Keep trading to build your behavioral profile.
          </div>
        )}
      </div>

      {/* 5. Detected Patterns */}
      <div style={{ gridColumn: "1 / -1" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-200)", marginBottom: "1rem" }}>
          Violations & Patterns
        </div>
        {data.patterns.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--color-gray-500)" }}>
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
    low: { bg: "var(--color-gray-900)", border: "var(--color-gray-700)", icon: "⚠️" },
    medium: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", icon: "🔥" },
    high: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", icon: "🚨" },
  }

  const style = severityColors[pattern.severity]

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: "var(--radius-card)",
      padding: "1.25rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>{style.icon}</span>
          <span style={{ fontWeight: 600, color: "var(--color-gray-200)" }}>{pattern.label}</span>
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.2)", color: pattern.severity === 'high' ? "var(--color-loss)" : "var(--color-warning)" }}>
          {pattern.severity}
        </div>
      </div>
      
      <p style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", lineHeight: 1.5, marginBottom: "1rem" }}>
        {pattern.description}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600 }}>Affected Trades</div>
          <div style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>{pattern.count}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600 }}>Impact (P&L)</div>
          <div style={{ fontWeight: 700, color: "var(--color-loss)" }}>
            {pattern.impactPnl < 0 ? "-" : ""}${Math.abs(pattern.impactPnl).toFixed(2)}
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
