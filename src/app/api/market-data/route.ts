import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { getMarketDataProvider } from "@/lib/market/providers"
import type { Candle, MarketDataQuery } from "@/lib/market/types"
import { MARKET_TIMEFRAMES } from "@/lib/market/types"

const querySchema = z
  .object({
    symbol: z.string().trim().min(2).max(24),
    timeframe: z.enum(MARKET_TIMEFRAMES),
    from: z.coerce.number().int().positive(),
    to: z.coerce.number().int().positive(),
  })
  .refine((d) => d.to > d.from, { message: "to must be greater than from" })

// Historical data is immutable, so cache entries never expire — only cap the size.
const memoryCache = new Map<string, Candle[]>()
const CACHE_MAX = 800

function cacheKey(q: MarketDataQuery): string {
  return `v2|${q.symbol}|${q.timeframe}|${q.from}|${q.to}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      )
    }

    const query: MarketDataQuery = parsed.data
    const key = cacheKey(query)
    let candles = memoryCache.get(key)
    if (!candles) {
      const provider = getMarketDataProvider()
      candles = await provider.fetchCandles(query)
      if (memoryCache.size >= CACHE_MAX) {
        const first = memoryCache.keys().next().value
        if (first !== undefined) memoryCache.delete(first)
      }
      memoryCache.set(key, candles)
    }

    const filtered = candles.filter((c) => c.time >= query.from && c.time <= query.to)
    return NextResponse.json({
      symbol: query.symbol,
      timeframe: query.timeframe,
      candles: filtered,
      provider: getMarketDataProvider().name,
    })
  } catch {
    const message = "Internal Server Error"
    console.error("Market data error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}