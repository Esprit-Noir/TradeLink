import type { Candle, MarketDataQuery, MarketQuote, MarketTimeframe } from "./types"
import { MARKET_BUCKET_CANDLES, TIMEFRAME_SECONDS } from "./types"
import { yahooSymbol } from "./symbols"
import YahooFinance from "yahoo-finance2"

export type MarketProvider = "yahoo" | "binance" | "twelveData"

export interface MarketDataProvider {
  name: MarketProvider
  fetchCandles(query: MarketDataQuery): Promise<Candle[]>
  fetchQuotes(symbols: string[]): Promise<MarketQuote[]>
}

// ─── Twelve Data ───────────────────────────────────────────────────────────────
// Free plan: 800 credits/day, 8 req/min. Covers forex, crypto, stocks and
// index/commodity ETFs; spot metals (silver, platinum) & indices require a paid
// plan. Requires a key:
//   TWELVEDATA_API_KEY=... in .env.local  (free at https://twelvedata.com)
// Symbols use Twelve Data format (EUR/USD, XAU/USD, BTC/USD, AAPL, SPY...).

const TD_BASE = "https://api.twelvedata.com"

function tdKey(): string {
  const k = process.env.TWELVEDATA_API_KEY
  if (!k) {
    throw new Error(
      "Clé API Twelve Data manquante — ajoutez TWELVEDATA_API_KEY dans .env.local (gratuit sur twelvedata.com)",
    )
  }
  return k
}

const TD_INTERVAL: Record<MarketTimeframe, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "1h": "1h",
  "4h": "4h",
  "1D": "1day",
}

const TD_MAX_POINTS = 5000

function fmtDate(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10)
}

