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
    const accountId = searchParams.get("accountId")

    const [user, scope] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { riskPrefs: true, timezone: true },
      }),
      resolveAccountScope(session.user.id, accountId),
    ])

    const prefs = (user?.riskPrefs as any) || {}

    // Today's realized stats
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)

    const whereClause: any = scope.all
      ? { userId: session.user.id, status: "closed", exitAt: { gte: dayStart } }
      : { accountId: scope.accounts[0]?.id, status: "closed", exitAt: { gte: dayStart } }

    const todayTrades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { exitAt: "asc" },
      select: { netPnl: true },
    })

    const todayPnl = todayTrades.reduce((s, t) => s + Number(t.netPnl || 0), 0)

    // Consecutive losing trades (across all history)
    let consecutiveLosses = 0
    const recentAll = await prisma.trade.findMany({
      where: scope.all
        ? { userId: session.user.id, status: "closed" }
        : { accountId: scope.accounts[0]?.id, status: "closed" },
      orderBy: { exitAt: "desc" },
      select: { netPnl: true },
      take: 50,
    })
    for (const t of recentAll) {
      if (Number(t.netPnl || 0) < 0) consecutiveLosses++
      else break
    }

    // Week P&L
    const weekStart = new Date()
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1))
    const weekTrades = await prisma.trade.findMany({
      where: {
        ...(scope.all ? { userId: session.user.id } : { accountId: scope.accounts[0]?.id }),
        status: "closed",
        exitAt: { gte: weekStart },
      },
      select: { netPnl: true },
    })
    const weekPnl = weekTrades.reduce((s, t) => s + Number(t.netPnl || 0), 0)

    // Alerts
    const dailyLossLimit = prefs.dailyLossLimit ?? null
    const maxTradesPerDay = prefs.maxTradesPerDay ?? null
    const maxConsecutiveLosses = prefs.maxConsecutiveLosses ?? null

    const alerts: { severity: "critical" | "warning" | "info"; message: string }[] = []

    if (dailyLossLimit !== null && todayPnl <= -Math.abs(dailyLossLimit)) {
      alerts.push({ severity: "critical", message: `Daily loss limit reached (${todayPnl.toFixed(2)} / -${Math.abs(dailyLossLimit)}). Stop trading.` })
    } else if (dailyLossLimit !== null && todayPnl <= -Math.abs(dailyLossLimit) * 0.7) {
      alerts.push({ severity: "warning", message: `Approaching daily loss limit (${Math.round((Math.abs(todayPnl) / Math.abs(dailyLossLimit)) * 100)}%).` })
    }

    if (maxTradesPerDay !== null && todayTrades.length >= maxTradesPerDay) {
      alerts.push({ severity: "warning", message: `Max trades per day reached (${todayTrades.length}/${maxTradesPerDay}).` })
    } else if (maxTradesPerDay !== null && todayTrades.length >= maxTradesPerDay - 1) {
      alerts.push({ severity: "info", message: `One trade left before the daily limit (${todayTrades.length}/${maxTradesPerDay}).` })
    }

    if (maxConsecutiveLosses !== null && consecutiveLosses >= maxConsecutiveLosses) {
      alerts.push({ severity: "critical", message: `${consecutiveLosses} consecutive losses (limit ${maxConsecutiveLosses}). Step back and re-evaluate.` })
    } else if (maxConsecutiveLosses !== null && consecutiveLosses === maxConsecutiveLosses - 1) {
      alerts.push({ severity: "warning", message: `${consecutiveLosses} consecutive losses — one more and you hit your limit.` })
    }

    return NextResponse.json({
      prefs: {
        dailyLossLimit,
        maxTradesPerDay,
        maxConsecutiveLosses,
        maxRiskPerTradePct: prefs.maxRiskPerTradePct ?? 1,
      },
      today: {
        pnl: Math.round(todayPnl * 100) / 100,
        trades: todayTrades.length,
        consecutiveLosses,
      },
      weekPnl: Math.round(weekPnl * 100) / 100,
      baseCurrency: scope.currency,
      alerts,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
