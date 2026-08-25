import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"
import type { Prisma } from "@prisma/client"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const scope = await resolveAccountScope(session.user.id, "all")

    if (!scope.all && scope.accounts.length === 0) {
      return NextResponse.json({ todayPnl: 0, todayTrades: 0, challengeStatus: null, challengeName: null, challengePct: 0 })
    }

    // Today's P&L
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const whereClause: Prisma.TradeWhereInput = scope.all
      ? { userId: session.user.id, status: "closed", exitAt: { gte: todayStart } }
      : { accountId: scope.accounts[0].id, status: "closed", exitAt: { gte: todayStart } }

    const todayTradesData = await prisma.trade.findMany({
      where: whereClause,
      select: { netPnl: true }
    })
    const todayTrades = todayTradesData.length
    const todayPnl = todayTradesData.reduce((sum, t) => sum + Number(t.netPnl || 0), 0)

    // Active challenge status
    let challengeStatus: "safe" | "warning" | "danger" | null = null
    let challengeName: string | null = null
    let challengePct = 0

    const challengeWhere: Prisma.PropChallengeWhereInput = scope.all
      ? { userId: session.user.id, status: "active" }
      : { accountId: scope.accounts[0].id, status: "active" }

    const challenge = await prisma.propChallenge.findFirst({
      where: challengeWhere,
      include: { template: true }
    })

    if (challenge) {
      const initialBal = Number(challenge.initialBalance)
      const currentBal = Number(challenge.currentBalance || challenge.initialBalance)
      const maxDDPct = Number(challenge.maxDDPct)
      const drawdownPct = ((initialBal - currentBal) / initialBal) * 100
      challengePct = (drawdownPct / maxDDPct) * 100

      challengeStatus = challengePct >= 80 ? "danger" : challengePct >= 50 ? "warning" : "safe"
      challengeName = challenge.template?.firmName || "Challenge"
    }

    const { getActivePlan } = await import("@/lib/subscriptions")
    const plan = await getActivePlan(session.user.id)
    const userRole = (session.user as any).role
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"

    const baseFeatures = plan?.features as Record<string, boolean> | undefined || {}
    const features = isAdmin 
      ? { replayAccess: true, propFirmAccess: true, advancedStats: true, backtestAccess: true } 
      : baseFeatures

    return NextResponse.json({
      todayPnl,
      todayTrades,
      challengeStatus,
      challengeName,
      challengePct: Math.max(0, challengePct),
      features,
      backtestAccess: isAdmin ? true : !!plan?.backtestAccess
    })
  } catch (error) {
    console.error("[SIDEBAR_STATS]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
