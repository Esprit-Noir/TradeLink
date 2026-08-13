import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseTrades } from "@/lib/parsers"
import Papa from "papaparse"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const broker = formData.get("broker") as string

    if (!file || !broker) {
      return NextResponse.json({ error: "File and broker are required." }, { status: 400 })
    }

    const text = await file.text()

    // Retrieve default account
    const account = await prisma.tradingAccount.findFirst({
      where: { userId: session.user.id, isDefault: true },
    })

    if (!account) {
      return NextResponse.json({ error: "No trading account found." }, { status: 404 })
    }

    // Convert CSV to generic objects
    const { data: rawRows, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })

    if (errors.length > 0 && rawRows.length === 0) {
      return NextResponse.json({ error: "Failed to parse CSV file." }, { status: 400 })
    }

    // Run custom parsers
    const parsedTrades = parseTrades(broker, rawRows)

    if (parsedTrades.length === 0) {
      return NextResponse.json({ error: "No valid trades found in the CSV." }, { status: 400 })
    }

    // Map to Prisma schema and calculate missing fields
    const tradesToInsert = parsedTrades.map((t) => {
      const isLong = t.direction === "LONG"
      let netPnl = t.realizedPnl
      
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
        userId: session.user.id,
        accountId: account.id,
        symbol: t.symbol,
        instrumentType: t.market,
        side: t.direction,
        entryAt: t.entryAt,
        exitAt: t.exitAt || t.entryAt, // Default to entry if missing
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice || t.entryPrice,
        quantity: t.quantity,
        netPnl,
        fees: t.fees || 0,
        status: t.status,
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

    return NextResponse.json({ count: result.count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to import trades" }, { status: 500 })
  }
}
