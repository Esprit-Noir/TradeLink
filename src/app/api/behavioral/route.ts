// API Route — GET /api/behavioral
// Analyse comportementale du compte par défaut

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeBehavior } from "@/lib/behavioral"
import { NextResponse } from "next/server"
import { getActiveAccount } from "@/lib/active-account"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  // Recalculer toujours pour le MVP pour avoir les métriques dynamiques (tags, emotions)
  const trades = await prisma.trade.findMany({
    where: { accountId: account.id, status: "closed" },
    orderBy: { entryAt: "asc" },
  })

  const result = analyzeBehavior(trades, timezone)

  // Sauvegarder le snapshot
  if (trades.length > 0) {
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

  return NextResponse.json({ ...result, history })
}

function buildSummary(score: number): string {
  if (score >= 85) return "Excellent discipline. Your trading is consistent and rule-based."
  if (score >= 70) return "Good discipline with minor areas to improve."
  if (score >= 50) return "Behavioral patterns detected that are costing you money."
  return "Critical discipline issues detected. Addressing these patterns should be your top priority."
}
