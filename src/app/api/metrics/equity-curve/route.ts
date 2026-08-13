// API Route — GET /api/metrics/equity-curve
// Renvoie les points de l'equity curve pour le compte par défaut

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeEquityCurve } from "@/lib/metrics"
import { NextResponse } from "next/server"
import { getActiveAccount } from "@/lib/active-account"

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

    const account = await getActiveAccount(session.user.id)

    if (!account) {
      return NextResponse.json({ data: [] })
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
      whereClause.exitAt = {}
      if (fromDate) whereClause.exitAt.gte = fromDate
      if (toDate) whereClause.exitAt.lte = toDate
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { exitAt: "asc" },
    })

    const data = computeEquityCurve(trades, Number(account.initialBalance ?? 0))
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
