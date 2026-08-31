import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    
    // Get the challenge
    const challenge = await prisma.propChallenge.findUnique({
      where: { id },
      include: { account: true }
    })

    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    // Only allow upgrading if status is passed and phase is phase_1
    if (challenge.status !== 'passed' || challenge.phase !== 'phase_1') {
      return NextResponse.json({ error: "Challenge cannot be upgraded" }, { status: 400 })
    }

    const metadata = (challenge.metadata as Record<string, unknown>) || {}
    const steps = metadata.steps || '1'

    const phase2Target = metadata.phase2Target ? Number(metadata.phase2Target) : 5
    const fundedTarget = metadata.fundedTarget ? Number(metadata.fundedTarget) : (metadata.phase1Target ? Number(metadata.phase1Target) : 5)

    if (steps === '2') {
      // 2-step challenge: Phase 1 -> Phase 2
      const upgradedChallenge = await prisma.propChallenge.update({
        where: { id: challenge.id },
        data: {
          phase: 'phase_2',
          status: 'active',
          profitTargetPct: phase2Target,
          currentBalance: challenge.initialBalance,
          currentEquity: challenge.initialBalance,
          highestBalance: challenge.initialBalance,
          highestEquity: challenge.initialBalance,
          todayStartBalance: challenge.initialBalance,
          startedAt: new Date(),
          todayResetAt: null,
        }
      })

      await prisma.propChallengeEvent.create({
        data: {
          challengeId: challenge.id,
          eventType: 'phase_passed',
          severity: 'info',
          message: 'Passed Phase 1 and upgraded to Phase 2',
        }
      })

      return NextResponse.json(upgradedChallenge)
    }

    // 1-step or master: Phase 1 -> Funded
    const fundedChallenge = await prisma.propChallenge.update({
      where: { id: challenge.id },
      data: {
        phase: 'funded',
        status: 'active',
        profitTargetPct: fundedTarget,
        currentBalance: challenge.initialBalance,
        currentEquity: challenge.initialBalance,
        highestBalance: challenge.initialBalance,
        highestEquity: challenge.initialBalance,
        todayStartBalance: challenge.initialBalance,
        startedAt: new Date(),
        todayResetAt: null,
      }
    })

    await prisma.propChallengeEvent.create({
      data: {
        challengeId: challenge.id,
        eventType: 'phase_passed',
        severity: 'info',
        message: 'Passed Phase 1 and moved to funded status',
      }
    })

    return NextResponse.json(fundedChallenge)

  } catch (error) {
    console.error("Error upgrading challenge:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
