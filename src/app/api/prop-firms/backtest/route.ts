import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveAccount } from "@/lib/active-account"
import { dayKey } from "@/lib/dates"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      accountId,
      startDate,
      endDate,
      initialBalance = 100000,
      profitTargetPct,
      maxDDPct,
      dailyDDPct,
      minTradingDays = 0,
      maxTradingDays = null,
      consistencyRulePct = 0,
      drawdownType = "static_balance",
      dailyResetTimezone = "UTC",
    } = body

    if (profitTargetPct === undefined || maxDDPct === undefined || dailyDDPct === undefined) {
      return NextResponse.json({ error: "profitTargetPct, maxDDPct and dailyDDPct are required" }, { status: 400 })
    }

    // Resolve target account
    let account = null
    if (accountId) {
      account = await prisma.tradingAccount.findUnique({
        where: { id: accountId },
        select: { id: true, userId: true, name: true, type: true },
      })
      if (!account || account.userId !== session.user.id) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 })
      }
    } else {
      account = await getActiveAccount(session.user.id)
    }
    if (!account) {
      return NextResponse.json({ error: "No trading account found" }, { status: 404 })
    }

    // Trade window
    const where: any = {
      accountId: account.id,
      status: "closed",
    }
    if (startDate) where.exitAt = { gte: new Date(`${startDate}T00:00:00`) }
    if (endDate) where.exitAt = { ...(where.exitAt || {}), lte: new Date(`${endDate}T23:59:59.999`) }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { exitAt: "asc" },
    })
    if (trades.length === 0) {
      return NextResponse.json({ error: "No trades found in the selected period" }, { status: 400 })
    }

    // Group trades by day (reset timezone)
    const daysMap = new Map<string, { date: Date; pnl: number; start: number; end: number; lowest: number }>()

    let currentBalance = Number(initialBalance)
    let highestBalance = Number(initialBalance)
    let highestEquity = Number(initialBalance)
    const equityCurve: { date: string; balance: number }[] = []

    for (const trade of trades) {
      const pnl = Number(trade.netPnl || 0)
      if (!trade.exitAt) continue
      const exitAt = trade.exitAt

      // Update highest marks
      if (drawdownType === "trailing_balance") highestBalance = Math.max(highestBalance, currentBalance)
      if (drawdownType === "trailing_equity") highestEquity = Math.max(highestEquity, currentBalance)

      currentBalance += pnl

      const key = dayKey(exitAt, dailyResetTimezone)
      const day = daysMap.get(key) || {
        date: exitAt,
        pnl: 0,
        start: currentBalance - pnl,
        end: currentBalance,
        lowest: currentBalance,
      }
      day.end = currentBalance
      day.lowest = Math.min(day.lowest, currentBalance)
      day.pnl += pnl
      daysMap.set(key, day)

      // Max drawdown check (intraday)
      const maxDdReference =
        drawdownType === "static_balance" ? Number(initialBalance) :
        drawdownType === "trailing_balance" ? highestBalance : highestEquity
      const maxDdThreshold = maxDdReference * (1 - Number(maxDDPct) / 100)
      if (currentBalance <= maxDdThreshold) {
        return NextResponse.json({
          result: "failed",
          reason: "max_dd",
          message: `Max drawdown breached on ${key}`,
          tradingDays: daysMap.size,
          finalBalance: Math.round(currentBalance * 100) / 100,
          equityCurve,
          daysMap: null,
        })
      }
    }

    // Day-level checks
    const sortedDays = [...daysMap.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
    let daysElapsed = 0
    const dailyBreakdown: { date: string; pnl: number; balance: number; cumPnl: number }[] = []
    let cumPnl = 0

    for (const day of sortedDays) {
      const dateKey = dayKey(day.date, dailyResetTimezone)
      const dailyDdThreshold = day.start * (1 - Number(dailyDDPct) / 100)
      if (day.lowest <= dailyDdThreshold) {
        return NextResponse.json({
          result: "failed",
          reason: "daily_dd",
          message: `Daily drawdown breached on ${dateKey}`,
          tradingDays: sortedDays.length,
          finalBalance: Math.round(currentBalance * 100) / 100,
          equityCurve,
          dailyBreakdown,
        })
      }
      cumPnl += day.pnl
      dailyBreakdown.push({
        date: dateKey,
        pnl: Math.round(day.pnl * 100) / 100,
        balance: Math.round(day.end * 100) / 100,
        cumPnl: Math.round(cumPnl * 100) / 100,
      })
      equityCurve.push({ date: dateKey, balance: Math.round(day.end * 100) / 100 })

      // Profit target reached
      const profitTarget = Number(initialBalance) * (Number(profitTargetPct) / 100)
      if (cumPnl >= profitTarget) {
        if (sortedDays.length < Number(minTradingDays)) {
          return NextResponse.json({
            result: "in_progress",
            reason: "min_days",
            message: `Profit target reached on day ${sortedDays.length} but min ${minTradingDays} trading days required.`,
            tradingDays: sortedDays.length,
            finalBalance: Math.round(day.end * 100) / 100,
            equityCurve,
            dailyBreakdown,
          })
        }
        // Consistency
        if (Number(consistencyRulePct) > 0 && cumPnl > 0) {
          let biggestDay = 0
          for (const d of sortedDays) biggestDay = Math.max(biggestDay, d.pnl)
          const biggestPct = (biggestDay / cumPnl) * 100
          if (biggestPct > Number(consistencyRulePct)) {
            return NextResponse.json({
              result: "failed",
              reason: "consistency",
              message: `Consistency rule violated: largest day ${Math.round(biggestPct)}% of profit (max ${consistencyRulePct}%).`,
              tradingDays: sortedDays.length,
              biggestDayPct: Math.round(biggestPct * 100) / 100,
              finalBalance: Math.round(day.end * 100) / 100,
              equityCurve,
              dailyBreakdown,
            })
          }
        }
        return NextResponse.json({
          result: "passed",
          message: `Profit target reached in ${sortedDays.length} trading days (${daysElapsed} calendar days).`,
          tradingDays: sortedDays.length,
          daysElapsed,
          finalBalance: Math.round(day.end * 100) / 100,
          peakProfitPct: Math.round((cumPnl / Number(initialBalance)) * 10000) / 100,
          equityCurve,
          dailyBreakdown,
        })
      }
      daysElapsed = (day.date.getTime() - sortedDays[0].date.getTime()) / 86400000
    }

    // Max trading days limit
    if (maxTradingDays && daysElapsed > Number(maxTradingDays)) {
      return NextResponse.json({
        result: "failed",
        reason: "time_limit",
        message: `Time limit reached: ${Math.floor(daysElapsed)} days used (max ${maxTradingDays}).`,
        tradingDays: sortedDays.length,
        daysElapsed: Math.floor(daysElapsed),
        finalBalance: Math.round(currentBalance * 100) / 100,
        equityCurve,
        dailyBreakdown,
      })
    }

    // In progress
    const maxDdReference = drawdownType === "static_balance" ? Number(initialBalance) : highestBalance
    const ddBudget = maxDdReference * (Number(maxDDPct) / 100)
    const ddUsedPct = ddBudget > 0 ? ((maxDdReference - currentBalance) / ddBudget) * 100 : 0

    return NextResponse.json({
      result: "in_progress",
      message: `Target not reached yet after ${sortedDays.length} trading days.`,
      tradingDays: sortedDays.length,
      daysElapsed: Math.floor(daysElapsed),
      finalBalance: Math.round(currentBalance * 100) / 100,
      currentProfitPct: Math.round((cumPnl / Number(initialBalance)) * 10000) / 100,
      maxDrawdownUsedPct: Math.round(Math.min(100, Math.max(0, ddUsedPct)) * 100) / 100,
      equityCurve,
      dailyBreakdown,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
