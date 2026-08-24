export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"
import { dayOfWeek } from "@/lib/dates"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const accountId = url.searchParams.get("accountId") || "all"

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ error: "Invalid accountId" }, { status: 400 })
    }

    const scope = await resolveAccountScope(session.user.id, accountId)

    if (scope.accounts.length === 0) {
      return NextResponse.json({ empty: true })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    })
    const timezone = user?.timezone ?? "UTC"

    // ── Filters ──────────────────────────────────────────────────────────
    const period = url.searchParams.get("period") || "all"
    const symbol = url.searchParams.get("symbol") || ""
    const setup = url.searchParams.get("setup") || ""
    const side = url.searchParams.get("side") || ""

    const where: any = scope.all
      ? { userId: session.user.id, status: "closed" }
      : { accountId: scope.accounts[0].id, status: "closed" }
    if (period && period !== "all") {
      const now = new Date()
      if (period === "7d") where.entryAt = { gte: new Date(now.getTime() - 7 * 86400000) }
      else if (period === "30d") where.entryAt = { gte: new Date(now.getTime() - 30 * 86400000) }
      else if (period === "90d") where.entryAt = { gte: new Date(now.getTime() - 90 * 86400000) }
      else if (period === "ytd") where.entryAt = { gte: new Date(now.getFullYear(), 0, 1) }
    }
    if (symbol) where.symbol = symbol
    if (side) where.side = side

    let trades = await prisma.trade.findMany({
      where,
      orderBy: { entryAt: "asc" },
    })

    if (setup) {
      trades = trades.filter((t) => (t.setupTags as string[] || []).includes(setup))
    }

    if (trades.length === 0) {
      return NextResponse.json({ empty: true })
    }

    // Core Metrics
    let grossProfit = 0
    let grossLoss = 0
    let winningTrades = 0
    let losingTrades = 0
    let totalWinsPnl = 0
    let totalLossPnl = 0

    // Streaks
    let currentWinStreak = 0
    let longestWinStreak = 0
    let currentLossStreak = 0
    let longestLossStreak = 0

    // Drawdown
    let maxDrawdown = 0
    let currentDrawdown = 0
    let peakBalance = 0
    let currentBalance = 0

    // Trade Duration
    let winTotalDurationMs = 0
    let lossTotalDurationMs = 0
    let winTradesWithDuration = 0
    let lossTradesWithDuration = 0

    // R:R Distribution
    const rrDistribution = {
      "0-1R": 0,
      "1-2R": 0,
      "2-3R": 0,
      "3-4R": 0,
      "4R+": 0,
    }

    // Day of Week
    const dowPerformance = [
      { pnl: 0, wins: 0, count: 0 }, { pnl: 0, wins: 0, count: 0 }, { pnl: 0, wins: 0, count: 0 },
      { pnl: 0, wins: 0, count: 0 }, { pnl: 0, wins: 0, count: 0 }, { pnl: 0, wins: 0, count: 0 },
      { pnl: 0, wins: 0, count: 0 }
    ]
    const hourPerformance = new Array(24).fill(0) as number[]
    const monthPerformance: Record<string, number> = {}

    // Sessions
    const sessionPerformance = {
      asian: { pnl: 0, wins: 0, count: 0 },
      london: { pnl: 0, wins: 0, count: 0 },
      newYork: { pnl: 0, wins: 0, count: 0 }
    }

    // Symbols & Setups Aggregation
    const symbolMap: Record<string, { pnl: number, count: number, wins: number }> = {}
    const setupMap: Record<string, { pnl: number, count: number, wins: number }> = {}

    trades.forEach(trade => {
      const pnl = Number(trade.netPnl)
      const isWin = pnl > 0
      const isLoss = pnl < 0

      // Core P&L Aggregation
      if (isWin) {
        grossProfit += pnl
        totalWinsPnl += pnl
        winningTrades++
        currentWinStreak++
        currentLossStreak = 0
        if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak
      } else if (isLoss) {
        grossLoss += Math.abs(pnl)
        totalLossPnl += pnl
        losingTrades++
        currentLossStreak++
        currentWinStreak = 0
        if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak
      }

      // Trade duration
      if (trade.exitAt) {
        const durationMs = trade.exitAt.getTime() - trade.entryAt.getTime()
        if (durationMs >= 0) {
          if (isWin) {
            winTotalDurationMs += durationMs
            winTradesWithDuration++
          } else if (isLoss) {
            lossTotalDurationMs += durationMs
            lossTradesWithDuration++
          }
        }
      }

      // Balance & Drawdown
      currentBalance += pnl
      if (currentBalance > peakBalance) {
        peakBalance = currentBalance
      }
      const drawdown = peakBalance - currentBalance
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
      currentDrawdown = peakBalance - currentBalance

      // Risk:Reward (Only if stopLoss exists)
      let rr = 0
      const entry = Number(trade.entryPrice)
      const exit = Number(trade.exitPrice)
      const stopLoss = trade.stopLoss ? Number(trade.stopLoss) : null
      
      if (stopLoss && isWin) {
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
      const dow = dayOfWeek(trade.entryAt, timezone)
      dowPerformance[dow].pnl += pnl
      dowPerformance[dow].count++
      if (isWin) dowPerformance[dow].wins++

      // Hour of day (local)
      const hourKey = new Date(trade.entryAt).toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false })
      const hour = Number(hourKey) % 24
      hourPerformance[hour] += pnl

      // Sessions (Based on UTC hours)
      // Asian: 22:00 - 08:00
      // London: 08:00 - 13:00
      // NY: 13:00 - 22:00
      const hourUtc = trade.entryAt.getUTCHours()
      let sessionKey = "asian"
      if (hourUtc >= 8 && hourUtc < 13) sessionKey = "london"
      else if (hourUtc >= 13 && hourUtc < 22) sessionKey = "newYork"
      
      sessionPerformance[sessionKey as keyof typeof sessionPerformance].pnl += pnl
      sessionPerformance[sessionKey as keyof typeof sessionPerformance].count++
      if (isWin) sessionPerformance[sessionKey as keyof typeof sessionPerformance].wins++

      // Monthly
      const monthKey = new Date(trade.entryAt).toLocaleString("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit" })
      monthPerformance[monthKey] = (monthPerformance[monthKey] || 0) + pnl

      // Symbols
      const sym = trade.symbol
      if (!symbolMap[sym]) symbolMap[sym] = { pnl: 0, count: 0, wins: 0 }
      symbolMap[sym].pnl += pnl
      symbolMap[sym].count++
      if (isWin) symbolMap[sym].wins++

      // Setups
      const tags = (trade.setupTags as string[]) || []
      tags.forEach(tag => {
        if (!setupMap[tag]) setupMap[tag] = { pnl: 0, count: 0, wins: 0 }
        setupMap[tag].pnl += pnl
        setupMap[tag].count++
        if (isWin) setupMap[tag].wins++
      })
    })

    // Calculations
    const totalTrades = trades.length
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0
    const lossRate = totalTrades > 0 ? losingTrades / totalTrades : 0
    
    const avgWin = winningTrades > 0 ? totalWinsPnl / winningTrades : 0
    const avgLoss = losingTrades > 0 ? Math.abs(totalLossPnl) / losingTrades : 0
    
    // Profit Factor: Gross Profit / Gross Loss (if Gross Loss is 0, it's virtually infinite)
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0
    
    // Expectancy: (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss)

    // Top Symbols (Sort by PnL desc)
    const topSymbols = Object.entries(symbolMap)
      .map(([name, data]) => ({ name, pnl: data.pnl, count: data.count }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 3)

    // Top Setups (Sort by PnL desc)
    const topSetups = Object.entries(setupMap)
      .map(([name, data]) => ({ name, pnl: data.pnl, count: data.count }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 3)

    // Full breakdowns
    const symbols = Object.entries(symbolMap)
      .map(([name, d]) => ({ name, pnl: d.pnl, count: d.count, winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0 }))
      .sort((a, b) => b.pnl - a.pnl)
    const setups = Object.entries(setupMap)
      .map(([name, d]) => ({ name, pnl: d.pnl, count: d.count, winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0 }))
      .sort((a, b) => b.pnl - a.pnl)
    const monthlyPerformance = Object.entries(monthPerformance)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, pnl]) => ({ month, pnl }))

    // Build per-day equity for drawdown analysis & Sortino
    const dayPnl = new Map<string, number>()
    for (const t of trades) {
      const pnl = Number(t.netPnl)
      const dk = new Date(t.entryAt).toLocaleString("en-CA", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      })
      dayPnl.set(dk, (dayPnl.get(dk) || 0) + pnl)
    }
    const dayRows: { date: string; pnl: number; startEq: number; endEq: number }[] = []
    const dailyReturns: number[] = []
    let cum = 0
    for (const [date, pnl] of [...dayPnl.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const startEq = cum
      cum += pnl
      dayRows.push({ date, pnl, startEq, endEq: cum })
      dailyReturns.push(startEq !== 0 ? pnl / Math.abs(startEq) : 0)
    }

    // Sortino (daily returns, rf = 0)
    const nDays = dailyReturns.length
    const meanR = nDays > 0 ? dailyReturns.reduce((s, r) => s + r, 0) / nDays : 0
    const downsideDev = nDays > 0
      ? Math.sqrt(dailyReturns.reduce((s, r) => s + (r < 0 ? r * r : 0), 0) / nDays)
      : 0
    const sortino = downsideDev > 0 ? meanR / downsideDev : meanR > 0 ? 99 : 0

    // Drawdown episodes (from daily equity)
    let peakEq = 0
    let ddStartIdx = -1
    let ddStartDate: string | null = null
    let epMaxDepth = 0
    let epMaxDepthPct = 0
    const episodes: { startDate: string | null; endDate: string | null; depth: number; depthPct: number; durationDays: number | null }[] = []
    const closeEpisode = (endDate: string | null, endIdx: number) => {
      if (ddStartIdx >= 0) {
        episodes.push({
          startDate: ddStartDate,
          endDate,
          depth: Math.round(epMaxDepth * 100) / 100,
          depthPct: Math.round(epMaxDepthPct * 100) / 100,
          durationDays: endDate ? endIdx - ddStartIdx : null,
        })
      }
      ddStartIdx = -1
      ddStartDate = null
      epMaxDepth = 0
      epMaxDepthPct = 0
    }
    for (let i = 0; i < dayRows.length; i++) {
      const eq = dayRows[i].endEq
      if (eq >= peakEq) {
        closeEpisode(dayRows[i].date, i)
        peakEq = eq
      } else {
        if (ddStartIdx < 0) { ddStartIdx = i; ddStartDate = dayRows[i].date }
        const depth = peakEq - eq
        const depthPct = peakEq !== 0 ? (depth / Math.abs(peakEq)) * 100 : 0
        if (depth > epMaxDepth) { epMaxDepth = depth; epMaxDepthPct = depthPct }
      }
    }
    closeEpisode(null, dayRows.length)

    const worstEp = episodes.length ? episodes.reduce((a, b) => (a.depth > b.depth ? a : b)) : null
    const finalEq = dayRows.length ? dayRows[dayRows.length - 1].endEq : 0
    const ddMax = worstEp?.depth ?? 0
    const ddMaxPct = worstEp?.depthPct ?? 0
    const ddCurrent = peakEq - finalEq
    const ddCurrentPct = peakEq !== 0 ? (ddCurrent / Math.abs(peakEq)) * 100 : 0
    const maxDrawdownDurationDays = worstEp?.durationDays ?? null
    const maxDrawdownStart = worstEp?.startDate ?? null
    const maxDrawdownRecovery = worstEp?.endDate ?? null

    return NextResponse.json({
      empty: false,
      filters: { period, symbol, setup, side },
      kpis: {
        profitFactor,
        expectancy,
        avgWin,
        avgLoss,
        winRate: winRate * 100,
        totalTrades,
        sortino: Math.round(sortino * 100) / 100,
      },
      durations: {
        avgWinDurationMinutes: winTradesWithDuration > 0 ? (winTotalDurationMs / winTradesWithDuration) / 60000 : null,
        avgLossDurationMinutes: lossTradesWithDuration > 0 ? (lossTotalDurationMs / lossTradesWithDuration) / 60000 : null,
      },
      streaks: {
        longestWinStreak,
        longestLossStreak,
        currentWinStreak,
        currentLossStreak
      },
      drawdown: {
        maxDrawdown: ddMax,
        maxDrawdownPct: Math.round(ddMaxPct * 100) / 100,
        currentDrawdown: ddCurrent,
        currentDrawdownPct: Math.round(ddCurrentPct * 100) / 100,
        maxDrawdownDurationDays,
        maxDrawdownStart,
        maxDrawdownRecovery,
      },
      drawdownEpisodes: episodes.slice(0, 8),
      equityCurve: dayRows.map(d => ({ date: d.date, equity: d.endEq })),
      rrDistribution,
      dowPerformance,
      hourPerformance,
      sessionPerformance,
      monthlyPerformance,
      topSymbols,
      topSetups,
      symbols,
      setups,
    })
  } catch (error) {
    console.error("[ADVANCED_METRICS_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
