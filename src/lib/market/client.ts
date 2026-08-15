"use client"

import type { Candle, MarketDataQuery, MarketTimeframe } from "./types"
import { getCachedCandles, setCachedCandles } from "./cache"

export interface FetchCandlesResult {
  symbol: string
  timeframe: MarketTimeframe
  candles: Candle[]
  fromCache: boolean
}

export async function fetchCandles(query: MarketDataQuery): Promise<FetchCandlesResult> {
  const key = `${query.symbol}|${query.timeframe}|${query.from}|${query.to}`

  const cached = await getCachedCandles(key)
  if (cached && cached.length > 0) {
    return { symbol: query.symbol, timeframe: query.timeframe, candles: cached, fromCache: true }
  }

  const params = new URLSearchParams({
    symbol: query.symbol,
    timeframe: query.timeframe,
    from: String(query.from),
    to: String(query.to),
  })

  const res = await fetch(`/api/market-data?${params.toString()}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Market data request failed (${res.status})`)
  }

  const data = await res.json()
  const candles: Candle[] = data.candles ?? []

  // Cache even empty results so we don't hammer the API for the same dead range.
  await setCachedCandles(key, candles)

  return { symbol: query.symbol, timeframe: query.timeframe, candles, fromCache: false }
}
