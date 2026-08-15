import { describe, it, expect } from "vitest"
import { analyzeBehavior, flagTradesForImport } from "./behavioral"
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
    netPnl: 100,
    netPnlUsd: 100,
    stopLoss: 1.095,
    riskAmount: 50,
    session: "ny_open",
    setupTags: [],
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

describe("analyzeBehavior", () => {
  it("returns perfect score for empty trades", () => {
    const result = analyzeBehavior([])
    expect(result.disciplineScore).toBe(100)
    expect(result.patterns).toHaveLength(0)
  })

  it("detects revenge trading", () => {
    const trades = [
      makeTrade({
        id: "t1",
        netPnl: -100,
        exitAt: new Date("2024-01-15T10:00:00Z"),
        entryAt: new Date("2024-01-15T09:00:00Z"),
      }),
      makeTrade({
        id: "t2",
        netPnl: -50,
        entryAt: new Date("2024-01-15T10:05:00Z"),
        exitAt: new Date("2024-01-15T10:30:00Z"),
      }),
    ]
    const result = analyzeBehavior(trades)
    const revenge = result.patterns.find(p => p.type === "revenge_trading")
    expect(revenge).toBeDefined()
    expect(revenge?.count).toBe(1)
    expect(revenge?.affectedTradeIds).toContain("t2")
  })

  it("does not flag revenge when gap > 15 minutes", () => {
    const trades = [
      makeTrade({
        id: "t1",
        netPnl: -100,
        exitAt: new Date("2024-01-15T10:00:00Z"),
        entryAt: new Date("2024-01-15T09:00:00Z"),
      }),
      makeTrade({
        id: "t2",
        netPnl: 50,
        entryAt: new Date("2024-01-15T10:30:00Z"),
        exitAt: new Date("2024-01-15T11:00:00Z"),
      }),
    ]
    const result = analyzeBehavior(trades)
    const revenge = result.patterns.find(p => p.type === "revenge_trading")
    expect(revenge).toBeUndefined()
  })

  it("detects stop violations", () => {
    const trades = [
      makeTrade({
        id: "t1",
        entryPrice: 1.1,
        stopLoss: 1.095,
        quantity: 1,
        netPnl: -100,
        exitPrice: 1.0,
      }),
    ]
    const result = analyzeBehavior(trades)
    const stopViolation = result.patterns.find(p => p.type === "stop_violation")
    expect(stopViolation).toBeDefined()
    expect(stopViolation?.affectedTradeIds).toContain("t1")
  })

  it("computes emotion costs", () => {
    const trades = [
      makeTrade({ netPnl: -100, emotionTags: ["fear"] }),
      makeTrade({ netPnl: -50, emotionTags: ["fear"] }),
      makeTrade({ netPnl: -200, emotionTags: ["greed"] }),
    ]
    const result = analyzeBehavior(trades)
    expect(result.emotionCosts).toHaveLength(2)
    expect(result.emotionCosts[0].tag).toBe("greed")
    expect(result.emotionCosts[0].totalLoss).toBe(200)
  })

  it("computes setup performance", () => {
    const trades = [
      makeTrade({ netPnl: 100, setupTags: ["breakout"] }),
      makeTrade({ netPnl: -50, setupTags: ["breakout"] }),
      makeTrade({ netPnl: 200, setupTags: ["scalp"] }),
    ]
    const result = analyzeBehavior(trades)
    expect(result.setupPerformance).toHaveLength(2)
    expect(result.setupPerformance[0].tag).toBe("scalp")
  })
})

describe("flagTradesForImport", () => {
  it("flags revenge trades correctly", () => {
    const trades = [
      { id: "t1", entryAt: new Date("2024-01-15T10:00:00Z"), exitAt: new Date("2024-01-15T10:10:00Z"), netPnl: -100, stopLoss: null, entryPrice: 1.1, exitPrice: 1.09, quantity: 1, status: "closed" as const },
      { id: "t2", entryAt: new Date("2024-01-15T10:12:00Z"), exitAt: new Date("2024-01-15T10:20:00Z"), netPnl: -50, stopLoss: null, entryPrice: 1.1, exitPrice: 1.095, quantity: 1, status: "closed" as const },
    ]
    const flags = flagTradesForImport(trades)
    expect(flags.get("t2")?.isRevengeTrade).toBe(true)
  })

  it("flags stop violations correctly", () => {
    const trades = [
      { id: "t1", entryAt: new Date("2024-01-15T10:00:00Z"), exitAt: new Date("2024-01-15T10:10:00Z"), netPnl: -100, stopLoss: 1.095, entryPrice: 1.1, exitPrice: 1.0, quantity: 1, status: "closed" as const },
    ]
    const flags = flagTradesForImport(trades)
    expect(flags.get("t1")?.isStopViolated).toBe(true)
  })
})
