import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseCSV } from "@/lib/parsers"
import { parseGenericCSV, type GenericMapping } from "@/lib/parsers/generic.parser"
import { classifySymbol } from "@/lib/market/symbols"
import { getActiveAccount } from "@/lib/active-account"
import { evaluateChallenge } from "@/lib/prop-firm.service"
import { rateLimit } from "@/lib/rate-limit"

const PREVIEW_LIMIT = 10

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rl = rateLimit(`import:${session.user.id}`, { limit: 5, windowMs: 60000 })
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const broker = formData.get("broker") as string
    const accountId = (formData.get("accountId") as string) || null
    const mappingRaw = (formData.get("mapping") as string) || null
    const mode = (formData.get("mode") as string) || "import"

    if (!file || !broker) {
      return NextResponse.json({ error: "File and broker are required." }, { status: 400 })
    }

    const text = await file.text()

    // Retrieve target account: a specific account, or the active account
    let account = null
    let targetChallenge = null

    if (accountId) {
      account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: session.user.id }
      })
      if (!account) {
        return NextResponse.json({ error: "Trading account not found." }, { status: 404 })
      }
      targetChallenge = await prisma.propChallenge.findFirst({
        where: { accountId: account.id }
      })
    } else {
      account = await getActiveAccount(session.user.id)
      if (account) {
        targetChallenge = await prisma.propChallenge.findFirst({
          where: { accountId: account.id }
        })
      }
    }

    if (!account) {
      return NextResponse.json({ error: "No trading account found." }, { status: 404 })
    }

    let parseResult
    if (broker === "generic" && mappingRaw) {
      let mapping: GenericMapping
      try {
        mapping = JSON.parse(mappingRaw)
      } catch {
        return NextResponse.json({ error: "Invalid column mapping." }, { status: 400 })
      }
      parseResult = parseGenericCSV(text, mapping)
    } else {
      parseResult = await parseCSV(text, broker as any)
    }

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
          netPnl = (diff * (t.quantity || 1)) - (t.fees || 0)
        } else {
          netPnl = 0
        }
      }

      return {
        userId,
        accountId: account.id,
        symbol: t.symbol,
        instrumentType: t.instrumentType || classifySymbol(t.symbol),
        side: t.side.toUpperCase(),
        entryAt: t.entryAt,
        exitAt: t.exitAt || t.entryAt, // Default to entry if missing
        entryPrice: t.entryPrice ?? 0,
        exitPrice: t.exitPrice ?? 0,
        quantity: t.quantity ?? 0,
        netPnl,
        netPnlUsd: Math.round(Number(netPnl) * fxRate * 10000) / 10000,
        fees: t.fees || 0,
        status: t.status === "open" ? "open" : "closed",
        setupTags: defaultSetupTags,
      }
    })

    // ── PREVIEW MODE ─────────────────────────────────────────────────────────
    if (mode === "preview") {
      // Duplicate detection against existing trades (symbol + entryAt + side)
      const existing = await prisma.trade.findMany({
        where: { accountId: account.id },
        select: { symbol: true, entryAt: true, side: true },
      })
      const seen = new Set(existing.map(e => `${e.symbol}|${e.entryAt.getTime()}|${e.side.toUpperCase()}`))

      const previewRows = tradesToInsert.slice(0, PREVIEW_LIMIT).map((t) => ({
        symbol: t.symbol,
        side: t.side,
        entryAt: t.entryAt.toISOString(),
        exitAt: t.exitAt?.toISOString() || null,
        quantity: Number(t.quantity),
        entryPrice: Number(t.entryPrice),
        exitPrice: Number(t.exitPrice),
        netPnl: Number(t.netPnl),
        fees: Number(t.fees),
        status: t.status,
      }))

      const duplicates = tradesToInsert.filter(t =>
        seen.has(`${t.symbol}|${new Date(t.entryAt).getTime()}|${t.side}`)
      ).length

      return NextResponse.json({
        preview: true,
        total: tradesToInsert.length,
        duplicates,
        newRows: tradesToInsert.length - duplicates,
        previewRows,
        parseErrors: parseResult.errors.slice(0, 5),
      })
    }

    // ── IMPORT MODE ──────────────────────────────────────────────────────────
    const before = new Date()

    const result = await prisma.trade.createMany({
      data: tradesToInsert,
      skipDuplicates: true,
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

    return NextResponse.json({
      count: result.count,
      challengeStatus,
      token: {
        accountId: account.id,
        before: before.toISOString(),
        challengeId: targetChallenge?.id || null,
      },
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
