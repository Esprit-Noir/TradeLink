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

    const { id: tradeId } = await params
    const { storageUrl, fileName } = await request.json()

    if (!storageUrl) {
      return NextResponse.json({ error: "Storage URL is required" }, { status: 400 })
    }

    // Verify trade ownership
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { account: true }
    })

    if (!trade || trade.account.userId !== session.user.id) {
      return NextResponse.json({ error: "Trade not found or unauthorized" }, { status: 404 })
    }

    const screenshot = await prisma.tradeScreenshot.create({
      data: {
        tradeId,
        storageUrl,
        fileName
      }
    })

    return NextResponse.json(screenshot)
  } catch (error) {
    console.error("Error saving screenshot:", error)
    return NextResponse.json({ error: "Failed to save screenshot" }, { status: 500 })
  }
}
