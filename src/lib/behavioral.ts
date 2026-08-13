// lib/behavioral.ts
// Détection de patterns comportementaux — moteur de scoring discipline

import type { Trade } from "@prisma/client"

export type PatternType = "revenge_trading" | "overtrading" | "stop_violation" | "session_breach"

export interface DetectedPattern {
  type: PatternType
  label: string
  description: string
  count: number
  affectedTradeIds: string[]
  impactPnl: number        // somme des P&L des trades affectés
  severity: "low" | "medium" | "high"
}

export interface EmotionCost {
  tag: string
  count: number
  totalLoss: number
}

export interface SetupPerformance {
  tag: string
  count: number
  winRate: number
  netPnl: number
}

export interface BehavioralResult {
  disciplineScore: number  // 0–100
  patterns: DetectedPattern[]
  period: { start: Date; end: Date }
  summary: string
  emotionCosts: EmotionCost[]
  setupPerformance: SetupPerformance[]
}

// ─── Config paramétrable ─────────────────────────────────────────────────────
const CONFIG = {
  // Revenge trading : trade ouvert dans les N minutes après une perte
  revengeWindowMinutes: 15,
  // Overtrading : jours avec > X fois la médiane de trades/jour
  overtradingMultiplier: 2.0,
  // Stop violation : perte réelle > stop_loss × X
  stopViolationMultiplier: 1.3,
  // Score penalties
  penalties: {
    revenge_trading: 15,   // par occurrence
    overtrading: 8,        // par jour
    stop_violation: 20,    // par occurrence
    session_breach: 5,     // par occurrence
  },
}

// ─── Point d'entrée principal ─────────────────────────────────────────────────
export function analyzeBehavior(trades: Trade[]): BehavioralResult {
  if (trades.length === 0) {
    return { 
      disciplineScore: 100, 
      patterns: [], 
      period: { start: new Date(), end: new Date() }, 
      summary: "No trades to analyze.",
      emotionCosts: [],
      setupPerformance: []
    }
  }

  const sorted = [...trades].sort((a, b) => new Date(a.entryAt).getTime() - new Date(b.entryAt).getTime())
  const period = {
    start: new Date(sorted[0].entryAt),
    end: new Date(sorted[sorted.length - 1].entryAt),
  }

  const patterns: DetectedPattern[] = [
    detectRevengeTrades(sorted),
    detectOvertrading(sorted),
    detectStopViolations(sorted),
  ].filter((p): p is DetectedPattern => p !== null)

  const disciplineScore = computeScore(patterns)

  // Compute advanced metrics
  const emotionCosts = computeEmotionCosts(sorted)
  const setupPerformance = computeSetupPerformance(sorted)

  return {
    disciplineScore,
    patterns,
    period,
    summary: buildSummary(disciplineScore, patterns),
    emotionCosts,
    setupPerformance
  }
}

function computeEmotionCosts(trades: Trade[]): EmotionCost[] {
  const costs: Record<string, { count: number; totalLoss: number }> = {}

  for (const trade of trades) {
    if (Number(trade.netPnl) >= 0) continue // Only look at losing trades for "cost"
    if (!trade.emotionTags || !Array.isArray(trade.emotionTags)) continue
    
    // Some brokers/manual entry might save it as array of strings
    const tags = trade.emotionTags as string[]
    for (const tag of tags) {
      if (!costs[tag]) costs[tag] = { count: 0, totalLoss: 0 }
      costs[tag].count += 1
      costs[tag].totalLoss += Math.abs(Number(trade.netPnl))
    }
  }

  return Object.entries(costs)
    .map(([tag, data]) => ({ tag, ...data }))
    .sort((a, b) => b.totalLoss - a.totalLoss) // Sort by biggest loss
}

