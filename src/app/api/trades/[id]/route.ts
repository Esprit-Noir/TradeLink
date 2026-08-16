import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTradeSchema = z.object({
  setupTags: z.array(z.string()).optional(),
  emotionTags: z.array(z.string()).optional(),
  notesPost: z.string().max(5000).optional(),
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

    const { id: tradeId } = await params

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { account: true, screenshots: true }
    })

    if (!trade || trade.account.userId !== session.user.id) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    return NextResponse.json(trade)
  } catch (error) {
    console.error("Error fetching trade:", error)
    return NextResponse.json({ error: "Failed to fetch trade" }, { status: 500 })
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: tradeId } = await params

    // Check if trade exists and belongs to the user
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { account: true }
    })

    if (!trade || trade.account.userId !== session.user.id) {
      return NextResponse.json({ error: "Trade not found or unauthorized" }, { status: 404 })
    }

    await prisma.trade.delete({
      where: { id: tradeId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting trade:", error)
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: tradeId } = await params
    const body = await request.json()
    const parsed = updateTradeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { account: true }
    })

    if (!trade || trade.account.userId !== session.user.id) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        setupTags: parsed.data.setupTags,
        emotionTags: parsed.data.emotionTags,
        notesPost: parsed.data.notesPost,
      },
    })

    return NextResponse.json(updatedTrade)
  } catch (error) {
    console.error("Error updating trade:", error)
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 })
  }
}
