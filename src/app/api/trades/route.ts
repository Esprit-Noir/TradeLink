export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveAccount } from "@/lib/active-account"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { symbol, instrumentType, side, quantity, entryPrice, exitPrice, entryAt, exitAt, fees, setupTags, emotionTags, notesPost, screenshotUrl } = body

    if (!symbol || !quantity || !entryPrice || !exitPrice || !entryAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Retrieve default account
    const account = await getActiveAccount(session.user.id)

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
    const fxRate = Number(account.fxRateToUsd ?? 1)
    const netPnlUsd = Math.round(netPnl * fxRate * 10000) / 10000

    let finalSetupTags = setupTags ? setupTags.split(",").map((s: string) => s.trim()).filter(Boolean) : []
    if (finalSetupTags.length === 0) {
      const defaultSetup = await prisma.tradingSetup.findFirst({
        where: { userId: session.user.id, isDefault: true }
      })
      if (defaultSetup) {
        finalSetupTags = [defaultSetup.name]
      }
    }

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
        netPnlUsd,
        status: "closed",
        setupTags: finalSetupTags,
        emotionTags: emotionTags ? emotionTags.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        notesPost: notesPost || null,
        screenshots: screenshotUrl ? {
          create: {
            storageUrl: screenshotUrl,
            fileName: screenshotUrl.split('/').pop() || 'screenshot'
          }
        } : undefined
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