function computeSetupPerformance(trades: Trade[]): SetupPerformance[] {
  const perf: Record<string, { count: number; wins: number; netPnl: number }> = {}

  for (const trade of trades) {
    if (!trade.setupTags || !Array.isArray(trade.setupTags)) continue
    
    const tags = trade.setupTags as string[]
    const pnl = Number(trade.netPnl) || 0
    const isWin = pnl > 0

    for (const tag of tags) {
      if (!perf[tag]) perf[tag] = { count: 0, wins: 0, netPnl: 0 }
      perf[tag].count += 1
      if (isWin) perf[tag].wins += 1
      perf[tag].netPnl += pnl
    }
  }

  return Object.entries(perf)
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100),
      netPnl: Math.round(data.netPnl * 100) / 100
    }))
    .sort((a, b) => b.netPnl - a.netPnl) // Sort by best PnL
}

// ─── Revenge Trading ─────────────────────────────────────────────────────────
// Définition : trade ouvert dans les X minutes suivant la clôture d'un trade perdant
function detectRevengeTrades(trades: Trade[]): DetectedPattern | null {
  const closed = trades.filter((t) => t.status === "closed" && t.netPnl !== null && t.exitAt)
  const affectedIds: string[] = []
  let impactPnl = 0

  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1]
    const curr = closed[i]

    const prevPnl = Number(prev.netPnl)
    if (prevPnl >= 0) continue // le trade précédent n'est pas une perte

    const gap = (new Date(curr.entryAt).getTime() - new Date(prev.exitAt!).getTime()) / 60000
    if (gap >= 0 && gap <= CONFIG.revengeWindowMinutes) {
      affectedIds.push(curr.id)
      impactPnl += Number(curr.netPnl ?? 0)
    }
  }

  if (affectedIds.length === 0) return null

  const severity = affectedIds.length >= 5 ? "high" : affectedIds.length >= 2 ? "medium" : "low"

  return {
    type: "revenge_trading",
    label: "Revenge Trading",
    description: `You opened ${affectedIds.length} trade(s) within ${CONFIG.revengeWindowMinutes} minutes of a losing trade.`,
    count: affectedIds.length,
    affectedTradeIds: affectedIds,
    impactPnl: Math.round(impactPnl * 100) / 100,
    severity,
  }
}

// ─── Sur-trading ─────────────────────────────────────────────────────────────
// Définition : jours avec > 2× la médiane de trades/jour
function detectOvertrading(trades: Trade[]): DetectedPattern | null {
  // Grouper par jour
  const byDay: Record<string, Trade[]> = {}
  for (const t of trades) {
    const day = new Date(t.entryAt).toISOString().split("T")[0]
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(t)
  }

  const counts = Object.values(byDay).map((ts) => ts.length)
  const median = computeMedian(counts)
  const threshold = Math.max(2, median * CONFIG.overtradingMultiplier)

  const overtradingDays = Object.entries(byDay).filter(([, ts]) => ts.length > threshold)
  if (overtradingDays.length === 0) return null

  const affectedIds = overtradingDays.flatMap(([, ts]) => ts.map((t) => t.id))
  const impactPnl = overtradingDays
    .flatMap(([, ts]) => ts)
    .reduce((s, t) => s + Number(t.netPnl ?? 0), 0)

  const severity = overtradingDays.length >= 5 ? "high" : overtradingDays.length >= 2 ? "medium" : "low"

  return {
    type: "overtrading",
    label: "Overtrading",
    description: `On ${overtradingDays.length} day(s) you traded more than ${Math.round(threshold)} times (${Math.round(CONFIG.overtradingMultiplier)}× your average of ${Math.round(median)} trades/day).`,
    count: overtradingDays.length,
    affectedTradeIds: affectedIds,
    impactPnl: Math.round(impactPnl * 100) / 100,
    severity,
  }
}

