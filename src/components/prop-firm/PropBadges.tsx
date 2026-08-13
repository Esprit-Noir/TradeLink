"use client"

import { useEffect, useState } from "react"

type Report = {
  total: number
  passed: number
  breached: number
  passRate: number
  payoutsPaid: number
  activeChallenges?: ActiveChallenge[]
}

type ActiveChallenge = {
  id: string
  firmName: string
  logoUrl: string | null
  phase: string
  accountName: string
  currentBalance: number
  profitPct: number
  profitTargetPct: number
  profitReachedPct: number
  maxDDPct: number
  ddUsedPct: number
  minTradingDays: number
  daysTraded: number
}

const PHASE_LABEL: Record<string, string> = {
  phase_1: "Phase 1",
  phase_2: "Phase 2",
  funded: "Funded",
  evaluation: "Evaluation",
}

type Badge = {
  id: string
  emoji: string
  label: string
  desc: string
  earned: boolean
}

export function PropBadges() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([])

  useEffect(() => {
    fetch("/api/prop-firms/report")
      .then(r => r.json())
      .then((r: Report) => {
        setActiveChallenges(r.activeChallenges || [])
        const list: Badge[] = [
          { id: "first", emoji: "🎯", label: "First Challenge", desc: "Create your first prop challenge", earned: r.total >= 1 },
          { id: "pass", emoji: "✅", label: "First Pass", desc: "Pass your first phase", earned: r.passed >= 1 },
          { id: "comeback", emoji: "🔁", label: "Comeback", desc: "Pass after a breach", earned: r.passed >= 1 && r.breached >= 1 },
          { id: "payout", emoji: "💰", label: "Payout", desc: "Receive your first payout", earned: r.payoutsPaid > 0 },
          { id: "passrate", emoji: "📈", label: "50%+ Pass Rate", desc: "Keep your pass rate above 50%", earned: r.total > 0 && r.passRate >= 50 },
        ]
        setBadges(list)
      })
      .catch(() => {})
  }, [])

  if (badges.length === 0) return null

  const earnedCount = badges.filter(b => b.earned).length
  const pct = (earnedCount / badges.length) * 100

  return (
    <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.15rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Achievements</div>
        <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
          {earnedCount} / {badges.length} unlocked
        </div>
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "1.1rem" }}>
        Milestones earned on your prop-firm journey.
      </div>

      <div style={{ marginBottom: "1.25rem", height: "5px", borderRadius: "3px", background: "var(--color-gray-800)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: "3px",
          background: "linear-gradient(90deg, #d97706, #fbbf24)",
          transition: "width 500ms ease",
        }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.85rem" }}>
        {badges.map(b => {
          const isEarned = b.earned
          return (
            <div
              key={b.id}
              title={b.desc}
              style={{
                position: "relative",
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "1.15rem 0.75rem", textAlign: "center",
                borderRadius: "14px",
                background: isEarned
                  ? "linear-gradient(145deg, rgba(245,158,11,0.10), rgba(245,158,11,0.03))"
                  : "var(--color-gray-900)",
                border: isEarned
                  ? "1px solid rgba(245,158,11,0.35)"
                  : "1px dashed var(--color-gray-800)",
                boxShadow: isEarned ? "0 0 22px rgba(245,158,11,0.10)" : "none",
                transition: "all 200ms ease",
                cursor: "default",
              }}
            >
              {/* emblem */}
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%", marginBottom: "0.6rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isEarned ? "rgba(245,158,11,0.15)" : "var(--color-gray-800)",
                border: isEarned ? "2px solid #f59e0b" : "2px solid var(--color-gray-700)",
                boxShadow: isEarned ? "0 0 0 4px rgba(245,158,11,0.12), inset 0 0 14px rgba(245,158,11,0.25)" : "none",
              }}>
                <span style={{ fontSize: "1.5rem", filter: isEarned ? "none" : "grayscale(1)", opacity: isEarned ? 1 : 0.45 }}>
                  {b.emoji}
                </span>
              </div>

              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isEarned ? "var(--color-gray-100)" : "var(--color-gray-400)" }}>
                {b.label}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", marginTop: "0.2rem", lineHeight: 1.35 }}>
                {b.desc}
              </div>

              {/* status chip */}
              <div style={{
                marginTop: "0.7rem", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.05em",
                padding: "0.25rem 0.65rem", borderRadius: "999px",
                color: isEarned ? "#fbbf24" : "var(--color-gray-500)",
                background: isEarned ? "rgba(245,158,11,0.12)" : "var(--color-gray-800)",
                border: `1px solid ${isEarned ? "rgba(245,158,11,0.4)" : "var(--color-gray-700)"}`,
                textTransform: "uppercase",
              }}>
                {isEarned ? "Unlocked" : "Locked"}
              </div>

              {/* corner check for earned */}
              {isEarned && (
                <div style={{
                  position: "absolute", top: "0.45rem", right: "0.45rem",
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "#f59e0b", color: "#1a1206",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.62rem", fontWeight: 800,
                }}>
                  ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

      {activeChallenges.length > 0 && (
        <>
          <div style={{ height: "1px", background: "var(--color-gray-800)", margin: "1.5rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.15rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Active Challenges</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
              {activeChallenges.length} running
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.9rem" }}>
            Live progress of the challenges currently in play.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.85rem" }}>
            {activeChallenges.map(c => {
              const ddColor = c.ddUsedPct >= 85 ? "var(--color-loss)" : c.ddUsedPct >= 60 ? "var(--color-warning)" : "var(--color-profit)"
              const ddBg = c.ddUsedPct >= 85 ? "rgba(239,68,68,0.15)" : c.ddUsedPct >= 60 ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)"
              return (
                <div key={c.id} style={{
                  padding: "0.9rem", borderRadius: "12px",
                  background: "var(--color-gray-900)",
                  border: "1px solid var(--color-gray-800)",
                }}>
                  {/* header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.7rem" }}>
                    {c.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt={c.firmName} style={{ width: 22, height: 22, borderRadius: 6, objectFit: "contain" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-gray-100)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.firmName}
                      </div>
                      <div style={{ fontSize: "0.66rem", color: "var(--color-gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.accountName}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "0.62rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px",
                      color: "var(--color-brand-400)", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
                    }}>
                      {PHASE_LABEL[c.phase] || c.phase.replace("_", " ")}
                    </span>
                  </div>

                  {/* profit progress */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>
                    <span>Profit target ({c.profitTargetPct}%)</span>
                    <span style={{ fontWeight: 700, color: c.profitPct >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {c.profitPct >= 0 ? "+" : ""}{c.profitPct}%
                    </span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: "var(--color-gray-800)", overflow: "hidden", marginBottom: "0.65rem" }}>
                    <div style={{
                      height: "100%", width: `${Math.min(100, c.profitReachedPct)}%`, borderRadius: "3px",
                      background: c.profitReachedPct >= 100 ? "var(--color-profit)" : "var(--color-brand-500)",
                      transition: "width 400ms ease",
                    }} />
                  </div>

                  {/* drawdown progress */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>
                    <span>Max drawdown used</span>
                    <span style={{ fontWeight: 700, color: ddColor }}>{c.ddUsedPct}%</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: "var(--color-gray-800)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${Math.min(100, c.ddUsedPct)}%`, borderRadius: "3px",
                      background: ddBg, border: `1px solid ${ddColor}`, opacity: 0.9,
                      transition: "width 400ms ease",
                    }} />
                  </div>

                  {/* footer stats */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.65rem", fontSize: "0.66rem", color: "var(--color-gray-500)" }}>
                    <span>Balance ${c.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                    <span>Traded {c.daysTraded}/{c.minTradingDays} days</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
