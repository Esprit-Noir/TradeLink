import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseCSV } from "@/lib/parsers"
import { getActiveAccount } from "@/lib/active-account"
import { evaluateChallenge } from "@/lib/prop-firm.service"


export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const broker = formData.get("broker") as string
    const challengeId = (formData.get("challengeId") as string) || null

    if (!file || !broker) {
      return NextResponse.json({ error: "File and broker are required." }, { status: 400 })
    }

    const text = await file.text()

    // Retrieve target account: a specific prop challenge account, or the default account
    let account = null
    let targetChallenge = null

    if (challengeId) {
      targetChallenge = await prisma.propChallenge.findUnique({
        where: { id: challengeId },
        include: { account: true }
      })
      if (!targetChallenge || targetChallenge.userId !== session.user.id) {
        return NextResponse.json({ error: "Challenge not found." }, { status: 404 })
      }
      account = targetChallenge.account
    } else {
      account = await getActiveAccount(session.user.id)
    }

    if (!account) {
      return NextResponse.json({ error: "No trading account found." }, { status: 404 })
    }

    // Run custom parsers directly on the text
    // The broker type in the parser uses lowercased keys, so we cast it. 
    // Usually the frontend sends 'interactive_brokers', 'binance', or 'bybit'.
    const parseResult = await parseCSV(text, broker as any)

    if (parseResult.errors.length > 0 && parseResult.trades.length === 0) {
       return NextResponse.json({ error: "Failed to parse CSV file: " + parseResult.errors[0].message }, { status: 400 })
    }

    const parsedTrades = parseResult.trades

    if (parsedTrades.length === 0) {
      return NextResponse.json({ error: "No valid trades found in the CSV." }, { status: 400 })
    }

    const userId = session.user.id as string

    // Fetch default setup
    const defaultSetup = await prisma.tradingSetup.findFirst({
      where: { userId: session.user.id, isDefault: true }
    })
    const defaultSetupTags = defaultSetup ? [defaultSetup.name] : []

    const fxRate = Number(account.fxRateToUsd ?? 1)

    // Map to Prisma schema and calculate missing fields
    const tradesToInsert = parsedTrades.map((t) => {
      const isLong = t.side.toUpperCase() === "LONG"
      let netPnl = t.netPnl
      
      // Basic P&L calculation if missing
      if (netPnl === undefined) {
        if (t.exitPrice && t.entryPrice) {
          const diff = isLong ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice
          netPnl = diff * t.quantity
        } else {
          netPnl = 0
        }
      }

      return {
        userId,
        accountId: account.id,
        symbol: t.symbol,
        instrumentType: t.instrumentType || "CRYPTO", // Fallback
        side: t.side.toUpperCase(),
        entryAt: t.entryAt,
        exitAt: t.exitAt || t.entryAt, // Default to entry if missing
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice || t.entryPrice,
        quantity: t.quantity,
        netPnl,
        netPnlUsd: Math.round(Number(netPnl) * fxRate * 10000) / 10000,
        fees: t.fees || 0,
        status: "closed",
        setupTags: defaultSetupTags,
      }
    })

    // Batch insert
    const result = await prisma.trade.createMany({
      data: tradesToInsert,
      skipDuplicates: true, // Prevents failing if some trades already exist based on unique constraints if we add them
    })

    // Invalidate behavioral snapshot cache
    await prisma.behavioralSnapshot.deleteMany({
      where: { accountId: account.id },
    })

    // If importing into a prop challenge, re-evaluate the challenge immediately
    let challengeStatus = null
    if (targetChallenge && result.count > 0) {
      const evaluated = await evaluateChallenge(targetChallenge.id)
      challengeStatus = evaluated?.status ?? null
    }

    return NextResponse.json({ count: result.count, challengeStatus })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to import trades" }, { status: 500 })
  }
}
