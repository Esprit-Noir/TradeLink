import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200)

    const events = await prisma.propChallengeEvent.findMany({
      where: {
        challenge: { userId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        challenge: {
          select: {
            id: true,
            status: true,
            phase: true,
            account: { select: { name: true } },
            template: { select: { firmName: true, logoUrl: true } },
          },
        },
      },
    })

    const unreadCount = await prisma.propChallengeEvent.count({
      where: {
        challenge: { userId: session.user.id },
        readAt: null,
      },
    })

    return NextResponse.json({ events, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const challenges = await prisma.propChallenge.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    })
    const ids = challenges.map(c => c.id)

    if (ids.length > 0) {
      await prisma.propChallengeEvent.updateMany({
        where: { challengeId: { in: ids }, readAt: null },
        data: { readAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to mark notifications read" }, { status: 500 })
  }
}