async function tdFetch(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Twelve Data error ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`)
  }
  return res.json()
}

function parseTdDateTime(datetime: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(datetime)
  if (!m) return 0
  const [, Y, Mo, D, h, mi, s] = m
  return Math.floor(Date.UTC(Number(Y), Number(Mo) - 1, Number(D), Number(h), Number(mi), Number(s ?? "0")) / 1000)
}

async function fetchTdSeries(
  symbol: string,
  interval: string,
  startDate?: string,
  endDate?: string,
): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    outputsize: String(TD_MAX_POINTS),
    timezone: "UTC",
    apikey: tdKey(),
  })
  if (startDate) params.set("start_date", startDate)
  if (endDate) params.set("end_date", endDate)

  const json = (await tdFetch(`${TD_BASE}/time_series?${params.toString()}`)) as {
    status?: string
    code?: number
    message?: string
    values?: { datetime: string; open?: string; high?: string; low?: string; close?: string; volume?: string }[]
  }

  if (json.code || json.status === "error") {
    throw new Error(json.message || "Twelve Data time_series error")
  }
  if (!json.values) return []

  // Twelve Data returns values newest-first; we reverse to chronological order.
  const out: Candle[] = []
  for (let i = json.values.length - 1; i >= 0; i--) {
    const v = json.values[i]
    const time = parseTdDateTime(v.datetime)
    if (!time) continue
    out.push({
      time,
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
      volume: v.volume != null && v.volume !== "" ? Number(v.volume) : 0,
    })
  }
  return out
}

export const twelveDataProvider: MarketDataProvider = {
  name: "twelveData",
  async fetchCandles({ symbol, timeframe, from, to }) {
    const interval = TD_INTERVAL[timeframe]
    const step = TIMEFRAME_SECONDS[timeframe]
    const windowSec = TD_MAX_POINTS * step
    const out: Candle[] = []
    let cursor = to
    let guard = 0
    while (cursor > from && guard < 200) {
      const winStart = Math.max(from, cursor - windowSec)
      const candles = await fetchTdSeries(
        symbol,
        interval,
        fmtDate(winStart),
        fmtDate(Math.min(cursor, to) + step),
      )
      out.push(...candles)
      if (candles.length === 0) break
      const oldest = candles[0].time
      if (oldest >= cursor) break // no progress → stop
      cursor = oldest - step
      guard++
    }
    // Dedupe + keep only the requested window.
    const seen = new Set<number>()
    const unique: Candle[] = []
    for (const c of out) {
      if (c.time < from || c.time > to) continue
      if (seen.has(c.time)) continue
      seen.add(c.time)
      unique.push(c)
    }
    unique.sort((a, b) => a.time - b.time)
    return unique
  },
  async fetchQuotes(symbols) {
    const results: MarketQuote[] = []
    const batches: string[][] = []
    for (let i = 0; i < symbols.length; i += 8) batches.push(symbols.slice(i, i + 8))
    await Promise.all(
      batches.map(async (batch) => {
        try {
          const url = `${TD_BASE}/quote?symbol=${batch.map((s) => encodeURIComponent(s)).join(",")}&apikey=${tdKey()}`
          const j = (await tdFetch(url)) as Record<
            string,
            { status?: string; code?: number; message?: string; symbol?: string; name?: string; close?: string; change?: string; percent_change?: string; is_market_open?: boolean }
          >
          for (const requested of batch) {
            const q = j[requested]
            if (!q || q.code || q.status === "error") {
              results.push({ symbol: requested, name: null, last: null, change: null, changePct: null })
              continue
            }
            const last = Number(q.close)
            const change = Number(q.change)
            const changePct = Number(q.percent_change)
            results.push({
              symbol: q.symbol ?? requested,
              name: q.name ?? null,
              last: Number.isFinite(last) ? last : null,
              change: Number.isFinite(change) ? change : null,
              changePct: Number.isFinite(changePct) ? changePct : null,
              isMarketOpen: !!q.is_market_open,
            })
          }
        } catch {
          for (const symbol of batch) results.push({ symbol, name: null, last: null, change: null, changePct: null })
        }
      }),
    )
    return results
  },
}

// ─── Yahoo Finance ─────────────────────────────────────────────────────────────
// Uses the `yahoo-finance2` npm package (chart + quote). Free, no API key, no
// rate limit. Covers forex, metals, indices, energy, crypto and stocks.
// Symbol mapping is handled by `yahooSymbol()` (EUR/USD → EURUSD=X, XAU/USD →
// GC=F, US500 → ^GSPC, BTC/USD → BTC-USD...).
// Yahoo interval constraints: 1m ≈ 7 days, intraday (5m/15m) ≈ 60 days,
// 1h ≈ 730 days, 1d ≈ large history.

const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] })

type YahooInterval = "1m" | "5m" | "15m" | "1h" | "1d"

const YF_INTERVAL: Record<MarketTimeframe, YahooInterval> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "1h", // 4h is synthesized by aggregating 1h candles
  "1D": "1d",
}

interface YfQuoteRow {
  date?: Date
  open?: number | null
  high?: number | null
  low?: number | null
  close?: number | null
  volume?: number | null
}

interface YfQuote {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  marketState?: string
}

function aggregateCandles(candles: Candle[], hours: number): Candle[] {
  const step = hours * 3600
  const buckets = new Map<
    number,
    { open: number; high: number; low: number; close: number; volume: number }
  >()
  for (const c of candles) {
    const key = Math.floor(c.time / step) * step
    const b = buckets.get(key)
    if (!b) {
      buckets.set(key, { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume })
    } else {
      b.high = Math.max(b.high, c.high)
      b.low = Math.min(b.low, c.low)
      b.close = c.close
      b.volume += c.volume
    }
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, b]) => ({ time, ...b }))
}

export const yahooProvider: MarketDataProvider = {
  name: "yahoo",
  async fetchCandles({ symbol, timeframe, from, to }) {
    const ySymbol = yahooSymbol(symbol)
    const interval = YF_INTERVAL[timeframe]
    
    let period1 = new Date(from * 1000)
    const maxDaysMap: Record<YahooInterval, number> = {
      "1m": 7,
      "5m": 59,
      "15m": 59,
      "1h": 729,
      "1d": 99999,
    }
    const maxDays = maxDaysMap[interval] || 99999
    const maxDaysAgo = new Date()
    maxDaysAgo.setDate(maxDaysAgo.getDate() - maxDays)
    if (period1 < maxDaysAgo) {
      period1 = maxDaysAgo
    }

    const res = (await yahoo.chart(ySymbol, {
      period1,
      period2: new Date(to * 1000),
      interval,
    })) as { quotes?: YfQuoteRow[] }

    const candles: Candle[] = (res.quotes ?? [])
      .filter((r) => r.date && r.open != null)
      .map((r) => ({
        time: Math.floor((r.date as Date).getTime() / 1000),
        open: r.open as number,
        high: r.high ?? (r.open as number),
        low: r.low ?? (r.open as number),
        close: r.close ?? (r.open as number),
        volume: r.volume ?? 0,
      }))
      .sort((a, b) => a.time - b.time)
      .filter((c) => c.time >= from && c.time <= to)

    return timeframe === "4h" ? aggregateCandles(candles, 4) : candles
  },
  async fetchQuotes(symbols) {
    const requested = symbols.map((s) => ({ display: s, yahoo: yahooSymbol(s) }))
    const quoteMap = new Map<string, YfQuote>()
    const batches: string[][] = []
    for (let i = 0; i < requested.length; i += 8) {
      batches.push(requested.slice(i, i + 8).map((r) => r.yahoo))
    }
    await Promise.all(
      batches.map(async (batch) => {
        try {
          const res = (await yahoo.quote(batch)) as YfQuote | YfQuote[]
          const arr = Array.isArray(res) ? res : [res]
          for (const q of arr) quoteMap.set(q.symbol, q)
        } catch {
          // batch failed → those symbols will resolve to null quotes
        }
      }),
    )
    return requested.map((r) => {
      const q = quoteMap.get(r.yahoo)
      if (!q) return { symbol: r.display, name: null, last: null, change: null, changePct: null }
      return {
        symbol: r.display,
        name: q.shortName ?? q.longName ?? null,
        last: typeof q.regularMarketPrice === "number" ? q.regularMarketPrice : null,
        change: typeof q.regularMarketChange === "number" ? q.regularMarketChange : null,
        changePct: typeof q.regularMarketChangePercent === "number" ? q.regularMarketChangePercent : null,
        isMarketOpen: q.marketState != null && q.marketState !== "CLOSED",
      }
    })
  },
}

// ─── Binance ──────────────────────────────────────────────────────────────────
// Public klines endpoint, no API key required. Crypto only. Used when the app is
// explicitly configured with MARKET_DATA_PROVIDER=binance.

const BINANCE_API_BASES = ["https://api.binance.com", "https://data-api.binance.vision"]

const BINANCE_INTERVAL: Record<MarketTimeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1D": "1d",
}

async function fetchBinanceChunk(
  symbol: string,
  interval: string,
  startMs: number,
  endMs: number,
): Promise<Candle[]> {
  let lastError: unknown
  for (const base of BINANCE_API_BASES) {
    try {
      const url =
        `${base}/api/v3/klines?symbol=${encodeURIComponent(symbol)}` +
        `&interval=${interval}&startTime=${startMs}&endTime=${endMs}&limit=${MARKET_BUCKET_CANDLES}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`Binance error ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`)
      }
      const data = (await res.json()) as unknown[]
      if (!Array.isArray(data)) throw new Error("Invalid Binance response")
      return data.map((k) => {
        const row = k as unknown[]
        return {
          time: Math.floor(Number(row[0]) / 1000),
          open: Number(row[1]),
          high: Number(row[2]),
          low: Number(row[3]),
          close: Number(row[4]),
          volume: Number(row[5]),
        }
      })
    } catch (e) {
      lastError = e
    }
  }
  throw lastError ?? new Error("Binance unreachable")
}

