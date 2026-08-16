import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"

const HEADERS = [
  "entryAt", "exitAt", "symbol", "instrumentType", "side", "quantity",
  "entryPrice", "exitPrice", "stopLoss", "riskAmount", "fees",
  "grossPnl", "netPnl", "netPnlUsd", "setupTags", "emotionTags", "status",
]

function escapeCsv(value: any): string {
  const str = value === null || value === undefined ? "" : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const accountId = url.searchParams.get("accountId") || "all"
    const scope = await resolveAccountScope(session.user.id, accountId)

    if (!scope.all && scope.accounts.length === 0) {
      return new Response("")
    }

    const whereClause: any = scope.all
      ? { userId: session.user.id }
      : { accountId: scope.accounts[0].id }

    const symbol = url.searchParams.get("symbol")
    const side = url.searchParams.get("side")
    const result = url.searchParams.get("result")
    const status = url.searchParams.get("status")
    const date = url.searchParams.get("date")
    const sort = url.searchParams.get("sort")

    if (symbol) whereClause.symbol = { contains: symbol, mode: "insensitive" }
    if (side) whereClause.side = side
    if (status) whereClause.status = status
    if (result) {
      if (result === "win") whereClause.netPnl = { gt: 0 }
      else if (result === "loss") whereClause.netPnl = { lt: 0 }
      else if (result === "be") whereClause.netPnl = { equals: 0 }
    }
    if (date) {
      const now = new Date()
      if (date === "today") whereClause.entryAt = { gte: new Date(now.setHours(0, 0, 0, 0)) }
      else if (date === "7d") { const p = new Date(); p.setDate(p.getDate() - 7); whereClause.entryAt = { gte: p } }
      else if (date === "30d") { const p = new Date(); p.setDate(p.getDate() - 30); whereClause.entryAt = { gte: p } }
      else if (date === "this_month") whereClause.entryAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    }

    const orderBy: any = {}
    if (sort && sort in HEADERS) orderBy[sort] = "asc"
    else orderBy.entryAt = "desc"

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy,
      select: {
        entryAt: true, exitAt: true, symbol: true, instrumentType: true, side: true,
        quantity: true, entryPrice: true, exitPrice: true, stopLoss: true, riskAmount: true,
        fees: true, grossPnl: true, netPnl: true, netPnlUsd: true, setupTags: true,
        emotionTags: true, status: true,
      },
    })

    const rows = trades.map((t) => [
      t.entryAt.toISOString(),
      t.exitAt ? t.exitAt.toISOString() : "",
      t.symbol,
      t.instrumentType || "",
      t.side,
      t.quantity,
      t.entryPrice ?? "",
      t.exitPrice ?? "",
      t.stopLoss ?? "",
      t.riskAmount ?? "",
      t.fees ?? 0,
      t.grossPnl ?? "",
      t.netPnl ?? "",
      t.netPnlUsd ?? "",
      (t.setupTags || []).join("|"),
      (t.emotionTags || []).join("|"),
      t.status,
    ])

    const csv = [HEADERS.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="trades-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error("[TRADES_EXPORT_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
