import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"
import { dayKey } from "@/lib/dates"

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date } = await params
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get("accountId")

    const [user, scope] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { timezone: true } }),
      resolveAccountScope(session.user.id, accountId),
    ])
    const timezone = user?.timezone ?? "UTC"

    const whereClause: any = scope.all
      ? { userId: session.user.id, status: "closed" }
      : scope.accounts.length > 0
        ? { accountId: scope.accounts[0].id, status: "closed" }
        : null

    const trades = whereClause
      ? await prisma.trade.findMany({
          where: whereClause,
          select: {
            id: true,
            symbol: true,
            side: true,
            quantity: true,
            entryAt: true,
            exitAt: true,
            netPnl: true,
            setupTags: true,
            status: true,
          },
        })
      : []

    const dayTrades = trades
      .filter((t) => t.exitAt && dayKey(new Date(t.exitAt), timezone) === date)
      .map((t) => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        quantity: Number(t.quantity || 0),
        entryAt: t.entryAt.toISOString(),
        exitAt: t.exitAt?.toISOString() ?? null,
        netPnl: Number(t.netPnl || 0),
        setupTags: t.setupTags || [],
        status: t.status,
      }))

    const dayPnl = dayTrades.reduce((s, t) => s + t.netPnl, 0)

    const [journal, propSnapshots] = await Promise.all([
      prisma.dailyJournal.findUnique({
        where: { userId_date: { userId: session.user.id, date } },
        select: {
          mood: true,
          sleepHours: true,
          sessionPlan: true,
          endOfDaySummary: true,
          rating: true,
          disciplineChecks: true,
          nightReflection: true,
        },
      }),
      prisma.propChallengeDailySnapshot.findMany({
        where: { date: new Date(date + "T12:00:00Z") },
        select: {
          dailyPnl: true,
          challenge: { select: { account: { select: { name: true } }, template: { select: { firmName: true } } } },
        },
      }),
    ])

    return NextResponse.json({
      date,
      dayPnl: Math.round(dayPnl * 100) / 100,
      trades: dayTrades,
      journal,
      propSnapshots: propSnapshots.map((s) => ({
        firmName: s.challenge.template.firmName,
        accountName: s.challenge.account.name,
        dailyPnl: Number(s.dailyPnl),
      })),
    })
  } catch (error: any) {
    console.error("[CALENDAR_DAY]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}