export const binanceProvider: MarketDataProvider = {
  name: "binance",
  async fetchCandles({ symbol, timeframe, from, to }) {
    const interval = BINANCE_INTERVAL[timeframe]
    const stepSec = TIMEFRAME_SECONDS[timeframe] * MARKET_BUCKET_CANDLES
    const out: Candle[] = []
    let startMs = from * 1000
    const endMs = to * 1000
    let guard = 0
    while (startMs < endMs && guard < 500) {
      const chunk = await fetchBinanceChunk(symbol, interval, startMs, Math.min(startMs + stepSec * 1000, endMs))
      out.push(...chunk)
      const last = chunk[chunk.length - 1]
      if (!last) break
      startMs = (last.time + TIMEFRAME_SECONDS[timeframe]) * 1000
      if (chunk.length < MARKET_BUCKET_CANDLES) break
      guard++
    }
    const seen = new Set<number>()
    const unique: Candle[] = []
    for (const c of out) {
      if (seen.has(c.time)) continue
      seen.add(c.time)
      unique.push(c)
    }
    return unique
  },
  async fetchQuotes(symbols) {
    const results: MarketQuote[] = []
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          let lastError: unknown
          for (const base of BINANCE_API_BASES) {
            try {
              const res = await fetch(`${base}/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`, {
                cache: "no-store",
              })
              if (!res.ok) throw new Error(`status ${res.status}`)
              const j = (await res.json()) as {
                symbol?: string
                lastPrice?: string
                priceChange?: string
                priceChangePercent?: string
              }
              results.push({
                symbol: j.symbol ?? symbol,
                name: symbol,
                last: j.lastPrice != null ? Number(j.lastPrice) : null,
                change: j.priceChange != null ? Number(j.priceChange) : null,
                changePct: j.priceChangePercent != null ? Number(j.priceChangePercent) : null,
              })
              return
            } catch (e) {
              lastError = e
            }
          }
          throw lastError ?? new Error("unreachable")
        } catch {
          results.push({ symbol, name: null, last: null, change: null, changePct: null })
        }
      }),
    )
    return results
  },
}

export function getMarketDataProvider(): MarketDataProvider {
  const name = (process.env.MARKET_DATA_PROVIDER ?? "yahoo") as MarketProvider
  if (name === "binance") return binanceProvider
  if (name === "twelveData") return twelveDataProvider
  return yahooProvider
}