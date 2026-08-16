import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { getMarketDataProvider } from "@/lib/market/providers"
import type { MarketQuote } from "@/lib/market/types"

const schema = z.object({
  symbols: z.string().trim().min(1).max(400),
})

// Quotes change over time: cache briefly to absorb watchlist polling and avoid
// hammering the upstream API (Twelve Data free = 8 req/min).
const cache = new Map<string, { at: number; quotes: MarketQuote[] }>()
const QUOTE_TTL_MS = 15_000

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: "symbols invalides" }, { status: 400 })
    }

    const symbols = parsed.data.symbols
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30)

    const now = Date.now()
    const key = symbols.join(",")
    const hit = cache.get(key)
    if (hit && now - hit.at < QUOTE_TTL_MS) {
      return NextResponse.json({ quotes: hit.quotes })
    }

    const provider = getMarketDataProvider()
    const quotes = await provider.fetchQuotes(symbols)
    cache.set(key, { at: now, quotes })
    return NextResponse.json({ quotes })
  } catch (error) {
    const message = "Internal Server Error"
    console.error("Quotes error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}