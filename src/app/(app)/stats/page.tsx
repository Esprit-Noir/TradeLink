import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Advanced Statistics",
}

export default async function StatsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Advanced Statistics</h1>
          <p className="page-subtitle">Deep dive into your trading performance metrics.</p>
        </div>
      </div>

      <Suspense fallback={<div className="card loading-skeleton" style={{ height: 400 }} />}>
        <StatsDashboardServer />
      </Suspense>
    </div>
  )
}

import { headers } from "next/headers"

async function StatsDashboardServer() {
  // We can fetch from our API using the absolute URL or just directly via prisma in this Server Component.
  // Actually, since we are in a server component, calling the API route is tricky via fetch if we don't have absolute URL.
  // It's cleaner to just fetch via the same logic as the API, or use a helper. 
  // Let's use the local API by passing cookie headers or better yet, recreate the logic since it's just Prisma.
  
  const { prisma } = await import("@/lib/prisma")
  const { getActiveAccount } = await import("@/lib/active-account")
  const { auth } = await import("@/lib/auth")

  const session = await auth()
  if (!session?.user?.id) return null

  const account = await getActiveAccount(session.user.id)
  if (!account) return <div className="empty-state">No trading account active.</div>

  const trades = await prisma.trade.findMany({
    where: {
      userId: session.user.id,
      accountId: account.id,
      status: "closed"
    },
    orderBy: { entryAt: "asc" }
  })

  // Calculate Streaks
  let currentWinStreak = 0
  let longestWinStreak = 0
  let currentLossStreak = 0
  let longestLossStreak = 0

  // Calculate Drawdown
  let maxDrawdown = 0
  let currentDrawdown = 0
  let peakBalance = 0
  let currentBalance = 0

  // Calculate Risk:Reward Distribution
  const rrDistribution = {
    "0-1R": 0,
    "1-2R": 0,
    "2-3R": 0,
    "3-4R": 0,
    "4R+": 0,
  }

  // Day of Week Performance (0 = Sunday, 1 = Monday, etc.)
  const dowPerformance = [0, 0, 0, 0, 0, 0, 0]

  trades.forEach(trade => {
    const pnl = Number(trade.netPnl)
    
    // Streaks
    if (pnl > 0) {
      currentWinStreak++
      currentLossStreak = 0
      if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak
    } else if (pnl < 0) {
      currentLossStreak++
      currentWinStreak = 0
      if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak
    }

    // Balance & Drawdown
    currentBalance += pnl
    if (currentBalance > peakBalance) {
      peakBalance = currentBalance
    }
    
    const drawdown = peakBalance - currentBalance
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
    currentDrawdown = peakBalance - currentBalance

    // Risk:Reward (Estimate if stopLoss isn't perfectly provided)
    // For MVP, if we don't have stopLoss, we'll try to guess based on standard risk, 
    // but TradeLink MVP doesn't force stopLoss. We will only count it if stopLoss exists.
    let rr = 0
    const entry = Number(trade.entryPrice)
    const exit = Number(trade.exitPrice)
    const stopLoss = trade.stopLoss ? Number(trade.stopLoss) : null
    
    if (stopLoss && pnl > 0) {
      const riskPerShare = Math.abs(entry - stopLoss)
      const profitPerShare = Math.abs(exit - entry)
      if (riskPerShare > 0) {
        rr = profitPerShare / riskPerShare
      }
    }

    if (rr > 0) {
      if (rr < 1) rrDistribution["0-1R"]++
      else if (rr < 2) rrDistribution["1-2R"]++
      else if (rr < 3) rrDistribution["2-3R"]++
      else if (rr < 4) rrDistribution["3-4R"]++
      else rrDistribution["4R+"]++
    }

    // Day of Week
    const dow = trade.entryAt.getDay()
    dowPerformance[dow] += pnl
  })

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
        
        <div className="kpi-card" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
          <div className="kpi-label" style={{ color: "var(--color-profit)" }}>Longest Win Streak</div>
          <div className="kpi-value">{longestWinStreak}</div>
          <div className="kpi-sub">Current: {currentWinStreak}</div>
        </div>

        <div className="kpi-card" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
          <div className="kpi-label" style={{ color: "var(--color-loss)" }}>Longest Loss Streak</div>
          <div className="kpi-value">{longestLossStreak}</div>
          <div className="kpi-sub">Current: {currentLossStreak}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Max Drawdown (Historical)</div>
          <div className="kpi-value loss">-${maxDrawdown.toFixed(2)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Current Drawdown</div>
          <div className={`kpi-value ${currentDrawdown > 0 ? "loss" : ""}`}>
            -${currentDrawdown.toFixed(2)}
          </div>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* R:R Distribution */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: "1rem" }}>
            Risk : Reward Distribution (Winning Trades)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {Object.entries(rrDistribution).map(([label, count]) => {
              const maxCount = Math.max(...Object.values(rrDistribution), 1)
              const pct = (count / maxCount) * 100
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "40px", fontSize: "0.85rem", color: "var(--color-gray-400)", fontWeight: 600 }}>{label}</div>
                  <div style={{ flex: 1, background: "var(--color-gray-800)", height: "16px", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ 
                      width: `${pct}%`, 
                      height: "100%", 
                      background: "var(--color-brand-500)",
                      borderRadius: "8px",
                      transition: "width 1s ease-out"
                    }} />
                  </div>
                  <div style={{ width: "30px", textAlign: "right", fontSize: "0.85rem", fontWeight: 600 }}>{count}</div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "1rem" }}>
            *Only calculated for trades where a Stop Loss is recorded.
          </p>
        </div>

        {/* Day of Week Performance */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: "1rem" }}>
            Performance by Day of Week
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", height: "180px", gap: "0.5rem", marginTop: "1rem" }}>
            {dowPerformance.map((pnl, i) => {
              // Ignore weekends if zero
              if ((i === 0 || i === 6) && pnl === 0) return null
              
              const maxAbsPnl = Math.max(...dowPerformance.map(Math.abs), 1)
              const heightPct = (Math.abs(pnl) / maxAbsPnl) * 100
              const isProfit = pnl >= 0

              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div style={{ fontSize: "0.75rem", color: isProfit ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 700, marginBottom: "0.25rem" }}>
                    ${pnl.toFixed(0)}
                  </div>
                  <div style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    background: isProfit ? "var(--color-profit)" : "var(--color-loss)",
                    opacity: 0.8,
                    borderRadius: "4px 4px 0 0",
                    transition: "height 1s ease-out"
                  }} />
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", marginTop: "0.5rem", fontWeight: 600 }}>
                    {dayNames[i].substring(0, 3)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
