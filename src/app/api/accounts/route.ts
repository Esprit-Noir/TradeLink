import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  initialBalance: z.string().or(z.number()).optional(),
  baseCurrency: z.string().min(3).max(3).optional(),
  type: z.enum(["personal", "prop_firm", "demo", "backtest"]).optional(),
  broker: z.string().max(100).optional(),
  fxRateToUsd: z.string().or(z.number()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
      include: {
        propChallenge: true,
        _count: {
          select: { trades: { where: { status: "closed" } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const accountIds = accounts.map(a => a.id)
    const aggregates = await prisma.trade.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds }, status: "closed" },
      _sum: { netPnl: true, netPnlUsd: true },
    })
    const aggMap = new Map(aggregates.map(a => [a.accountId, a]))

    const accountsWithStats = accounts.map(acc => {
      const agg = aggMap.get(acc.id)
      const totalPnl = Number(agg?._sum.netPnl || 0)
      const totalPnlUsd = Number((agg?._sum.netPnlUsd ?? agg?._sum.netPnl) || 0)
      
      return {
        id: acc.id,
        name: acc.name,
        broker: acc.broker,
        type: acc.type === "backtest" ? "demo" : acc.type,
        baseCurrency: acc.baseCurrency,
        fxRateToUsd: acc.fxRateToUsd ? Number(acc.fxRateToUsd) : 1,
        initialBalance: acc.initialBalance ? Number(acc.initialBalance) : 0,
        isDefault: acc.isDefault,
        createdAt: acc.createdAt,
        propChallenge: acc.propChallenge ? {
          ...acc.propChallenge,
          currentEquity: acc.propChallenge.currentEquity ? Number(acc.propChallenge.currentEquity) : 0,
          initialBalance: acc.propChallenge.initialBalance ? Number(acc.propChallenge.initialBalance) : 0,
        } : null,
        stats: {
          tradesCount: acc._count.trades,
          totalPnl,
          totalPnlUsd,
        }
      }
    })

    return NextResponse.json(accountsWithStats)
  } catch (error) {
    console.error("Error fetching accounts:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, initialBalance, baseCurrency, type, broker, fxRateToUsd } = parsed.data

    // Check if it's the first account
    const existingAccounts = await prisma.tradingAccount.count({
      where: { userId: session.user.id }
    })

    const newAccount = await prisma.tradingAccount.create({
      data: {
        userId: session.user.id,
        name,
        type: type || "personal",
        broker: broker || null,
        initialBalance: initialBalance ? parseFloat(String(initialBalance)) || 0 : 0,
        baseCurrency: baseCurrency || "USD",
        fxRateToUsd: fxRateToUsd ? parseFloat(String(fxRateToUsd)) || 1 : 1,
        isDefault: existingAccounts === 0
      }
    })

    return NextResponse.json(newAccount)
  } catch (error) {
    console.error("Error creating account:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
