// lib/metrics.ts
// Calculs de métriques de performance trading — aucune dépendance externe

import type { Trade } from "@prisma/client"
import { dayKey, hourOfDay } from "@/lib/dates"

export interface PerformanceMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number          // 0–1
  avgWin: number
  avgLoss: number
  expectancy: number       // (winRate * avgWin) - (lossRate * avgLoss)
  profitFactor: number     // grossProfit / |grossLoss|
  netPnl: number
  grossProfit: number
  grossLoss: number
  maxDrawdown: number      // en valeur absolue
  maxDrawdownPct: number   // en %
  avgRR: number
  bestDay: { date: string; pnl: number } | null
  worstDay: { date: string; pnl: number } | null
  avgTradeDurationMin: number
}

export interface DailyPnL {
  date: string // YYYY-MM-DD
  pnl: number
  trades: number
}

export interface EquityPoint {
  date: string
  equity: number
  drawdown: number
}

// ─── Métriques globales ───────────────────────────────────────────────────────
export function computeMetrics(trades: Trade[], initialBalance = 0, timezone = "UTC"): PerformanceMetrics {
  const closed = trades.filter((t) => t.status === "closed" && t.netPnl !== null)

  if (closed.length === 0) {
    return emptyMetrics()
  }

  const pnls = closed.map((t) => Number(t.netPnl))
  const wins = pnls.filter((p) => p > 0)
  const losses = pnls.filter((p) => p < 0)

  const grossProfit = wins.reduce((s, v) => s + v, 0)
  const grossLoss = Math.abs(losses.reduce((s, v) => s + v, 0))
  const netPnl = grossProfit - grossLoss

  const winRate = wins.length / closed.length
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0
  const lossRate = 1 - winRate

  const expectancy = winRate * avgWin - lossRate * avgLoss
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

  // Drawdown sur equity curve
  const { maxDrawdown, maxDrawdownPct } = computeDrawdown(closed, initialBalance)

  // R:R moyen (sur trades avec riskAmount)
  const rrTrades = closed.filter((t) => t.riskAmount && Number(t.riskAmount) > 0)
  const avgRR =
    rrTrades.length > 0
      ? rrTrades.reduce((s, t) => s + Number(t.netPnl!) / Number(t.riskAmount!), 0) / rrTrades.length
      : 0

  // Meilleur / pire jour
  const byDay = groupByDay(closed, timezone)
  const days = Object.entries(byDay).map(([date, ts]) => ({
    date,
    pnl: ts.reduce((s, t) => s + Number(t.netPnl), 0),
  }))
  const bestDay = days.length > 0 ? days.reduce((a, b) => (a.pnl > b.pnl ? a : b)) : null
  const worstDay = days.length > 0 ? days.reduce((a, b) => (a.pnl < b.pnl ? a : b)) : null

  // Durée moyenne (minutes)
  const durations = closed
    .filter((t) => t.exitAt)
    .map((t) => (new Date(t.exitAt as Date).getTime() - new Date(t.entryAt).getTime()) / 60000)
  const avgTradeDurationMin = durations.length > 0 ? durations.reduce((s, v) => s + v, 0) / durations.length : 0

  return {
    totalTrades: closed.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate,
    avgWin,
    avgLoss,
    expectancy,
    profitFactor,
    netPnl,
    grossProfit,
    grossLoss,
    maxDrawdown,
    maxDrawdownPct,
    avgRR,
    bestDay,
    worstDay,
    avgTradeDurationMin,
  }
}

// ─── Equity Curve ─────────────────────────────────────────────────────────────
export function computeEquityCurve(trades: Trade[], initialBalance = 0, timezone = "UTC"): EquityPoint[] {
  const closed = trades
    .filter((t) => t.status === "closed" && t.netPnl !== null && t.exitAt)

  // S'il n'y a pas de trades, on retourne juste le solde initial aujourd'hui
  if (closed.length === 0) {
    return [{ date: dayKey(new Date(), timezone), equity: initialBalance, drawdown: 0 }]
  }

  // Grouper par jour
  const byDay = groupByDay(closed, timezone)
  // Trier les jours chronologiquement
  const sortedDates = Object.keys(byDay).sort((a, b) => a.localeCompare(b))

  let equity = initialBalance
  let peak = initialBalance
  const points: EquityPoint[] = []

  // Point de départ (la veille du premier trade)
  const [fy, fm, fd] = sortedDates[0].split("-").map(Number)
  const startDate = new Date(Date.UTC(fy, fm - 1, fd - 1, 0, 0, 0, 0))
  points.push({
    date: dayKey(startDate, "UTC"),
    equity,
    drawdown: 0
  })

  // Ajouter les points pour chaque jour de trading
  for (const date of sortedDates) {
    const dailyTrades = byDay[date]
    const dailyPnl = dailyTrades.reduce((sum, t) => sum + Number(t.netPnl), 0)
    
    equity += dailyPnl
    if (equity > peak) peak = equity
    
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0
    
    points.push({
      date,
      equity: Math.round(equity * 100) / 100,
      drawdown: Math.round(drawdown * 100) / 100,
    })
  }

  return points
}

