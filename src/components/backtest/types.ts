export type SimSide = "long" | "short"

export interface SimTrade {
  id: string
  side: SimSide
  entryPrice: number
  stopLoss: number
  takeProfit: number
  quantity: number
  riskAmount: number
  entryTime: number
  entryIndex: number
  exitPrice: number | null
  exitTime: number | null
  exitIndex: number | null
  reason: "sl" | "tp" | "manual" | null
  netPnl: number | null
  rMultiple: number | null
  screenshotUrl: string | null
  saved: boolean
  saving: boolean
}

export interface IndicatorsState {
  ema9: boolean
  ema20: boolean
  ema50: boolean
  ema200: boolean
  rsi: boolean
  vwap: boolean
  bb: boolean
  volume: boolean
}

export const DEFAULT_INDICATORS: IndicatorsState = {
  ema9: true,
  ema20: false,
  ema50: true,
  ema200: false,
  rsi: false,
  vwap: false,
  bb: false,
  volume: true,
}

export interface SessionStats {
  trades: number
  wins: number
  losses: number
  winRate: number
  cumPnl: number
  avgR: number
}

export interface IndicatorSeries {
  ema9: (number | null)[]
  ema20: (number | null)[]
  ema50: (number | null)[]
  ema200: (number | null)[]
  rsi: (number | null)[]
  vwap: (number | null)[]
  bbUpper: (number | null)[]
  bbMiddle: (number | null)[]
  bbLower: (number | null)[]
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export interface BacktestSessionItem {
  id: string
  symbol: string
  timeframe: string
  tradesCount: number
  closedPnl: number | null
  createdAt: string
}
