export const dynamic = "force-dynamic"

// API Route — GET /api/metrics/equity-curve
// Renvoie les points de l'equity curve pour le compte par défaut

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeEquityCurve } from "@/lib/metrics"
import { NextResponse } from "next/server"
import { resolveAccountScope } from "@/lib/active-account"

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
      return NextResponse.json({ data: [] })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    })

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
      whereClause.exitAt = {}
      if (fromDate) whereClause.exitAt.gte = fromDate
      if (toDate) whereClause.exitAt.lte = toDate
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { exitAt: "asc" },
    })

    const data = computeEquityCurve(trades, scope.baseBalance, user?.timezone ?? "UTC")

    // Compute metadata for the stats bar
    const initialBalance = scope.baseBalance
    const currentBalance = data.length > 0 ? data[data.length - 1].equity : initialBalance
    const maxDrawdown = data.length > 0 ? Math.max(...data.map(p => p.drawdown)) : 0
    const currentDrawdown = data.length > 0 ? data[data.length - 1].drawdown : 0

    return NextResponse.json({
      data,
      initialBalance,
      currentBalance,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      currentDrawdown: Math.round(currentDrawdown * 100) / 100,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
