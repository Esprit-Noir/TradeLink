import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const account = await prisma.tradingAccount.findFirst({
      where: { userId: session.user.id, isDefault: true },
    })

    if (!account) {
      return NextResponse.json({ setupData: [], hourlyData: [] })
    }

    const trades = await prisma.trade.findMany({
      where: { accountId: account.id, status: "closed" },
      select: {
        setupTags: true,
        entryAt: true,
        netPnl: true,
      }
    })

    // 1. Calculate P&L by Setup Tag
    const setupMap: Record<string, number> = {}
    
    // 2. Calculate P&L by Hour of Day
    const hourlyMap: Record<string, number> = {}
    for (let i = 0; i < 24; i++) {
      hourlyMap[`${String(i).padStart(2, '0')}:00`] = 0
    }

    trades.forEach(t => {
      const pnl = Number(t.netPnl)
      
      // Setups
      if (t.setupTags && t.setupTags.length > 0) {
        t.setupTags.forEach(tag => {
          setupMap[tag] = (setupMap[tag] || 0) + pnl
        })
      } else {
        setupMap["Untagged"] = (setupMap["Untagged"] || 0) + pnl
      }

      // Hour
      const hour = t.entryAt.getHours()
      const hourStr = `${String(hour).padStart(2, '0')}:00`
      hourlyMap[hourStr] += pnl
    })

    // Format for Recharts
    const setupData = Object.entries(setupMap)
      .map(([name, pnl]) => ({ name, pnl }))
      .sort((a, b) => b.pnl - a.pnl) // sort highest to lowest

    const hourlyData = Object.entries(hourlyMap)
      .map(([hour, pnl]) => ({ hour, pnl }))

    return NextResponse.json({ setupData, hourlyData })

  } catch (error) {
    return NextResponse.json({ error: "Failed to load charts data" }, { status: 500 })
  }
}
