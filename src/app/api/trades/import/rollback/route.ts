import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluateChallenge } from "@/lib/prop-firm.service"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token || !token.accountId || !token.before) {
      return NextResponse.json({ error: "Invalid rollback token." }, { status: 400 })
    }

    // Ensure the account belongs to the user
    const account = await prisma.tradingAccount.findUnique({
      where: { id: token.accountId },
    })
    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 })
    }

    const before = new Date(token.before)

    const result = await prisma.trade.deleteMany({
      where: {
        accountId: token.accountId,
        createdAt: { gt: before },
      },
    })

    // Invalidate behavioral snapshot cache
    await prisma.behavioralSnapshot.deleteMany({
      where: { accountId: token.accountId },
    })

    // Re-evaluate linked challenge after rollback
    let challengeStatus = null
    if (token.challengeId) {
      const evaluated = await evaluateChallenge(token.challengeId)
      challengeStatus = evaluated?.status ?? null
    }

    return NextResponse.json({
      deleted: result.count,
      challengeStatus,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to rollback import" }, { status: 500 })
  }
}
