import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const setup = await prisma.tradingSetup.findUnique({ where: { id } })
    if (!setup || setup.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Trades tagged with this setup (case-insensitive)
    const trades = await prisma.trade.findMany({
      where: { userId: session.user.id, status: "closed" },
      orderBy: { entryAt: "asc" },
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        entryAt: true,
        exitAt: true,
        entryPrice: true,
        exitPrice: true,
        netPnl: true,
        riskAmount: true,
        setupTags: true,
        screenshots: true,
      },
    })

    const matching = trades.filter(t => (t.setupTags as string[] || []).some(tag => tag.toLowerCase() === setup.name.toLowerCase()))

    const pnl = matching.map(t => Number(t.netPnl || 0))
    const wins = pnl.filter(p => p > 0)
    const losses = pnl.filter(p => p < 0)

    // Hold time
    const holdTimes: number[] = []
    for (const t of matching) {
      if (t.exitAt) holdTimes.push((t.exitAt.getTime() - t.entryAt.getTime()) / 60000)
    }
    const avgHoldMin = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0

    // R distribution
    const rValues: number[] = []
    for (const t of matching) {
      if (Number(t.riskAmount) > 0) rValues.push(Number(t.netPnl || 0) / Number(t.riskAmount))
    }

    // Per-symbol breakdown
    const symbolMap: Record<string, { count: number; wins: number; pnl: number }> = {}
    for (let i = 0; i < matching.length; i++) {
      const sym = matching[i].symbol
      if (!symbolMap[sym]) symbolMap[sym] = { count: 0, wins: 0, pnl: 0 }
      symbolMap[sym].count++
      if (pnl[i] > 0) symbolMap[sym].wins++
      symbolMap[sym].pnl += pnl[i]
    }
    const symbols = Object.entries(symbolMap)
      .map(([name, d]) => ({ name, count: d.count, wins: d.wins, winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0, pnl: Math.round(d.pnl * 100) / 100 }))
      .sort((a, b) => b.pnl - a.pnl)

    const grossWin = wins.reduce((a, b) => a + b, 0)
    const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0))
    const profitFactor = losses.length > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0

    const recentTrades = [...matching].reverse().slice(0, 25).map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      quantity: Number(t.quantity || 0),
      entryAt: t.entryAt.toISOString(),
      exitAt: t.exitAt?.toISOString() ?? null,
      entryPrice: Number(t.entryPrice || 0),
      exitPrice: Number(t.exitPrice || 0),
      netPnl: Math.round(Number(t.netPnl || 0) * 100) / 100,
      r: Number(t.riskAmount) > 0 ? Math.round((Number(t.netPnl || 0) / Number(t.riskAmount)) * 100) / 100 : null,
    }))

    return NextResponse.json({
      setup: { id: setup.id, name: setup.name, description: setup.description, isDefault: setup.isDefault },
      summary: {
        count: matching.length,
        wins: wins.length,
        losses: losses.length,
        winRate: matching.length > 0 ? (wins.length / matching.length) * 100 : 0,
        netPnl: Math.round(pnl.reduce((a, b) => a + b, 0) * 100) / 100,
        profitFactor,
        expectancy: matching.length > 0 ? Math.round((pnl.reduce((a, b) => a + b, 0) / matching.length) * 100) / 100 : 0,
        avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0,
        avgHoldMin: Math.round(avgHoldMin),
        best: pnl.length > 0 ? Math.max(...pnl) : 0,
        worst: pnl.length > 0 ? Math.min(...pnl) : 0,
      },
      symbols,
      rValues: rValues.map(v => Math.round(v * 100) / 100),
      recentTrades,
    })
  } catch (error) {
    console.error("Error fetching setup detail", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await req.json()
    const { name, description, isDefault } = data

    // Verify ownership
    const setup = await prisma.tradingSetup.findUnique({ where: { id } })
    if (!setup || setup.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // If setting as default, we need to unset all others first
    if (isDefault) {
      await prisma.tradingSetup.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.tradingSetup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating setup", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Verify ownership
    const setup = await prisma.tradingSetup.findUnique({ where: { id } })
    if (!setup || setup.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.tradingSetup.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting setup", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
