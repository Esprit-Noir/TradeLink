"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"
import { MarketOverview } from "./MarketOverview"
import { WorldSessionsMap } from "./WorldSessionsMap"
import { TrendingUp, BarChart3, Target, Activity, ArrowRight, Plus, BookOpen, Calendar, LineChart, Clock, Award, Upload } from "lucide-react"
import Link from "next/link"

const QUOTES = [
  { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { text: "It's not about being right, it's about making money.", author: "Mark Douglas" },
  { text: "The market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Plan your trade, trade your plan.", author: "" },
  { text: "Losses are part of the business. The key is to keep them small.", author: "" },
]

interface OverviewStats {
  totalTrades: number
  winRate: number
  netPnl: number
  profitFactor: number
  grossProfit: number
  grossLoss: number
  recentTrades: {
    id: string
    symbol: string
    side: string
    entryAt: string | null
    netPnl: number
    instrumentType: string
  }[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

export function OverviewClient({ username }: { username?: string }) {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [quote] = useState(() => {
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    return QUOTES[seed % QUOTES.length]
  })

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/overview/stats?accountId=all", { signal: controller.signal })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const today = new Date()
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" })
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  const quickStats = [
    { label: "Total Trades", value: stats?.totalTrades?.toLocaleString() ?? "—", icon: BarChart3, color: "var(--color-info)" },
    { label: "Win Rate", value: stats?.winRate != null ? `${stats.winRate}%` : "—", icon: Target, color: "var(--color-warning)" },
    { label: "Net P&L", value: stats?.netPnl != null ? formatCurrency(stats.netPnl, "USD", true) : "—", icon: TrendingUp, color: (stats?.netPnl ?? 0) >= 0 ? "var(--color-profit)" : "var(--color-loss)" },
    { label: "Profit Factor", value: stats?.profitFactor != null ? stats.profitFactor.toFixed(2) : "—", icon: Activity, color: "#8B5CF6" },
  ]

  const winnersCount = stats?.totalTrades ? Math.round(stats.totalTrades * (stats.winRate / 100)) : 0
  const losersCount = (stats?.totalTrades || 0) - winnersCount
  const avgWin = winnersCount > 0 && stats ? stats.grossProfit / winnersCount : 0
  const avgLoss = losersCount > 0 && stats ? stats.grossLoss / losersCount : 0
  const riskReward = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? "99" : "0")

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Hero Greeting */}
      <motion.div variants={itemVariants} className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gray-400)", fontWeight: 600, marginBottom: 6 }}>
              {dayName}, {dateStr}
            </p>
            <h1 className="page-title">
              {loading ? (
                <div className="skeleton" style={{ width: 250, height: 36, display: "inline-block" }} />
              ) : (
                `Welcome back${username ? `, ${username}` : ""}`
              )}
            </h1>
            <p className="page-subtitle">Your trading performance at a glance</p>
          </div>
          <div style={{ maxWidth: 320, textAlign: "right" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", fontStyle: "italic", lineHeight: 1.6 }}>
              &ldquo;{quote.text}&rdquo;
            </p>
            {quote.author && (
              <p style={{ fontSize: "0.7rem", color: "var(--color-brand-500)", fontWeight: 600, marginTop: 6 }}>
                &mdash; {quote.author}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="kpi-grid" style={{ marginBottom: 0 }}>
        {quickStats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card card-hover" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 130 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gray-400)", fontWeight: 600 }}>{s.label}</p>
                <div style={{ color: s.color }}><Icon size={16} /></div>
              </div>
              {loading ? (
                <div className="skeleton" style={{ width: 64, height: 28 }} />
              ) : (
                <p style={{ fontSize: "1.75rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: s.color }}>{s.value}</p>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Row 1: Market Sessions & Quick Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
        {/* World Sessions Map (Takes up ~66% space) */}
        <motion.div variants={itemVariants} className="card" style={{ flex: "2 1 450px", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <WorldSessionsMap />
        </motion.div>

        {/* Quick Actions + At a Glance (Takes up ~33% space) */}
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <motion.div variants={itemVariants} className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: "1rem" }}>&#9889;</span>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)" }}>Quick Actions</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, justifyContent: "space-evenly" }}>
              {[
                { href: "/trades", icon: Plus, color: "var(--color-profit)", bg: "var(--color-profit-muted)", label: "New Trade", desc: "Log a trade" },
                { href: `/journal/${today.toISOString().split("T")[0]}`, icon: BookOpen, color: "var(--color-info)", bg: "rgba(59,130,246,0.12)", label: "Journal Entry", desc: "Write a note" },
                { href: "/stats", icon: LineChart, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", label: "Analytics", desc: "Deep dive" },
                { href: "/calendar", icon: Calendar, color: "var(--color-warning)", bg: "rgba(245,158,11,0.12)", label: "Calendar", desc: "See today" },
              ].map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.href} href={a.href} className="card card-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem", textDecoration: "none" }}>
                    <div style={{ padding: 6, borderRadius: 8, background: a.bg }}>
                      <Icon size={16} style={{ color: a.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-gray-200)" }}>{a.label}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{a.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>

          {(stats?.totalTrades ?? 0) > 0 && (
            <motion.div variants={itemVariants} className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Award size={16} style={{ color: "var(--color-brand-500)" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)" }}>At a Glance</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, justifyContent: "space-evenly" }}>
                {[
                  { label: "Avg Win", value: avgWin > 0 ? formatCurrency(avgWin) : "—", color: "var(--color-profit)" },
                  { label: "Avg Loss", value: avgLoss > 0 ? formatCurrency(avgLoss) : "—", color: "var(--color-loss)" },
                  { label: "Risk / Reward", value: riskReward !== "0" ? `1 : ${riskReward}` : "—", color: "var(--color-info)" },
                ].map(item => (
                  <div key={item.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem",
                    borderRadius: 8, background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)",
                  }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>{item.label}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Row 2: Market Overview & Recent Trades */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Market Overview */}
        <motion.div variants={itemVariants} className="card" style={{ flex: "2 1 450px", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <MarketOverview />
        </motion.div>

        {/* Recent Trades */}
        <motion.div variants={itemVariants} className="card" style={{ flex: "1 1 350px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} style={{ color: "var(--color-brand-500)" }} />
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)" }}>Recent Trades</h3>
            </div>
            <Link href="/trades" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--color-brand-500)", textDecoration: "none" }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {!stats || stats.recentTrades.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "3rem 1rem", background: "linear-gradient(180deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%)",
              border: "1px dashed var(--color-gray-800)", borderRadius: 12, position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
                width: 120, height: 120, background: "var(--color-brand-500)", filter: "blur(60px)", opacity: 0.2, borderRadius: "50%"
              }} />
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, position: "relative", zIndex: 1
              }}>
                <Upload size={24} style={{ color: "var(--color-brand-500)" }} />
              </div>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 4, position: "relative", zIndex: 1 }}>No recent trades</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: 20, textAlign: "center", maxWidth: 220, position: "relative", zIndex: 1 }}>
                Import your trading history to unlock powerful analytics and insights.
              </p>
              <Link href="/import" className="btn btn-primary" style={{ position: "relative", zIndex: 1, padding: "0.6rem 1.25rem", fontSize: "0.8rem", borderRadius: 8 }}>
                Import Trades
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stats.recentTrades.map(trade => (
                <Link key={trade.id} href={`/trades?tradeId=${trade.id}`} className="recent-trade-item" style={{
                  display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 8,
                  background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)",
                  textDecoration: "none",
                }}>
                  <div style={{
                    padding: 6, borderRadius: 8,
                    background: trade.side === "LONG" ? "var(--color-profit-muted)" : "var(--color-loss-muted)",
                  }}>
                    <TrendingUp size={14} style={{ color: trade.side === "LONG" ? "var(--color-profit)" : "var(--color-loss)", transform: trade.side === "SHORT" ? "rotate(180deg)" : "none" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-gray-200)" }}>{trade.symbol}</span>
                      <span className={`badge ${trade.side === "LONG" ? "badge-profit" : "badge-loss"}`} style={{ fontSize: "0.6rem" }}>{trade.side}</span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: 2 }}>
                      {trade.entryAt ? formatDateWithTimezone(trade.entryAt, "UTC") : "—"}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: trade.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {formatCurrency(trade.netPnl, "USD", true)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
