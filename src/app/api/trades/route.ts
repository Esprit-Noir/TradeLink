import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { symbol, instrumentType, side, quantity, entryPrice, exitPrice, entryAt, exitAt, fees, setupTags, emotionTags, notesPost } = body

    if (!symbol || !quantity || !entryPrice || !exitPrice || !entryAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Retrieve default account
    const account = await prisma.tradingAccount.findFirst({
      where: { userId: session.user.id, isDefault: true },
    })

    if (!account) {
      return NextResponse.json({ error: "No trading account found." }, { status: 404 })
    }

    const isLong = side === "LONG"
    const entry = parseFloat(entryPrice)
    const exit = parseFloat(exitPrice)
    const qty = parseFloat(quantity)
    const f = parseFloat(fees || "0")
    
    const diff = isLong ? exit - entry : entry - exit
    const netPnl = (diff * qty) - f

    const trade = await prisma.trade.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        symbol: symbol.toUpperCase(),
        instrumentType,
        side,
        quantity: qty,
        entryPrice: entry,
        exitPrice: exit,
        entryAt: new Date(entryAt),
        exitAt: new Date(exitAt),
        fees: f,
        netPnl,
        status: "closed",
        setupTags: setupTags ? setupTags.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        emotionTags: emotionTags ? emotionTags.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        notesPost: notesPost || null,
      }
    })

    // Invalidate behavioral snapshot cache
    await prisma.behavioralSnapshot.deleteMany({
      where: { accountId: account.id },
    })

    return NextResponse.json({ success: true, trade })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create trade" }, { status: 500 })
  }
}