// ─── P&L par jour (calendrier) ────────────────────────────────────────────────
export function computeDailyPnL(trades: Trade[], timezone = "UTC"): DailyPnL[] {
  const closed = trades.filter((t) => t.status === "closed" && t.netPnl !== null && t.exitAt)
  const byDay = groupByDay(closed, timezone)

  return Object.entries(byDay)
    .map(([date, ts]) => ({
      date,
      pnl: Math.round(ts.reduce((s, t) => s + Number(t.netPnl), 0) * 100) / 100,
      trades: ts.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ─── P&L par setup tag ────────────────────────────────────────────────────────
export function computePnLByTag(trades: Trade[]): { tag: string; pnl: number; count: number; winRate: number }[] {
  const closed = trades.filter((t) => t.status === "closed" && t.netPnl !== null)
  const tagMap: Record<string, { pnl: number; count: number; wins: number }> = {}

  for (const trade of closed) {
    const tags = trade.setupTags.length > 0 ? trade.setupTags : ["Untagged"]
    for (const tag of tags) {
      if (!tagMap[tag]) tagMap[tag] = { pnl: 0, count: 0, wins: 0 }
      tagMap[tag].pnl += Number(trade.netPnl)
      tagMap[tag].count++
      if (Number(trade.netPnl) > 0) tagMap[tag].wins++
    }
  }

  return Object.entries(tagMap)
    .map(([tag, { pnl, count, wins }]) => ({
      tag,
      pnl: Math.round(pnl * 100) / 100,
      count,
      winRate: count > 0 ? wins / count : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl)
}

// ─── Heatmap par heure ────────────────────────────────────────────────────────
export function computeHourlyPnL(trades: Trade[], timezone = "UTC"): { hour: number; pnl: number; count: number }[] {
  const closed = trades.filter((t) => t.status === "closed" && t.netPnl !== null)
  const hourMap: Record<number, { pnl: number; count: number }> = {}

  for (let h = 0; h < 24; h++) hourMap[h] = { pnl: 0, count: 0 }

  for (const trade of closed) {
    const hour = hourOfDay(trade.entryAt, timezone)
    hourMap[hour].pnl += Number(trade.netPnl)
    hourMap[hour].count++
  }

  return Object.entries(hourMap).map(([hour, { pnl, count }]) => ({
    hour: Number(hour),
    pnl: Math.round(pnl * 100) / 100,
    count,
  }))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupByDay(trades: Trade[], timezone = "UTC"): Record<string, Trade[]> {
  return trades.reduce((acc, trade) => {
    const key = dayKey(trade.exitAt ?? trade.entryAt, timezone)
    if (!acc[key]) acc[key] = []
    acc[key].push(trade)
    return acc
  }, {} as Record<string, Trade[]>)
}

function computeDrawdown(trades: Trade[], initialBalance: number): { maxDrawdown: number; maxDrawdownPct: number } {
  let equity = initialBalance
  let peak = initialBalance
  let maxDrawdown = 0
  let maxDrawdownPct = 0

  const sorted = [...trades].filter(t => t.exitAt).sort((a, b) => new Date(a.exitAt as Date).getTime() - new Date(b.exitAt as Date).getTime())

  for (const trade of sorted) {
    equity += Number(trade.netPnl)
    if (equity > peak) peak = equity
    const dd = peak - equity
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0
    if (dd > maxDrawdown) maxDrawdown = dd
    if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct
  }

  return {
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
  }
}

function emptyMetrics(): PerformanceMetrics {
  return {
    totalTrades: 0, winningTrades: 0, losingTrades: 0,
    winRate: 0, avgWin: 0, avgLoss: 0, expectancy: 0,
    profitFactor: 0, netPnl: 0, grossProfit: 0, grossLoss: 0,
    maxDrawdown: 0, maxDrawdownPct: 0, avgRR: 0,
    bestDay: null, worstDay: null, avgTradeDurationMin: 0,
  }
}
