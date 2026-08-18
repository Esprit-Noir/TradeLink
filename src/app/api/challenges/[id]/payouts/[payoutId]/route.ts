import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updatePayoutSchema = z.object({
  status: z.enum(["requested", "approved", "paid", "rejected"]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payoutId: string }> }
) {
  try {
    const session = await auth() as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, payoutId } = await params
    const body = await request.json()
    const parsed = updatePayoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

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
    if (parsed.data.status !== undefined) {
      // Only admins can change payout status
      if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Only admins can change payout status" }, { status: 403 })
      }
      data.status = parsed.data.status
    }
    if (parsed.data.amount !== undefined && !isNaN(parseFloat(String(parsed.data.amount)))) data.amount = parseFloat(String(parsed.data.amount))

    const updated = await prisma.propPayout.update({
      where: { id: payoutId },
      data
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating payout:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payoutId: string }> }
) {
  try {
    const session = await auth() as any
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
    console.error("Error deleting payout:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to delete payout" }, { status: 500 })
  }
}
