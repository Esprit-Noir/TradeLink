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
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Achievements Section */}
      <div className="chart-card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ padding: "0.6rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                <Target size={22} style={{ color: "var(--color-warning)" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-gray-100)", letterSpacing: "-0.02em" }}>Achievements</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>Milestones earned on your prop-firm journey.</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-gray-100)", fontVariantNumeric: "tabular-nums" }}>
                {earnedCount}<span style={{ fontSize: "1.1rem", color: "var(--color-gray-500)", fontWeight: 600 }}>/{badges.length}</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.15rem" }}>Unlocked</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1, background: "var(--color-gray-900)", borderRadius: "999px", height: "10px", overflow: "hidden", border: "1px solid var(--color-gray-800)", position: "relative" }}>
              <div style={{ 
                height: "100%", width: `${pct}%`, borderRadius: "999px", 
                background: "linear-gradient(90deg, #f59e0b, #fbbf24)", 
                boxShadow: "0 0 10px rgba(245, 158, 11, 0.5)",
                transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" 
              }} />
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--color-warning)", width: "3.5ch", textAlign: "right" }}>{Math.round(pct)}%</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {badges.map(b => {
            const isEarned = b.earned
            return (
              <div
                key={b.id}
                title={b.desc}
                className="card-hover"
                style={{
                  position: "relative",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "1.5rem 1rem", textAlign: "center",
                  borderRadius: "12px",
                  background: isEarned
                    ? "linear-gradient(145deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)"
                    : "var(--color-gray-900)",
                  border: isEarned
                    ? "1px solid rgba(245,158,11,0.3)"
                    : "1px solid var(--color-gray-800)",
                  boxShadow: isEarned ? "0 4px 20px rgba(245, 158, 11, 0.05)" : "none",
                  opacity: !isEarned ? 0.7 : 1,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "default",
                }}
              >
                <div style={{
                  width: "56px", height: "56px", borderRadius: "12px", marginBottom: "1rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isEarned ? "rgba(245,158,11,0.15)" : "var(--color-gray-800)",
                  border: isEarned ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--color-gray-700)",
                  color: isEarned ? "#f59e0b" : "var(--color-gray-500)",
                  boxShadow: isEarned ? "inset 0 0 10px rgba(245,158,11,0.2)" : "none",
                }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: isEarned ? 1 : 0.6 }}>
                    {b.icon}
                  </span>
                </div>

                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: isEarned ? "var(--color-gray-100)" : "var(--color-gray-400)" }}>
                  {b.label}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.35rem", lineHeight: 1.4, flex: 1 }}>
                  {b.desc}
                </div>

                {isEarned ? (
                  <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "0.4rem 0.75rem", borderRadius: "6px", width: "fit-content", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#f59e0b", color: "#1a1206", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 800 }}>✓</div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Unlocked</span>
                  </div>
                ) : (
                  <div style={{
                    marginTop: "1.25rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em",
                    padding: "0.35rem 0.75rem", borderRadius: "6px",
                    color: "var(--color-gray-500)",
                    background: "var(--color-gray-800)",
                    border: "1px solid var(--color-gray-700)",
                    textTransform: "uppercase",
                  }}>
                    Locked
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Challenges Section */}
      {activeChallenges.length > 0 && (
        <div className="chart-card" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-gray-100)", letterSpacing: "-0.02em" }}>Active Challenges</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>Live progress of the challenges currently in play.</p>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-brand-500)", fontVariantNumeric: "tabular-nums" }}>
              {activeChallenges.length} <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", verticalAlign: "middle" }}>running</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            {activeChallenges.map(c => {
              const ddColor = c.ddUsedPct >= 85 ? "var(--color-loss)" : c.ddUsedPct >= 60 ? "var(--color-warning)" : "var(--color-profit)"
              const ddBg = c.ddUsedPct >= 85 ? "linear-gradient(90deg, rgba(239,68,68,0.4), var(--color-loss))" : c.ddUsedPct >= 60 ? "linear-gradient(90deg, rgba(245,158,11,0.4), var(--color-warning))" : "linear-gradient(90deg, rgba(0,199,88,0.4), var(--color-profit))"
              return (
                <div key={c.id} className="card-hover" style={{
                  padding: "1.25rem", borderRadius: "12px",
                  background: "var(--color-gray-900)",
                  border: "1px solid var(--color-gray-800)",
                  display: "flex", flexDirection: "column", gap: "1rem"
                }}>
                  {/* header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt={c.firmName} style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", background: "white" }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--color-gray-800)" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-gray-100)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.firmName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.accountName}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 800, padding: "0.3rem 0.6rem", borderRadius: "6px",
                      color: "var(--color-brand-400)", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", textTransform: "uppercase", letterSpacing: "0.05em"
                    }}>
                      {PHASE_LABEL[c.phase] || c.phase.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    {/* profit progress */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-gray-400)", marginBottom: "0.5rem" }}>
                      <span>Profit target ({c.profitTargetPct}%)</span>
                      <span style={{ color: c.profitPct >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                        {c.profitPct >= 0 ? "+" : ""}{c.profitPct}%
                      </span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "999px", background: "var(--color-gray-800)", overflow: "hidden", marginBottom: "1rem" }}>
                      <div style={{
                        height: "100%", width: `${Math.min(100, c.profitReachedPct)}%`, borderRadius: "999px",
                        background: c.profitReachedPct >= 100 ? "var(--color-profit)" : "linear-gradient(90deg, rgba(139,92,246,0.4), var(--color-brand-500))",
                        transition: "width 0.5s ease",
                      }} />
                    </div>

                    {/* drawdown progress */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-gray-400)", marginBottom: "0.5rem" }}>
                      <span>Max drawdown used</span>
                      <span style={{ color: ddColor }}>{c.ddUsedPct}%</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "999px", background: "var(--color-gray-800)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${Math.min(100, c.ddUsedPct)}%`, borderRadius: "999px",
                        background: ddBg, opacity: 1,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>

                  {/* footer stats */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.85rem", borderTop: "1px solid var(--color-gray-800)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-gray-500)" }}>
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-600)" }}>Balance</span>
                      <span style={{ color: "var(--color-gray-300)", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}>${c.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
                      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-600)" }}>Traded</span>
                      <span style={{ color: "var(--color-gray-300)", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}>{c.daysTraded} <span style={{ color: "var(--color-gray-600)", fontSize: "0.75rem" }}>/ {c.minTradingDays} days</span></span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
