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

    // Calculate Streaks
    let currentWinStreak = 0
    let longestWinStreak = 0
    let currentLossStreak = 0
    let longestLossStreak = 0

    // Calculate Drawdown
    let maxDrawdown = 0
    let currentDrawdown = 0
    let peakBalance = 0 // assuming start from 0 for simplicity, or we sum PnL
    let currentBalance = 0

    // Calculate Risk:Reward Distribution
    const rrDistribution = {
      "0-1R": 0,
      "1-2R": 0,
      "2-3R": 0,
      "3-4R": 0,
      "4R+": 0,
    }

    // Day of Week Performance
    const dowPerformance = [0, 0, 0, 0, 0, 0, 0] // 0 = Sunday, 1 = Monday, etc.

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

      // Risk:Reward (Assuming riskAmount is available, or calculate rough R:R based on stopLoss)
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

    return NextResponse.json({
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
      dowPerformance
    })
  } catch (error) {
    console.error("[ADVANCED_METRICS_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
