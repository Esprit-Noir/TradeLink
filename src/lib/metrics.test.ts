import { describe, it, expect } from "vitest"
import { computeMetrics, computeEquityCurve, computeDailyPnL, computePnLByTag, computeHourlyPnL } from "./metrics"
import type { Trade } from "@prisma/client"

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: crypto.randomUUID(),
    userId: "u1",
    accountId: "a1",
    externalId: null,
    symbol: "EUR/USD",
    instrumentType: "forex",
    side: "long",
    quantity: 1,
    entryPrice: 1.1,
    exitPrice: 1.11,
    entryAt: new Date("2024-01-15T10:00:00Z"),
    exitAt: new Date("2024-01-15T12:00:00Z"),
    grossPnl: 100,
    fees: 2,
    netPnl: 98,
    netPnlUsd: 98,
    stopLoss: 1.095,
    riskAmount: 50,
    session: "ny_open",
    setupTags: ["breakout"],
    emotionTags: [],
    notesPost: null,
    personalRating: null,
    isRevengeTrade: false,
    isOvertrading: false,
    isStopViolated: false,
    status: "closed",
    importSource: "manual",
    source: "live",
    createdAt: new Date(),
    updatedAt: new Date(),
    backtestSessionId: null,
    ...overrides,
  } as Trade
}

describe("computeMetrics", () => {
  it("returns empty metrics for no trades", () => {
    const result = computeMetrics([])
    expect(result.totalTrades).toBe(0)
    expect(result.netPnl).toBe(0)
    expect(result.winRate).toBe(0)
  })

  it("computes basic metrics correctly", () => {
    const trades = [
      makeTrade({ netPnl: 100, status: "closed" }),
      makeTrade({ netPnl: -50, status: "closed" }),
      makeTrade({ netPnl: 200, status: "closed" }),
    ]
    const result = computeMetrics(trades)
    expect(result.totalTrades).toBe(3)
    expect(result.winningTrades).toBe(2)
    expect(result.losingTrades).toBe(1)
    expect(result.netPnl).toBe(250)
    expect(result.winRate).toBeCloseTo(2 / 3)
  })

  it("computes drawdown correctly", () => {
    const trades = [
      makeTrade({ netPnl: 100, entryAt: new Date("2024-01-01"), exitAt: new Date("2024-01-01") }),
      makeTrade({ netPnl: -150, entryAt: new Date("2024-01-02"), exitAt: new Date("2024-01-02") }),
      makeTrade({ netPnl: 200, entryAt: new Date("2024-01-03"), exitAt: new Date("2024-01-03") }),
    ]
    const result = computeMetrics(trades, 1000)
    expect(result.maxDrawdown).toBe(150)
  })

  it("computes avgRR when riskAmount is provided", () => {
    const trades = [
      makeTrade({ netPnl: 100, riskAmount: 50 }),
      makeTrade({ netPnl: -50, riskAmount: 50 }),
    ]
    const result = computeMetrics(trades)
    expect(result.avgRR).toBeCloseTo(0.5)
  })

  it("filters out open trades", () => {
    const trades = [
      makeTrade({ netPnl: 100, status: "closed" }),
      makeTrade({ netPnl: null, status: "open" }),
    ]
    const result = computeMetrics(trades)
    expect(result.totalTrades).toBe(1)
  })
})

describe("computeEquityCurve", () => {
  it("returns initial balance point when no trades", () => {
    const result = computeEquityCurve([], 10000)
    expect(result).toHaveLength(1)
    expect(result[0].equity).toBe(10000)
  })

  it("computes equity curve correctly", () => {
    const trades = [
      makeTrade({ netPnl: 100, entryAt: new Date("2024-01-01"), exitAt: new Date("2024-01-01") }),
      makeTrade({ netPnl: -50, entryAt: new Date("2024-01-02"), exitAt: new Date("2024-01-02") }),
    ]
    const result = computeEquityCurve(trades, 10000)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[result.length - 1].equity).toBe(10050)
  })
})

describe("computeDailyPnL", () => {
  it("groups trades by day", () => {
    const trades = [
      makeTrade({ netPnl: 100, entryAt: new Date("2024-01-01T10:00:00Z"), exitAt: new Date("2024-01-01T12:00:00Z") }),
      makeTrade({ netPnl: 50, entryAt: new Date("2024-01-01T14:00:00Z"), exitAt: new Date("2024-01-01T16:00:00Z") }),
    ]
    const result = computeDailyPnL(trades)
    expect(result).toHaveLength(1)
    expect(result[0].pnl).toBe(150)
    expect(result[0].trades).toBe(2)
  })
})

describe("computePnLByTag", () => {
  it("groups trades by setup tag", () => {
    const trades = [
      makeTrade({ netPnl: 100, setupTags: ["breakout"] }),
      makeTrade({ netPnl: -50, setupTags: ["breakout"] }),
      makeTrade({ netPnl: 200, setupTags: ["scalp"] }),
    ]
    const result = computePnLByTag(trades)
    expect(result).toHaveLength(2)
    expect(result[0].tag).toBe("scalp")
    expect(result[1].tag).toBe("breakout")
  })

  it("handles untagged trades", () => {
    const trades = [
      makeTrade({ netPnl: 100, setupTags: [] }),
    ]
    const result = computePnLByTag(trades)
    expect(result).toHaveLength(1)
    expect(result[0].tag).toBe("Untagged")
  })
})

describe("computeHourlyPnL", () => {
  it("computes P&L by hour", () => {
    const trades = [
      makeTrade({ netPnl: 100, entryAt: new Date("2024-01-15T10:30:00Z") }),
      makeTrade({ netPnl: -50, entryAt: new Date("2024-01-15T10:45:00Z") }),
    ]
    const result = computeHourlyPnL(trades, "UTC")
    expect(result).toHaveLength(24)
    const hour10 = result.find(h => h.hour === 10)
    expect(hour10?.pnl).toBe(50)
    expect(hour10?.count).toBe(2)
  })
})
