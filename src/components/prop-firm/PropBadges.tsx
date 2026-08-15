"use client"

import { useEffect, useState } from "react"
import { Target, CheckCircle, RefreshCcw, BadgeDollarSign, TrendingUp } from "lucide-react"

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
  icon: React.ReactNode
  label: string
  desc: string
  earned: boolean
}

export function PropBadges() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/prop-firms/report")
      .then(r => r.json())
      .then((r: Report) => {
        setActiveChallenges(r.activeChallenges || [])
        const list: Badge[] = [
          { id: "first", icon: <Target size={24} />, label: "First Challenge", desc: "Create your first prop challenge", earned: r.total >= 1 },
          { id: "pass", icon: <CheckCircle size={24} />, label: "First Pass", desc: "Pass your first phase", earned: r.passed >= 1 },
          { id: "comeback", icon: <RefreshCcw size={24} />, label: "Comeback", desc: "Pass after a breach", earned: r.passed >= 1 && r.breached >= 1 },
          { id: "payout", icon: <BadgeDollarSign size={24} />, label: "Payout", desc: "Receive your first payout", earned: r.payoutsPaid > 0 },
          { id: "passrate", icon: <TrendingUp size={24} />, label: "50%+ Pass Rate", desc: "Keep your pass rate above 50%", earned: r.total > 0 && r.passRate >= 50 },
        ]
        setBadges(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="skeleton" style={{ height: 120 }} />
  if (badges.length === 0) return null

  const earnedCount = badges.filter(b => b.earned).length
  const pct = (earnedCount / badges.length) * 100

  return (
    <div style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-gray-100)" }}>Achievements</div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-gray-500)" }}>
          {earnedCount} / {badges.length} unlocked
        </div>
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        Milestones earned on your prop-firm journey.
      </div>

      <div style={{ marginBottom: "1.5rem", height: "4px", borderRadius: "2px", background: "var(--color-gray-800)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: "2px",
          background: "#fbbf24",
          transition: "width 500ms ease",
        }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
        {badges.map(b => {
          const isEarned = b.earned
          return (
            <div
              key={b.id}
              title={b.desc}
              style={{
                position: "relative",
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "1.25rem 0.75rem", textAlign: "center",
                borderRadius: "8px",
                background: isEarned
                  ? "rgba(245,158,11,0.05)"
                  : "var(--color-gray-900)",
                border: isEarned
                  ? "1px solid rgba(245,158,11,0.3)"
                  : "1px solid var(--color-gray-800)",
                transition: "all 200ms ease",
                cursor: "default",
              }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%", marginBottom: "0.75rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isEarned ? "rgba(245,158,11,0.15)" : "var(--color-gray-800)",
                border: isEarned ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--color-gray-700)",
                color: isEarned ? "#f59e0b" : "var(--color-gray-500)",
              }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: isEarned ? 1 : 0.6 }}>
                  {b.icon}
                </span>
              </div>

              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isEarned ? "var(--color-gray-100)" : "var(--color-gray-400)" }}>
                {b.label}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", marginTop: "0.25rem", lineHeight: 1.35 }}>
                {b.desc}
              </div>

              {/* status chip */}
              <div style={{
                marginTop: "0.85rem", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em",
                padding: "0.25rem 0.6rem", borderRadius: "4px",
                color: isEarned ? "#fbbf24" : "var(--color-gray-500)",
                background: isEarned ? "rgba(245,158,11,0.12)" : "var(--color-gray-800)",
                border: `1px solid ${isEarned ? "rgba(245,158,11,0.2)" : "var(--color-gray-700)"}`,
                textTransform: "uppercase",
              }}>
                {isEarned ? "Unlocked" : "Locked"}
              </div>

              {/* corner check for earned */}
              {isEarned && (
                <div style={{
                  position: "absolute", top: "0.5rem", right: "0.5rem",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: "#f59e0b", color: "#1a1206",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 800,
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
          <div style={{ height: "1px", background: "var(--color-gray-800)", margin: "1.75rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-gray-100)" }}>Active Challenges</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-gray-500)" }}>
              {activeChallenges.length} running
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
            Live progress of the challenges currently in play.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.75rem" }}>
            {activeChallenges.map(c => {
              const ddColor = c.ddUsedPct >= 85 ? "var(--color-loss)" : c.ddUsedPct >= 60 ? "var(--color-warning)" : "var(--color-profit)"
              const ddBg = c.ddUsedPct >= 85 ? "rgba(239,68,68,0.2)" : c.ddUsedPct >= 60 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"
              return (
                <div key={c.id} style={{
                  padding: "1rem", borderRadius: "8px",
                  background: "var(--color-gray-900)",
                  border: "1px solid var(--color-gray-800)",
                }}>
                  {/* header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt={c.firmName} style={{ width: 20, height: 20, borderRadius: 4, objectFit: "contain" }} />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--color-gray-800)" }} />
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
                      fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "4px",
                      color: "var(--color-brand-400)", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", textTransform: "uppercase"
                    }}>
                      {PHASE_LABEL[c.phase] || c.phase.replace("_", " ")}
                    </span>
                  </div>

                  {/* profit progress */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", fontWeight: 600, color: "var(--color-gray-400)", marginBottom: "0.35rem" }}>
                    <span>Profit target ({c.profitTargetPct}%)</span>
                    <span style={{ color: c.profitPct >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {c.profitPct >= 0 ? "+" : ""}{c.profitPct}%
                    </span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "var(--color-gray-800)", overflow: "hidden", marginBottom: "0.85rem" }}>
                    <div style={{
                      height: "100%", width: `${Math.min(100, c.profitReachedPct)}%`, borderRadius: "2px",
                      background: c.profitReachedPct >= 100 ? "var(--color-profit)" : "var(--color-brand-500)",
                      transition: "width 400ms ease",
                    }} />
                  </div>

                  {/* drawdown progress */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", fontWeight: 600, color: "var(--color-gray-400)", marginBottom: "0.35rem" }}>
                    <span>Max drawdown used</span>
                    <span style={{ color: ddColor }}>{c.ddUsedPct}%</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "var(--color-gray-800)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${Math.min(100, c.ddUsedPct)}%`, borderRadius: "2px",
                      background: ddBg, opacity: 0.9,
                      transition: "width 400ms ease",
                    }} />
                  </div>

                  {/* footer stats */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.85rem", paddingTop: "0.65rem", borderTop: "1px solid var(--color-gray-800)", fontSize: "0.66rem", fontWeight: 600, color: "var(--color-gray-500)" }}>
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
