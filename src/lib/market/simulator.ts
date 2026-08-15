import type { Candle } from "./types"

export type SimSide = "long" | "short"

export interface SimPosition {
  id: string
  side: SimSide
  entryPrice: number
  stopLoss: number
  takeProfit: number
  quantity: number
  riskAmount: number // absolute amount risked (in instrument quote units)
  entryTime: number
  entryIndex: number // index in the main candle array where the trade was opened
}

export interface SimClose {
  closed: true
  reason: "sl" | "tp" | "manual"
  exitPrice: number
  exitTime: number
  exitIndex: number
  netPnl: number
  rMultiple: number
}

export type SimResult = SimClose | { closed: false }

/**
 * Walks candles forward from the trade entry and returns the first close event
 * (SL or TP). When a candle touches both levels we pick the one nearest to the
 * entry in price distance (a best-effort approximation of intra-candle path).
 */
export function simulateClose(position: SimPosition, candles: Candle[]): SimResult {
  for (let i = position.entryIndex; i < candles.length; i++) {
    const c = candles[i]
    if (position.side === "long") {
      const hitTp = c.high >= position.takeProfit
      const hitSl = c.low <= position.stopLoss
      if (hitTp && hitSl) {
        const dTp = position.takeProfit - position.entryPrice
        const dSl = position.entryPrice - position.stopLoss
        if (dTp <= dSl) return closeResult(position, c, i, "tp", position.takeProfit)
        return closeResult(position, c, i, "sl", position.stopLoss)
      }
      if (hitTp) return closeResult(position, c, i, "tp", position.takeProfit)
      if (hitSl) return closeResult(position, c, i, "sl", position.stopLoss)
    } else {
      const hitTp = c.low <= position.takeProfit
      const hitSl = c.high >= position.stopLoss
      if (hitTp && hitSl) {
        const dTp = position.entryPrice - position.takeProfit
        const dSl = position.stopLoss - position.entryPrice
        if (dTp <= dSl) return closeResult(position, c, i, "tp", position.takeProfit)
        return closeResult(position, c, i, "sl", position.stopLoss)
      }
      if (hitTp) return closeResult(position, c, i, "tp", position.takeProfit)
      if (hitSl) return closeResult(position, c, i, "sl", position.stopLoss)
    }
  }
  return { closed: false }
}

function closeResult(
  position: SimPosition,
  candle: Candle,
  index: number,
  reason: "sl" | "tp",
  exitPrice: number,
): SimClose {
  const diff = position.side === "long" ? exitPrice - position.entryPrice : position.entryPrice - exitPrice
  const netPnl = diff * position.quantity
  const riskPerUnit =
    position.side === "long"
      ? position.entryPrice - position.stopLoss
      : position.stopLoss - position.entryPrice
  const rMultiple = riskPerUnit > 0 ? diff / riskPerUnit : 0
  return {
    closed: true,
    reason,
    exitPrice,
    exitTime: candle.time,
    exitIndex: index,
    netPnl,
    rMultiple,
  }
}

/**
 * Live mark-to-market P&L of an open position at a given candle (for the display).
 */
export function unrealizedPnl(position: SimPosition, candle: Candle): number {
  const diff = position.side === "long" ? candle.close - position.entryPrice : position.entryPrice - candle.close
  return diff * position.quantity
}

export function positionSizeFromRisk(
  balance: number,
  riskPct: number,
  entryPrice: number,
  stopLoss: number,
): number {
  const riskAmount = (balance * riskPct) / 100
  const riskPerUnit = Math.abs(entryPrice - stopLoss)
  if (riskPerUnit <= 0) return 0
  return riskAmount / riskPerUnit
}

export function riskReward(entryPrice: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entryPrice - stopLoss)
  const reward = Math.abs(takeProfit - entryPrice)
  if (risk <= 0) return 0
  return reward / risk
}

export function atrBasedLevels(side: SimSide, price: number, atrValue: number) {
  const sl = side === "long" ? price - 1.5 * atrValue : price + 1.5 * atrValue
  const tp = side === "long" ? price + 3 * atrValue : price - 3 * atrValue
  return { sl, tp }
}
