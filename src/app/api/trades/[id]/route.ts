import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
