"use client"

import { useState, useEffect } from "react"
import { Trophy, Lock, Rocket, Target, Activity, Zap, TrendingUp, LineChart, Flame, CalendarCheck, Shield, ShieldCheck, Banknote, BookOpen, BookOpenCheck, Crosshair } from "lucide-react"
import { toast } from "sonner"

type AchievementItem = {
  id: string
  code: string
  name: string
  description: string
  icon: string
  target: number
  unlocked: boolean
  unlockedAt: string | null
  earned: boolean
  progress: number
}

const CATEGORY_LABELS: Record<string, string> = {
  trading: "Trading",
  consistency: "Consistency",
  prop: "Prop Firm",
  journal: "Journal & Discipline",
}

function getAchievementIcon(code: string, locked: boolean) {
  const props = { size: 24, strokeWidth: 1.5, color: locked ? "var(--color-gray-500)" : "currentColor" }
  switch (code) {
    case "first_trade": return <Rocket {...props} />
    case "first_profit": return <Target {...props} />
    case "trades_25": return <Activity {...props} />
    case "trades_100": return <Zap {...props} />
    case "trades_500": return <Trophy {...props} />
    case "big_r": return <TrendingUp {...props} />
    case "profit_factor_2": return <LineChart {...props} />
    case "streak_5": return <Flame {...props} />
    case "streak_10": return <Flame {...props} />
    case "green_week": return <CalendarCheck {...props} />
    case "prop_active": return <Shield {...props} />
    case "prop_passed": return <ShieldCheck {...props} />
    case "payout_requested": return <Banknote {...props} />
    case "journal_7": return <BookOpen {...props} />
    case "journal_30": return <BookOpenCheck {...props} />
    case "discipline_perfect": return <Crosshair {...props} />
    default: return <Trophy {...props} />
  }
}

export function AchievementsSection() {
  const [groups, setGroups] = useState<{ category: string; achievements: AchievementItem[] }[]>([])
  const [total, setTotal] = useState(0)
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notified, setNotified] = useState(false)

  useEffect(() => {
    fetch("/api/achievements")
      .then(r => r.json())
      .then(d => {
        setGroups(d.groups || [])
        setTotal(d.total || 0)
        setUnlockedCount(d.unlockedCount || 0)
        if (!notified && Array.isArray(d.newlyUnlocked) && d.newlyUnlocked.length > 0) {
          toast.success(`Achievement${d.newlyUnlocked.length > 1 ? "s" : ""} unlocked!`)
          setNotified(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [notified])

  if (loading) {
    return <div className="card loading-skeleton" style={{ height: "180px" }} />
  }

  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0

  return (
    <div className="chart-card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header & Global Progress */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ padding: "0.6rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              <Trophy size={22} style={{ color: "var(--color-warning)" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-gray-100)", letterSpacing: "-0.02em" }}>Achievements</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>Unlock milestones on your trading journey.</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-gray-100)", fontVariantNumeric: "tabular-nums" }}>
              {unlockedCount}<span style={{ fontSize: "1.1rem", color: "var(--color-gray-500)", fontWeight: 600 }}>/{total}</span>
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
          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--color-warning)", width: "3.5ch", textAlign: "right" }}>{pct}%</span>
        </div>
      </div>

      <div style={{ width: "100%", height: "1px", background: "var(--color-gray-800)" }} />

      {groups.map(g => (
        <div key={g.category}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--color-gray-400)" }}>
              {CATEGORY_LABELS[g.category] || g.category}
            </h4>
            <div style={{ flex: 1, height: "1px", background: "var(--color-gray-800)" }} />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {g.achievements.map(a => {
              const pctProgress = a.target > 0 ? Math.min(100, Math.round((a.progress / a.target) * 100)) : a.earned ? 100 : 0
              const locked = !a.earned
              const isEarned = a.unlocked
              
              return (
                <div
                  key={a.id}
                  className="card-hover"
                  style={{
                    position: "relative",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "12px",
                    background: isEarned
                      ? "linear-gradient(145deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)"
                      : "var(--color-gray-900)",
                    border: isEarned
                      ? "1px solid rgba(245,158,11,0.3)"
                      : "1px solid var(--color-gray-800)",
                    boxShadow: isEarned ? "0 4px 20px rgba(245, 158, 11, 0.05)" : "none",
                    opacity: locked ? 0.7 : 1,
                    overflow: "hidden",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "10px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isEarned ? "rgba(245,158,11,0.15)" : "var(--color-gray-800)",
                      border: isEarned ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--color-gray-700)",
                      color: isEarned ? "#f59e0b" : "var(--color-gray-500)",
                      boxShadow: isEarned ? "inset 0 0 10px rgba(245,158,11,0.2)" : "none",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {getAchievementIcon(a.code, locked)}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                       <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                         <div style={{ fontSize: "0.95rem", fontWeight: 700, color: isEarned ? "var(--color-gray-100)" : "var(--color-gray-300)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                           {a.name}
                         </div>
                         {!a.unlocked && !locked && (
                           <Lock size={14} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
                         )}
                       </div>
                       <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                         {a.description}
                       </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    {!a.unlocked ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                           <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                             Progress
                           </span>
                           <span style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                             {a.progress} <span style={{ color: "var(--color-gray-600)" }}>/ {a.target}</span>
                           </span>
                        </div>
                        <div style={{ width: "100%", background: "var(--color-gray-800)", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pctProgress}%`, background: locked ? "var(--color-gray-600)" : "var(--color-warning)", borderRadius: "999px", transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "0.4rem 0.75rem", borderRadius: "6px", width: "fit-content", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#f59e0b", color: "#1a1206", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 800 }}>✓</div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Unlocked</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
