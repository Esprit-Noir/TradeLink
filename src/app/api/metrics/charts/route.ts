export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"
import { dayOfWeek, hourOfDay } from "@/lib/dates"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all"
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const accountId = searchParams.get("accountId") || "all"

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ error: "Invalid accountId" }, { status: 400 })
    }

    const scope = await resolveAccountScope(session.user.id, accountId)

    if (scope.accounts.length === 0) {
      return NextResponse.json({ setupData: [], hourlyData: [] })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    })
    const timezone = user?.timezone ?? "UTC"

    const whereClause: any = scope.all
      ? { userId: session.user.id, status: "closed" }
      : { accountId: scope.accounts[0].id, status: "closed" }

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
      if (from) {
        const d = new Date(from)
        if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid from date" }, { status: 400 })
        fromDate = d
      }
      if (to) {
        const d = new Date(to)
        if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid to date" }, { status: 400 })
        toDate = d
      }
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
    const setupMap: Record<string, { pnl: number; count: number; wins: number }> = {}
    
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
      const isWin = pnl > 0
      
      // Setups
      if (t.setupTags && t.setupTags.length > 0) {
        t.setupTags.forEach(tag => {
          if (!setupMap[tag]) setupMap[tag] = { pnl: 0, count: 0, wins: 0 }
          setupMap[tag].pnl += pnl
          setupMap[tag].count++
          if (isWin) setupMap[tag].wins++
        })
      } else {
        if (!setupMap["Untagged"]) setupMap["Untagged"] = { pnl: 0, count: 0, wins: 0 }
        setupMap["Untagged"].pnl += pnl
        setupMap["Untagged"].count++
        if (isWin) setupMap["Untagged"].wins++
      }

      // Hour (1D)
      const hour = hourOfDay(t.entryAt, timezone)
      const hourStr = `${String(hour).padStart(2, '0')}:00`
      hourlyMap[hourStr] += pnl

      // Heatmap (2D)
      // dayOfWeek() returns 0 for Sunday. Let's map it to 0=Mon, 1=Tue... 6=Sun
      const dayRaw = dayOfWeek(t.entryAt, timezone)
      const day = dayRaw === 0 ? 6 : dayRaw - 1 
      heatmapMap[`${day}-${hour}`] += pnl
    })

    // Format for Recharts / UI
    const setupData = Object.entries(setupMap)
      .map(([name, { pnl, count, wins }]) => ({ name, pnl, count, winRate: count > 0 ? Math.round((wins / count) * 100) : 0 }))
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
