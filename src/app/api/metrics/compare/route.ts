export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"

function getDateRange(period: string): { from?: Date; to?: Date } {
  const now = new Date()
  if (period === "7d") return { from: new Date(now.getTime() - 7 * 86400000) }
  if (period === "30d") return { from: new Date(now.getTime() - 30 * 86400000) }
  if (period === "90d") return { from: new Date(now.getTime() - 90 * 86400000) }
  if (period === "ytd") return { from: new Date(now.getFullYear(), 0, 1) }
  if (period === "1y") return { from: new Date(now.getTime() - 365 * 86400000) }
  return {}
}

async function computePeriodMetrics(userId: string, scope: { all: boolean; accounts: { id: string }[] }, period: string) {
  const where: Prisma.TradeWhereInput = scope.all
    ? { userId, status: "closed" }
    : { accountId: scope.accounts[0].id, status: "closed" }

  const range = getDateRange(period)
  if (range.from || range.to) {
    where.entryAt = {}
    if (range.from) where.entryAt.gte = range.from
    if (range.to) where.entryAt.lte = range.to
  }

  const trades = await prisma.trade.findMany({ where, select: { netPnl: true, status: true } })
  if (trades.length === 0) {
    return { period, totalTrades: 0, winRate: 0, netPnl: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, expectancy: 0, maxDrawdown: 0 }
  }

  let grossProfit = 0, grossLoss = 0, wins = 0, losses = 0, totalWinPnl = 0, totalLossPnl = 0
  let peak = 0, balance = 0, maxDD = 0

  for (const t of trades) {
    const pnl = Number(t.netPnl)
    balance += pnl
    if (balance > peak) peak = balance
    const dd = peak - balance
    if (dd > maxDD) maxDD = dd

    if (pnl > 0) { grossProfit += pnl; totalWinPnl += pnl; wins++ }
    else if (pnl < 0) { grossLoss += Math.abs(pnl); totalLossPnl += pnl; losses++ }
  }

  const total = trades.length
  const winRate = total > 0 ? (wins / total) * 100 : 0
  const netPnl = grossProfit - grossLoss
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0
  const avgWin = wins > 0 ? totalWinPnl / wins : 0
  const avgLoss = losses > 0 ? Math.abs(totalLossPnl) / losses : 0
  const expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss)

  return { period, totalTrades: total, winRate, netPnl, profitFactor, avgWin, avgLoss, expectancy, maxDrawdown: maxDD }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const periodA = url.searchParams.get("periodA") || "30d"
    const periodB = url.searchParams.get("periodB") || "90d"
    const accountId = url.searchParams.get("accountId") || "all"

    const scope = await resolveAccountScope(session.user.id, accountId)
    if (scope.accounts.length === 0) {
      return NextResponse.json({ dataA: { period: periodA, totalTrades: 0, winRate: 0, netPnl: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, expectancy: 0, maxDrawdown: 0 }, dataB: { period: periodB, totalTrades: 0, winRate: 0, netPnl: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, expectancy: 0, maxDrawdown: 0 } })
    }

    const [dataA, dataB] = await Promise.all([
      computePeriodMetrics(session.user.id, scope, periodA),
      computePeriodMetrics(session.user.id, scope, periodB),
    ])

    return NextResponse.json({ dataA, dataB })
  } catch (error) {
    console.error("[COMPARE_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
