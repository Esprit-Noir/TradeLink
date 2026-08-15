export type MarketTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1D"

export const MARKET_TIMEFRAMES: MarketTimeframe[] = ["1m", "5m", "15m", "1h", "4h", "1D"]

export interface Candle {
  time: number // unix seconds (UTC)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketQuote {
  symbol: string
  name: string | null
  last: number | null
  change: number | null
  changePct: number | null
  isMarketOpen?: boolean
}

export interface MarketDataQuery {
  symbol: string
  timeframe: MarketTimeframe
  from: number // unix seconds
  to: number // unix seconds
}

export const TIMEFRAME_SECONDS: Record<MarketTimeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1D": 86400,
}

// Number of candles per upstream fetch chunk (Binance returns max 1000 per request).
export const MARKET_BUCKET_CANDLES = 1000
