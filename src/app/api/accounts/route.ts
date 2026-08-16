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
        trades: {
          select: {
            netPnl: true,
            netPnlUsd: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const accountsWithStats = accounts.map(acc => {
      const closedTrades = acc.trades.filter(t => t.status === 'closed')
      const totalPnl = closedTrades.reduce((sum, t) => sum + Number(t.netPnl || 0), 0)
      const totalPnlUsd = closedTrades.reduce((sum, t) => sum + Number(t.netPnlUsd ?? (t.netPnl || 0)), 0)
      
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
          tradesCount: acc.trades.length,
          totalPnl,
          totalPnlUsd,
        }
      }
    })

    return NextResponse.json(accountsWithStats)
  } catch (error: any) {
    console.error("Error fetching accounts:", error)
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
  } catch (error: any) {
    console.error("Error creating account:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
