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
    const accountId = searchParams.get("accountId")

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      if (from) fromDate = new Date(from)
      if (to) toDate = new Date(to)
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
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
