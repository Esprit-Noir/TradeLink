import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluateChallenge } from "@/lib/prop-firm.service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params

    const challenge = await prisma.propChallenge.findUnique({
      where: { id },
      include: { account: true },
    })
    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    // Initial phase based on the challenge structure
    const metadata = (challenge.metadata as any) || {}
    const steps = String(metadata.steps || "2")
    const initialPhase = steps === "1" ? "funded" : "phase_1"

    // Wipe the challenge's trade history, snapshots and events for a fresh start
    await prisma.trade.deleteMany({ where: { accountId: challenge.accountId } })
    await prisma.propChallengeDailySnapshot.deleteMany({ where: { challengeId: id } })
    await prisma.propChallengeEvent.deleteMany({ where: { challengeId: id } })

    // Reset deadline from maxTradingDays
    const maxTradingDays = challenge.maxTradingDays
    const deadlineAt = maxTradingDays
      ? new Date(Date.now() + maxTradingDays * 86400000)
      : null

    const updated = await prisma.propChallenge.update({
      where: { id },
      data: {
        phase: initialPhase,
        status: "active",
        breachedAt: null,
        breachReason: null,
        currentBalance: null,
        currentEquity: null,
        highestBalance: null,
        highestEquity: null,
        todayStartBalance: null,
        todayResetAt: null,
        startedAt: new Date(),
        deadlineAt,
        metadata: { ...metadata, tradingDaysCount: 0 },
      },
    })

    // Re-evaluate to set baseline live values
    await evaluateChallenge(id)

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error resetting challenge:", error)
    return NextResponse.json({ error: "Failed to reset challenge" }, { status: 500 })
  }
}
