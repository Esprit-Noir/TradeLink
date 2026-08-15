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
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <Trophy size={16} style={{ color: "var(--color-warning)" }} />
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Achievements</h3>
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-gray-400)" }}>
          {unlockedCount}/{total} unlocked
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, background: "var(--color-gray-800)", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: "6px", background: "linear-gradient(90deg, var(--color-brand-500), var(--color-warning))", transition: "width 400ms ease" }} />
        </div>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-gray-300)" }}>{pct}%</span>
      </div>

      {groups.map(g => (
        <div key={g.category} style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.6rem" }}>
            {CATEGORY_LABELS[g.category] || g.category}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.75rem" }}>
            {g.achievements.map(a => {
              const pctProgress = a.target > 0 ? Math.min(100, Math.round((a.progress / a.target) * 100)) : a.earned ? 100 : 0
              const locked = !a.earned
              const isEarned = a.unlocked
              
              return (
                <div
                  key={a.id}
                  style={{
                    position: "relative",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "8px",
                    background: isEarned
                      ? "rgba(245,158,11,0.05)"
                      : "var(--color-gray-900)",
                    border: isEarned
                      ? "1px solid rgba(245,158,11,0.3)"
                      : "1px solid var(--color-gray-800)",
                    opacity: locked ? 0.6 : 1,
                    transition: "all 200ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isEarned ? "rgba(245,158,11,0.15)" : "var(--color-gray-800)",
                      border: isEarned ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--color-gray-700)",
                      color: isEarned ? "#f59e0b" : "var(--color-gray-500)",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: isEarned ? 1 : 0.6 }}>
                        {getAchievementIcon(a.code, locked)}
                      </span>
                    </div>

                    {!a.unlocked && !locked && (
                      <Lock size={14} style={{ color: "var(--color-warning)" }} />
                    )}
                  </div>

                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isEarned ? "var(--color-gray-100)" : "var(--color-gray-300)" }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", marginTop: "0.25rem", lineHeight: 1.35, flex: 1 }}>
                    {a.description}
                  </div>

                  {/* status chip */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "1rem" }}>
                    <div style={{
                      fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em",
                      padding: "0.25rem 0.6rem", borderRadius: "4px",
                      color: isEarned ? "#fbbf24" : "var(--color-gray-500)",
                      background: isEarned ? "rgba(245,158,11,0.12)" : "var(--color-gray-800)",
                      border: `1px solid ${isEarned ? "rgba(245,158,11,0.2)" : "var(--color-gray-700)"}`,
                      textTransform: "uppercase",
                    }}>
                      {a.unlocked ? "Unlocked" : locked ? "Locked" : "Earned — open again"}
                    </div>
                  </div>

                  {/* Progress bar if locked */}
                  {!a.unlocked && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <div style={{ flex: 1, background: "var(--color-gray-800)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pctProgress}%`, background: locked ? "var(--color-gray-600)" : "var(--color-warning)", borderRadius: "4px" }} />
                      </div>
                      <span style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {a.progress}/{a.target}
                      </span>
                    </div>
                  )}
                  
                  {/* corner check for earned */}
                  {isEarned && (
                    <div style={{
                      position: "absolute", top: "0.75rem", right: "0.75rem",
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
        </div>
      ))}
    </div>
  )
}
