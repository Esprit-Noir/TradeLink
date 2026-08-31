// API Route — GET /api/behavioral?range=all|90d|30d&accountId=all|<id>
// Analyse comportementale (tous les comptes par défaut)

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeBehavior } from "@/lib/behavioral"
import { NextResponse } from "next/server"
import { resolveAccountScope } from "@/lib/active-account"
import type { Prisma } from "@prisma/client"

const RANGES: Record<string, number> = { "30d": 30, "90d": 90, "all": 0 }

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const range = url.searchParams.get("range") || "all"
    const accountIdParam = url.searchParams.get("accountId") || "all"
    const days = RANGES[range] ?? 0

    const scope = await resolveAccountScope(session.user.id, accountIdParam)

    if (scope.accounts.length === 0) {
      return NextResponse.json({ disciplineScore: 100, patterns: [], summary: "No account found." })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, timezone: true, notificationPrefs: true },
    })
    const timezone = user?.timezone ?? "UTC"

    const tradeWhere: Prisma.TradeWhereInput = scope.all
      ? { userId: session.user.id, status: "closed" }
      : { accountId: scope.accounts[0].id, status: "closed" }

    const historyWhere: Prisma.BehavioralSnapshotWhereInput = scope.all
      ? { userId: session.user.id }
      : { accountId: scope.accounts[0].id }

    const since = days > 0 ? new Date(Date.now() - days * 86400000) : undefined

    const [history, trades] = await Promise.all([
      prisma.behavioralSnapshot.findMany({
        where: historyWhere,
        orderBy: { computedAt: "asc" },
        select: { disciplineScore: true, computedAt: true }
      }),
      prisma.trade.findMany({
        where: {
          ...tradeWhere,
          ...(since ? { entryAt: { gte: since } } : {}),
        },
        orderBy: { entryAt: "asc" },
      }),
    ])

    const result = analyzeBehavior(trades, timezone)

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

      if (range === "all" && trades.length > 0 && !scope.all) {
      const acctId = scope.accounts[0].id
      await prisma.behavioralSnapshot.upsert({
        where: {
          accountId_periodStart_periodEnd: {
            accountId: acctId,
            periodStart: result.period.start,
            periodEnd: result.period.end,
          },
        },
        create: {
          userId: session.user.id,
          accountId: acctId,
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

      // Risk Alert Email Logic (Cooldown 24h)
      if (result.disciplineScore < 40 && user?.email) {
        const prefs = ((user.notificationPrefs as unknown as { lastRiskAlertAt?: string } | null) ?? {}) as { lastRiskAlertAt?: string }
        const lastAlert = prefs.lastRiskAlertAt ? new Date(prefs.lastRiskAlertAt) : new Date(0)
        const now = new Date()

        if (now.getTime() - lastAlert.getTime() > 86400000) {
          // Trigger email asynchronously
          import("@/lib/email").then(({ sendEmail }) => {
            import("@/emails/RiskAlertEmail").then(({ RiskAlertEmail }) => {
              sendEmail({
                to: user.email,
                subject: "⚠️ TradeLink Risk Alert",
                react: RiskAlertEmail({
                  userName: "Trader",
                  alertType: "Low Discipline Score",
                  description: `Your discipline score dropped to ${result.disciplineScore}. You are exhibiting high-risk behavior patterns.`,
                }),
              }).catch(console.error)
            })
          }).catch(console.error)

          // Update last alert time
          await prisma.user.update({
            where: { id: session.user.id },
            data: {
              notificationPrefs: {
                ...prefs,
                lastRiskAlertAt: now.toISOString(),
              },
            },
          })
        }
      }
    }

    return NextResponse.json({ ...result, history, range, recentFlags })
  } catch (error) {
    console.error("[BEHAVIORAL_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


