export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeMetrics, computeEquityCurve, computeDailyPnL, computePnLByTag } from "@/lib/metrics"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const account = await prisma.tradingAccount.findUnique({
      where: { id },
      include: {
        propChallenge: {
          include: { template: true },
        },
      },
    })

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    })
    const timezone = user?.timezone || "UTC"

    const where: any = { accountId: account.id }
    const trades = await prisma.trade.findMany({
      where,
      orderBy: { entryAt: "desc" },
      take: 5000,
    })
    const closed = trades.filter(t => t.status === "closed")
    const initialBalance = Number(account.initialBalance || 0)

    const metrics = computeMetrics(closed, initialBalance, timezone)

    const symbols = new Map<string, { symbol: string; count: number; pnl: number; wins: number }>()
    for (const t of closed) {
      const pnl = Number(t.netPnl || 0)
      const s = symbols.get(t.symbol)
      if (s) {
        s.count++
        s.pnl += pnl
        if (pnl > 0) s.wins++
      } else {
        symbols.set(t.symbol, { symbol: t.symbol, count: 1, pnl, wins: pnl > 0 ? 1 : 0 })
      }
    }

    const recentTrades = closed
      .filter(t => t.exitAt)
      .sort((a, b) => new Date(b.exitAt!).getTime() - new Date(a.exitAt!).getTime())
      .slice(0, 20)
      .map(t => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        entryAt: t.entryAt.toISOString(),
        exitAt: t.exitAt?.toISOString() || null,
        netPnl: Number(t.netPnl || 0),
        netPnlUsd: Number(t.netPnlUsd ?? t.netPnl ?? 0),
        riskAmount: Number(t.riskAmount || 0),
        rMultiple: t.riskAmount && Number(t.riskAmount) > 0 ? Number(t.netPnl || 0) / Number(t.riskAmount) : null,
        setupTags: t.setupTags,
      }))

    return NextResponse.json({
      account: {
        id: account.id,
        name: account.name,
        broker: account.broker,
        type: account.type,
        baseCurrency: account.baseCurrency,
        fxRateToUsd: Number(account.fxRateToUsd || 1),
        initialBalance,
        isDefault: account.isDefault,
        createdAt: account.createdAt.toISOString(),
      },
      challenge: account.propChallenge
        ? {
            id: account.propChallenge.id,
            status: account.propChallenge.status,
            phase: account.propChallenge.phase,
            currentEquity: Number(account.propChallenge.currentEquity || 0),
            firmName: account.propChallenge.template.firmName,
            programName: account.propChallenge.template.programName,
            logoUrl: account.propChallenge.template.logoUrl || null,
          }
        : null,
      stats: {
        totalTrades: metrics.totalTrades,
        winRate: Math.round(metrics.winRate * 1000) / 10,
        netPnl: Math.round(metrics.netPnl * 100) / 100,
        profitFactor: metrics.profitFactor === Infinity ? 99 : Math.round(metrics.profitFactor * 100) / 100,
        avgRR: Math.round(metrics.avgRR * 100) / 100,
        expectancy: Math.round(metrics.expectancy * 100) / 100,
        maxDrawdown: metrics.maxDrawdown,
        maxDrawdownPct: metrics.maxDrawdownPct,
        currentEquity: initialBalance + Math.round(metrics.netPnl * 100) / 100,
        returnPct: initialBalance > 0 ? Math.round((metrics.netPnl / initialBalance) * 10000) / 100 : 0,
        bestDay: metrics.bestDay,
        worstDay: metrics.worstDay,
      },
      equityCurve: computeEquityCurve(closed, initialBalance, timezone),
      daily: computeDailyPnL(closed, timezone),
      symbols: [...symbols.values()].sort((a, b) => b.pnl - a.pnl),
      setups: computePnLByTag(closed),
      recentTrades,
      timezone,
    })
  } catch (error) {
    console.error("Error fetching account detail:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 })
  }
}
