import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId") || "all"

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ error: "Invalid accountId" }, { status: 400 })
    }

    const scope = await resolveAccountScope(session.user.id, accountId)

    if (!scope.all && scope.accounts.length === 0) {
      return NextResponse.json({ totalTrades: 0, winRate: 0, netPnl: 0, profitFactor: 0, recentTrades: [] })
    }

    const where: any = scope.all
      ? { userId: session.user.id, status: "closed" }
      : { accountId: scope.accounts[0].id, status: "closed" }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { entryAt: "desc" },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryAt: true,
        netPnl: true,
        instrumentType: true,
      },
    })

    const totalTrades = trades.length
    const winners = trades.filter(t => Number(t.netPnl || 0) > 0)
    const losers = trades.filter(t => Number(t.netPnl || 0) < 0)
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0

    const grossProfit = winners.reduce((s, t) => s + Number(t.netPnl || 0), 0)
    const grossLoss = Math.abs(losers.reduce((s, t) => s + Number(t.netPnl || 0), 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0

    const netPnl = trades.reduce((s, t) => s + Number(t.netPnl || 0), 0)

    const recentTrades = trades.slice(0, 5).map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      entryAt: t.entryAt?.toISOString?.() ?? null,
      netPnl: Number(t.netPnl || 0),
      instrumentType: t.instrumentType,
    }))

    return NextResponse.json({
      totalTrades,
      winRate: Math.round(winRate * 10) / 10,
      netPnl: Math.round(netPnl * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossLoss: Math.round(grossLoss * 100) / 100,
      recentTrades,
    })
  } catch (error) {
    console.error("[OVERVIEW_STATS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