// ─── Stop Loss Violations ────────────────────────────────────────────────────
// Définition : perte réelle > stop_loss × multiplicateur (stop non respecté)
function detectStopViolations(trades: Trade[]): DetectedPattern | null {
  const affectedIds: string[] = []
  let impactPnl = 0

  for (const trade of trades) {
    if (!trade.stopLoss || !trade.exitPrice || !trade.netPnl) continue

    const stopLossDistance = Math.abs(Number(trade.entryPrice) - Number(trade.stopLoss))
    const actualLoss = Math.abs(Number(trade.netPnl))

    // Si la perte en $ dépasse ce qu'un stop respecté aurait donné
    if (Number(trade.netPnl) < 0) {
      const expectedMaxLoss = stopLossDistance * Number(trade.quantity) * CONFIG.stopViolationMultiplier
      if (actualLoss > expectedMaxLoss) {
        affectedIds.push(trade.id)
        impactPnl += Number(trade.netPnl)
      }
    }
  }

  if (affectedIds.length === 0) return null

  const severity = affectedIds.length >= 3 ? "high" : affectedIds.length >= 1 ? "medium" : "low"

  return {
    type: "stop_violation",
    label: "Stop Loss Not Respected",
    description: `On ${affectedIds.length} trade(s), your actual loss exceeded your stop loss by more than ${Math.round((CONFIG.stopViolationMultiplier - 1) * 100)}%.`,
    count: affectedIds.length,
    affectedTradeIds: affectedIds,
    impactPnl: Math.round(impactPnl * 100) / 100,
    severity,
  }
}

// ─── Score de discipline ─────────────────────────────────────────────────────
function computeScore(patterns: DetectedPattern[]): number {
  let score = 100

  for (const pattern of patterns) {
    const penalty = CONFIG.penalties[pattern.type] ?? 10
    score -= penalty * Math.min(pattern.count, 5) // cap à 5 occurrences max de pénalité
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

// ─── Résumé textuel ───────────────────────────────────────────────────────────
function buildSummary(score: number, patterns: DetectedPattern[]): string {
  if (score >= 85) return "Excellent discipline. Your trading is consistent and rule-based."
  if (score >= 70) return "Good discipline with minor areas to improve."
  if (score >= 50) return `${patterns.length} behavioral pattern(s) detected that are costing you money.`
  return `Critical discipline issues detected. Addressing these patterns should be your top priority.`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeMedian(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

// ─── Flag individual trades (utilisé lors de l'import) ───────────────────────
export function flagTradesForImport(trades: Pick<Trade, "id" | "entryAt" | "exitAt" | "netPnl" | "stopLoss" | "entryPrice" | "exitPrice" | "quantity" | "status">[]): Map<string, { isRevengeTrade: boolean; isStopViolated: boolean }> {
  const flags = new Map<string, { isRevengeTrade: boolean; isStopViolated: boolean }>()
  const sorted = [...trades].sort((a, b) => new Date(a.entryAt).getTime() - new Date(b.entryAt).getTime())

  for (let i = 0; i < sorted.length; i++) {
    const trade = sorted[i]
    let isRevengeTrade = false
    let isStopViolated = false

    // Revenge check
    if (i > 0) {
      const prev = sorted[i - 1]
      if (prev.exitAt && Number(prev.netPnl) < 0) {
        const gap = (new Date(trade.entryAt).getTime() - new Date(prev.exitAt).getTime()) / 60000
        if (gap >= 0 && gap <= CONFIG.revengeWindowMinutes) isRevengeTrade = true
      }
    }

    // Stop violation check
    if (trade.stopLoss && trade.netPnl && Number(trade.netPnl) < 0) {
      const stopDist = Math.abs(Number(trade.entryPrice) - Number(trade.stopLoss))
      const actualLoss = Math.abs(Number(trade.netPnl))
      const expectedMax = stopDist * Number(trade.quantity) * CONFIG.stopViolationMultiplier
      if (actualLoss > expectedMax) isStopViolated = true
    }

    flags.set(trade.id, { isRevengeTrade, isStopViolated })
  }

  return flags
}
