import { NextResponse } from "next/server"
import { z } from "zod"
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
  symbol: z.string().trim().toUpperCase().min(1),
  timeframe: z.enum(MARKET_TIMEFRAMES),
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  strategyName: z.string().optional(),
  initialBalance: z.number().positive().default(10000),
  trades: z.array(tradeSchema).max(1000),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await prisma.backtestSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        trades: {
          select: {
            id: true,
            symbol: true,
            side: true,
            entryPrice: true,
            exitPrice: true,
            stopLoss: true,
            quantity: true,
            entryAt: true,
            exitAt: true,
            netPnl: true,
          },
          orderBy: { entryAt: "asc" },
        },
      },
    })

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        symbol: s.symbol,
        timeframe: s.timeframe,
        from: s.from,
        to: s.to,
        strategyName: s.strategyName,
        initialBalance: Number(s.initialBalance),
        closedPnl: s.closedPnl ? Number(s.closedPnl) : null,
        winRate: s.winRate ? Number(s.winRate) : null,
        tradesCount: s.tradesCount,
        createdAt: s.createdAt,
        trades: s.trades.map((t) => ({
          id: t.id,
          symbol: t.symbol,
          side: t.side,
          entryPrice: Number(t.entryPrice),
          exitPrice: Number(t.exitPrice ?? t.entryPrice),
          stopLoss: t.stopLoss ? Number(t.stopLoss) : null,
          quantity: Number(t.quantity),
          entryAt: t.entryAt,
          exitAt: t.exitAt,
          netPnl: Number(t.netPnl ?? 0),
        })),
      })),
    )
  } catch (error) {
    const message = "Internal Server Error"
    console.error("Backtest sessions list error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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

    const { symbol, timeframe, from, to, strategyName, initialBalance, trades } = parsed.data
    const userId = session.user.id
    const account = await ensureBacktestAccount(userId)

    const pnls = trades.map((t) => t.netPnl)
    const closedPnl = pnls.reduce((s, p) => s + p, 0)
    const wins = pnls.filter((p) => p > 0).length
    const winRate = trades.length ? Math.round((wins / trades.length) * 10000) / 100 : null

    const backtestSession = await prisma.backtestSession.create({
      data: {
        userId,
        symbol,
        timeframe,
        from: new Date(from * 1000),
        to: new Date(to * 1000),
        strategyName: strategyName || null,
        initialBalance,
        tradesCount: trades.length,
        closedPnl,
        winRate,
        trades: {
          create: trades.map((t) => ({
            userId,
            accountId: account.id,
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
            ...(t.screenshotUrl
              ? {
                  screenshots: {
                    create: {
                      storageUrl: t.screenshotUrl,
                      fileName: t.screenshotUrl.split("/").pop() || "replay.png",
                    },
                  },
                }
              : {}),
          })),
        },
      },
    })

    return NextResponse.json({ success: true, session: backtestSession })
  } catch (error) {
    const message = "Internal Server Error"
    console.error("Backtest session save error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
