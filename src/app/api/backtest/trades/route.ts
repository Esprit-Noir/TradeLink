import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureBacktestAccount } from "@/lib/backtest"
import { classifySymbol } from "@/lib/market/symbols"
import { MARKET_TIMEFRAMES } from "@/lib/market/types"

const tradeSchema = z.object({
  side: z.enum(["long", "short"]),
  symbol: z.string().trim().toUpperCase().min(1),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  entryAt: z.number().int().positive(),
  exitAt: z.number().int().positive(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  quantity: z.number().positive(),
  riskAmount: z.number().optional(),
  netPnl: z.number(),
  screenshotUrl: z.string().optional(),
  notes: z.string().optional(),
})

const bodySchema = z.object({
  session: z.object({
    symbol: z.string().trim().toUpperCase().min(1),
    timeframe: z.enum(MARKET_TIMEFRAMES),
    from: z.number().int().positive(),
    to: z.number().int().positive(),
    strategyName: z.string().optional(),
    initialBalance: z.number().positive().default(10000),
  }),
  trade: tradeSchema,
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      )
    }

    const { session: s, trade: t } = parsed.data
    const account = await ensureBacktestAccount(session.user.id)

    // Find (or create) a session matching this replay period so trades from the
    // same replay accumulate into one BacktestSession.
    let backtestSession = await prisma.backtestSession.findFirst({
      where: {
        userId: session.user.id,
        symbol: s.symbol,
        timeframe: s.timeframe,
        from: new Date(s.from * 1000),
        to: new Date(s.to * 1000),
      },
      orderBy: { createdAt: "desc" },
    })

    if (!backtestSession) {
      backtestSession = await prisma.backtestSession.create({
        data: {
          userId: session.user.id,
          symbol: s.symbol,
          timeframe: s.timeframe,
          from: new Date(s.from * 1000),
          to: new Date(s.to * 1000),
          strategyName: s.strategyName || null,
          initialBalance: s.initialBalance,
        },
      })
    }

    const trade = await prisma.trade.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        backtestSessionId: backtestSession.id,
        symbol: t.symbol,
        instrumentType: classifySymbol(t.symbol),
        side: t.side === "long" ? "LONG" : "SHORT",
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        entryAt: new Date(t.entryAt * 1000),
        exitAt: new Date(t.exitAt * 1000),
        stopLoss: t.stopLoss ?? null,
        grossPnl: t.netPnl,
        netPnl: t.netPnl,
        netPnlUsd: t.netPnl,
        riskAmount: t.riskAmount ?? null,
        notesPost: t.notes ?? null,
        status: "closed",
        source: "backtest",
        importSource: "backtest",
        screenshots: t.screenshotUrl
          ? {
              create: {
                storageUrl: t.screenshotUrl,
                fileName: t.screenshotUrl.split("/").pop() || "replay.png",
              },
            }
          : undefined,
      },
    })

    // Refresh session aggregates
    // includeBacktest is a sentinel stripped by the Prisma client extension
    const where: Prisma.TradeWhereInput & { includeBacktest: true } = {
      backtestSessionId: backtestSession.id,
      includeBacktest: true,
    }
    const trades = await prisma.trade.findMany({ where })
    const pnls = trades.map((x) => Number(x.netPnl || 0))
    const wins = pnls.filter((p) => p > 0).length
    const closedPnl = pnls.reduce((s, p) => s + p, 0)
    await prisma.backtestSession.update({
      where: { id: backtestSession.id },
      data: {
        tradesCount: trades.length,
        closedPnl,
        winRate: trades.length ? Math.round((wins / trades.length) * 10000) / 100 : null,
      },
    })

    // Invalidate behavioral snapshot cache
    await prisma.behavioralSnapshot.deleteMany({
      where: { accountId: account.id },
    })

    return NextResponse.json({ success: true, trade, sessionId: backtestSession.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save backtest trade"
    console.error("Backtest trade save error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
