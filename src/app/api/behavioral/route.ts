// API Route — GET /api/behavioral?range=all|90d|30d
// Analyse comportementale du compte actif

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeBehavior } from "@/lib/behavioral"
import { NextResponse } from "next/server"
import { getActiveAccount } from "@/lib/active-account"

const RANGES: Record<string, number> = { "30d": 30, "90d": 90, "all": 0 }

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const range = url.searchParams.get("range") || "all"
  const days = RANGES[range] ?? 0

  const account = await getActiveAccount(session.user.id)

  if (!account) {
    return NextResponse.json({ disciplineScore: 100, patterns: [], summary: "No account found." })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  })
  const timezone = user?.timezone ?? "UTC"

  // Fetch history for the chart
  const history = await prisma.behavioralSnapshot.findMany({
    where: { accountId: account.id },
    orderBy: { computedAt: "asc" },
    select: { disciplineScore: true, computedAt: true }
  })

  const since = days > 0 ? new Date(Date.now() - days * 86400000) : undefined

  const trades = await prisma.trade.findMany({
    where: {
      accountId: account.id,
      status: "closed",
      ...(since ? { entryAt: { gte: since } } : {}),
    },
    orderBy: { entryAt: "asc" },
  })

  const result = analyzeBehavior(trades, timezone)

  // Build recent flagged trades from affected ids
  const byId = new Map(trades.map(t => [t.id, t]))
  const typeMeta: Record<string, { label: string; color: string }> = {
    revenge_trading: { label: "Revenge", color: "var(--color-warning)" },
    overtrading: { label: "Overtrading", color: "var(--color-info)" },
    stop_violation: { label: "Stop violation", color: "var(--color-loss)" },
  }
  const recentFlags = result.patterns
    .flatMap(p =>
      (p.affectedTradeIds || [])
        .map(id => byId.get(id))
        .filter((t): t is NonNullable<typeof t> => !!t)
        .map(t => ({
          id: t.id,
          symbol: t.symbol,
          side: t.side,
          netPnl: Number(t.netPnl || 0),
          entryAt: t.entryAt.toISOString(),
          type: p.type,
          label: typeMeta[p.type]?.label || p.type,
          color: typeMeta[p.type]?.color || "var(--color-gray-400)",
        }))
    )
    .sort((a, b) => new Date(b.entryAt).getTime() - new Date(a.entryAt).getTime())
    .slice(0, 8)

  // Save the snapshot only for the full history (all time)
  if (range === "all" && trades.length > 0) {
    await prisma.behavioralSnapshot.upsert({
      where: {
        accountId_periodStart_periodEnd: {
          accountId: account.id,
          periodStart: result.period.start,
          periodEnd: result.period.end,
        },
      },
      create: {
        userId: session.user.id,
        accountId: account.id,
        periodStart: result.period.start,
        periodEnd: result.period.end,
        disciplineScore: result.disciplineScore,
        patterns: result.patterns as object,
      },
      update: {
        disciplineScore: result.disciplineScore,
        patterns: result.patterns as object,
        computedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ...result, history, range, recentFlags })
}

function buildSummary(score: number): string {
  if (score >= 85) return "Excellent discipline. Your trading is consistent and rule-based."
  if (score >= 70) return "Good discipline with minor areas to improve."
  if (score >= 50) return "Behavioral patterns detected that are costing you money."
  return "Critical discipline issues detected. Addressing these patterns should be your top priority."
}
