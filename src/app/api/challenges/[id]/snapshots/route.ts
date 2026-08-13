import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const challenge = await prisma.propChallenge.findUnique({ where: { id } })
    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const snapshots = await prisma.propChallengeDailySnapshot.findMany({
      where: { challengeId: id },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(snapshots.map(s => ({
      ...s,
      date: s.date.toISOString(),
      startBalance: Number(s.startBalance),
      endBalance: Number(s.endBalance),
      lowestEquity: Number(s.lowestEquity),
      dailyPnl: Number(s.dailyPnl),
      dailyDDUsedPct: s.dailyDDUsedPct ? Number(s.dailyDDUsedPct) : null,
    })))
  } catch (error) {
    console.error("Error fetching snapshots:", error)
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 })
  }
}
