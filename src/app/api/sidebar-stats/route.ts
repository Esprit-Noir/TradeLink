import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveAccount } from "@/lib/active-account"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const account = await getActiveAccount(session.user.id)

    // Today's P&L
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    let todayPnl = 0
    let todayTrades = 0

    if (account) {
      const todayTradesData = await prisma.trade.findMany({
        where: {
          accountId: account.id,
          status: "closed",
          exitAt: { gte: todayStart }
        },
        select: { netPnl: true }
      })
      todayTrades = todayTradesData.length
      todayPnl = todayTradesData.reduce((sum, t) => sum + Number(t.netPnl || 0), 0)
    }

    // Active challenge status
    let challengeStatus: "safe" | "warning" | "danger" | null = null
    let challengeName: string | null = null
    let challengePct = 0

    if (account) {
      const challenge = await prisma.propChallenge.findFirst({
        where: { accountId: account.id, status: { in: ["phase1", "phase2"] } },
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
    }

    return NextResponse.json({
      todayPnl,
      todayTrades,
      challengeStatus,
      challengeName,
      challengePct: Math.max(0, challengePct)
    })
  } catch (error) {
    return NextResponse.json({ todayPnl: 0, todayTrades: 0, challengeStatus: null, challengeName: null, challengePct: 0 })
  }
}
