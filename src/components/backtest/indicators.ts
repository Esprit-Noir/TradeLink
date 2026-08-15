import type { Candle } from "@/lib/market/types"
import { atr, bollinger, ema, rsi, vwap } from "@/lib/market/indicators"
import type { IndicatorSeries } from "./types"

export function computeIndicatorSeries(candles: Candle[]): IndicatorSeries {
  const closes = candles.map((c) => c.close)
  const bb = bollinger(closes, 20, 2)
  return {
    ema9: ema(closes, 9),
    ema20: ema(closes, 20),
    ema50: ema(closes, 50),
    ema200: ema(closes, 200),
    rsi: rsi(closes, 14),
    vwap: vwap(candles),
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
  }
}

export function atrAt(candles: Candle[], index: number, period = 14): number {
  const start = Math.max(0, index - period)
  if (start >= index) return (candles[index]?.high ?? 0) - (candles[index]?.low ?? 0)
  const slice = candles.slice(start, index + 1)
  const series = atr(slice, period)
  const v = series[series.length - 1]
  return v ?? (slice[slice.length - 1]?.high ?? 0) - (slice[slice.length - 1]?.low ?? 0)
}
