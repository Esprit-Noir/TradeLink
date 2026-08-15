import type { Candle } from "./types"

export type Series = (number | null)[]

export function sma(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

export function ema(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null)
  if (values.length === 0 || period <= 0) return out
  const k = 2 / (period + 1)
  let prev = values[0]
  out[0] = values[0]
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

export function rsi(values: number[], period = 14): Series {
  const out: Series = new Array(values.length).fill(null)
  if (values.length < period + 1) return out
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1]
    if (change >= 0) avgGain += change
    else avgLoss -= change
  }
  avgGain /= period
  avgLoss /= period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

export interface Bollinger {
  upper: Series
  middle: Series
  lower: Series
}

export function bollinger(values: number[], period = 20, mult = 2): Bollinger {
  const middle = sma(values, period)
  const upper: Series = new Array(values.length).fill(null)
  const lower: Series = new Array(values.length).fill(null)
  for (let i = period - 1; i < values.length; i++) {
    const mean = middle[i]!
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j++) {
      const d = values[j] - mean
      sumSq += d * d
    }
    const sd = Math.sqrt(sumSq / period)
    upper[i] = mean + mult * sd
    lower[i] = mean - mult * sd
  }
  return { upper, middle, lower }
}

export function trueRange(candle: Candle, prevClose: number): number {
  const highLow = candle.high - candle.low
  const highPrev = Math.abs(candle.high - prevClose)
  const lowPrev = Math.abs(candle.low - prevClose)
  return Math.max(highLow, highPrev, lowPrev)
}

export function atr(candles: Candle[], period = 14): Series {
  const out: Series = new Array(candles.length).fill(null)
  if (candles.length < period + 1) return out
  const trs: number[] = []
  for (let i = 1; i <= period; i++) {
    trs.push(trueRange(candles[i], candles[i - 1].close))
  }
  let cur = trs.reduce((s, t) => s + t, 0) / period
  out[period] = cur
  for (let i = period + 1; i < candles.length; i++) {
    const tr = trueRange(candles[i], candles[i - 1].close)
    cur = (cur * (period - 1) + tr) / period
    out[i] = cur
  }
  return out
}

/**
 * Session-anchored VWAP (anchor resets at each UTC midnight).
 * Typical Price = (high + low + close) / 3.
 */
export function vwap(candles: Candle[]): Series {
  const out: Series = new Array(candles.length).fill(null)
  let cumPV = 0
  let cumVol = 0
  let currentDay = startOfUtcDay(candles[0]?.time)
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]
    const day = startOfUtcDay(c.time)
    if (day !== currentDay) {
      currentDay = day
      cumPV = 0
      cumVol = 0
    }
    const tp = (c.high + c.low + c.close) / 3
    cumPV += tp * c.volume
    cumVol += c.volume
    out[i] = cumVol > 0 ? cumPV / cumVol : null
  }
  return out
}

export function startOfUtcDay(timeSec: number): number {
  return Math.floor(timeSec / 86400) * 86400
}
