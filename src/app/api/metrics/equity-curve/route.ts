// API Route — GET /api/metrics/equity-curve
// Renvoie les points de l'equity curve pour le compte par défaut

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeEquityCurve } from "@/lib/metrics"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await prisma.tradingAccount.findFirst({
    where: { userId: session.user.id, isDefault: true },
  })

  if (!account) {
    return NextResponse.json({ data: [] })
  }

  const trades = await prisma.trade.findMany({
    where: { accountId: account.id, status: "closed" },
    orderBy: { exitAt: "asc" },
  })

  const data = computeEquityCurve(trades, Number(account.initialBalance ?? 0))
  return NextResponse.json({ data })
}
