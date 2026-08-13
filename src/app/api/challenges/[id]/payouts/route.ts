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

    const payouts = await prisma.propPayout.findMany({
      where: { challengeId: id },
      orderBy: { requestedAt: 'desc' }
    })

    return NextResponse.json(payouts)
  } catch (error) {
    console.error("Error fetching payouts:", error)
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
  }
}

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
    const body = await request.json()

    const challenge = await prisma.propChallenge.findUnique({ where: { id } })
    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (!body.amount || isNaN(parseFloat(body.amount))) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const requestedAt = body.requestedAt ? new Date(body.requestedAt) : new Date()
    if (isNaN(requestedAt.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }

    const payout = await prisma.propPayout.create({
      data: {
        challengeId: id,
        amount: parseFloat(body.amount),
        status: body.status || "requested",
        requestedAt,
        note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
      }
    })

    return NextResponse.json(payout)
  } catch (error) {
    console.error("Error creating payout:", error)
    return NextResponse.json({ error: "Failed to create payout" }, { status: 500 })
  }
}
