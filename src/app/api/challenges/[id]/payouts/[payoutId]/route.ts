import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payoutId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, payoutId } = await params
    const body = await request.json()

    const challenge = await prisma.propChallenge.findUnique({ where: { id } })
    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const payout = await prisma.propPayout.findFirst({
      where: { id: payoutId, challengeId: id }
    })
    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    const data: any = {}
    if (body.status !== undefined) data.status = body.status
    if (body.amount !== undefined && !isNaN(parseFloat(body.amount))) data.amount = parseFloat(body.amount)

    const updated = await prisma.propPayout.update({
      where: { id: payoutId },
      data
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating payout:", error)
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payoutId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, payoutId } = await params

    const challenge = await prisma.propChallenge.findUnique({ where: { id } })
    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const payout = await prisma.propPayout.findFirst({
      where: { id: payoutId, challengeId: id }
    })
    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    await prisma.propPayout.delete({ where: { id: payoutId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payout:", error)
    return NextResponse.json({ error: "Failed to delete payout" }, { status: 500 })
  }
}
