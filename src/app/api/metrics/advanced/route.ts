import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveAccount } from "@/lib/active-account"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const account = await getActiveAccount(session.user.id)
    if (!account) {
      return NextResponse.json({ error: "No active account found." }, { status: 404 })
    }

    const trades = await prisma.trade.findMany({
      where: {
        userId: session.user.id,
        accountId: account.id,
        status: "closed"
      },
      orderBy: { entryAt: "asc" }
    })

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

    // R:R Distribution
    const rrDistribution = {
      "0-1R": 0,
      "1-2R": 0,
      "2-3R": 0,
      "3-4R": 0,
      "4R+": 0,
    }

    // Day of Week
    const dowPerformance = [0, 0, 0, 0, 0, 0, 0]

    // Symbols & Setups Aggregation
    const symbolMap: Record<string, { pnl: number, count: number }> = {}
    const setupMap: Record<string, { pnl: number, count: number }> = {}

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
      const dow = trade.entryAt.getDay()
      dowPerformance[dow] += pnl

      // Symbols
      const sym = trade.symbol
      if (!symbolMap[sym]) symbolMap[sym] = { pnl: 0, count: 0 }
      symbolMap[sym].pnl += pnl
      symbolMap[sym].count++

      // Setups
      const tags = (trade.setupTags as string[]) || []
      tags.forEach(tag => {
        if (!setupMap[tag]) setupMap[tag] = { pnl: 0, count: 0 }
        setupMap[tag].pnl += pnl
        setupMap[tag].count++
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

    return NextResponse.json({
      empty: false,
      kpis: {
        profitFactor,
        expectancy,
        avgWin,
        avgLoss,
        winRate: winRate * 100,
        totalTrades
      },
      streaks: {
        longestWinStreak,
        longestLossStreak,
        currentWinStreak,
        currentLossStreak
      },
      drawdown: {
        maxDrawdown,
        currentDrawdown,
      },
      rrDistribution,
      dowPerformance,
      topSymbols,
      topSetups
    })
  } catch (error) {
    console.error("[ADVANCED_METRICS_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
