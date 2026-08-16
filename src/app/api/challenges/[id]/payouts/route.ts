import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPayoutSchema = z.object({
  amount: z.string().or(z.number()),
  status: z.string().optional(),
  requestedAt: z.string().optional(),
  note: z.string().max(500).optional(),
})

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
    const parsed = createPayoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const challenge = await prisma.propChallenge.findUnique({ where: { id } })
    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (challenge.phase !== 'funded') {
      return NextResponse.json({
        error: "Payouts are only allowed on funded accounts. This challenge is not funded yet."
      }, { status: 400 })
    }

    const requestedAt = parsed.data.requestedAt ? new Date(parsed.data.requestedAt) : new Date()
    if (isNaN(requestedAt.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }

    const payout = await prisma.propPayout.create({
      data: {
        challengeId: id,
        amount: parseFloat(String(parsed.data.amount)),
        status: parsed.data.status || "requested",
        requestedAt,
        note: parsed.data.note?.trim() || null,
      }
    })

    return NextResponse.json(payout)
  } catch (error) {
    console.error("Error creating payout:", error)
    return NextResponse.json({ error: "Failed to create payout" }, { status: 500 })
  }
}
