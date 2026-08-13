import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

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

    const whereClause: any = { accountId: account.id, status: "closed" }

    let fromDate: Date | undefined
    let toDate: Date | undefined

    if (period === "7d") {
      fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 7)
    } else if (period === "30d") {
      fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 30)
    } else if (period === "90d") {
      fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 90)
    } else if (period === "ytd") {
      fromDate = new Date(new Date().getFullYear(), 0, 1)
    } else if (period === "custom") {
      if (from) fromDate = new Date(from)
      if (to) toDate = new Date(to)
    }

    if (fromDate) fromDate.setHours(0, 0, 0, 0)
    if (toDate) toDate.setHours(23, 59, 59, 999)

    if (fromDate || toDate) {
      whereClause.entryAt = {}
      if (fromDate) whereClause.entryAt.gte = fromDate
      if (toDate) whereClause.entryAt.lte = toDate
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      select: {
        setupTags: true,
        entryAt: true,
        netPnl: true,
      }
    })

    // 1. Calculate P&L by Setup Tag
    const setupMap: Record<string, number> = {}
    
    // 2. Calculate P&L by Hour of Day (1D)
    const hourlyMap: Record<string, number> = {}
    for (let i = 0; i < 24; i++) {
      hourlyMap[`${String(i).padStart(2, '0')}:00`] = 0
    }

    // 3. Calculate 2D Heatmap (Day of Week vs Hour)
    const heatmapMap: Record<string, number> = {}
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        heatmapMap[`${d}-${h}`] = 0
      }
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

      // Hour (1D)
      const hour = t.entryAt.getHours()
      const hourStr = `${String(hour).padStart(2, '0')}:00`
      hourlyMap[hourStr] += pnl

      // Heatmap (2D)
      // JS getDay() returns 0 for Sunday. Let's map it to 0=Mon, 1=Tue... 6=Sun
      const dayRaw = t.entryAt.getDay()
      const day = dayRaw === 0 ? 6 : dayRaw - 1 
      heatmapMap[`${day}-${hour}`] += pnl
    })

    // Format for Recharts / UI
    const setupData = Object.entries(setupMap)
      .map(([name, pnl]) => ({ name, pnl }))
      .sort((a, b) => b.pnl - a.pnl) // sort highest to lowest

    const hourlyData = Object.entries(hourlyMap)
      .map(([hour, pnl]) => ({ hour, pnl }))

    const heatmapData = Object.entries(heatmapMap)
      .map(([key, pnl]) => {
        const [dayStr, hourStr] = key.split("-")
        return { day: Number(dayStr), hour: Number(hourStr), pnl }
      })

    return NextResponse.json({ setupData, hourlyData, heatmapData })

  } catch (error) {
    return NextResponse.json({ error: "Failed to load charts data" }, { status: 500 })
  }
}
