import { describe, it, expect } from "vitest"
import { binanceParser } from "./binance.parser"
import { ibParser } from "./ib.parser"

describe("binanceParser", () => {
  it("returns error for empty CSV", () => {
    const result = binanceParser("")
    expect(result.errors).toHaveLength(1)
    expect(result.trades).toHaveLength(0)
  })

  it("parses valid Binance CSV", () => {
    const csv = `Date(UTC),Pair,Side,Order Price,Order Amount,Filled,Total,Fee,Status
2024-01-15 10:00:00,BTCUSDT,Buy,42000,0.1,0.1,4200,0.00042 BNB,Filled
2024-01-15 12:00:00,BTCUSDT,Sell,43000,0.1,0.1,4300,0.00043 BNB,Filled`
    const result = binanceParser(csv)
    expect(result.trades).toHaveLength(2)
    expect(result.trades[0].symbol).toBe("BTC/USDT")
    expect(result.trades[0].side).toBe("long")
    expect(result.trades[1].side).toBe("short")
  })

  it("skips cancelled orders", () => {
    const csv = `Date(UTC),Pair,Side,Order Price,Order Amount,Filled,Total,Fee,Status
2024-01-15 10:00:00,BTCUSDT,Buy,42000,0.1,0.1,4200,0.00042 BNB,Cancelled
2024-01-15 12:00:00,BTCUSDT,Sell,43000,0.1,0.1,4300,0.00043 BNB,Filled`
    const result = binanceParser(csv)
    expect(result.trades).toHaveLength(1)
  })

  it("handles ETHBTC pair", () => {
    const csv = `Date(UTC),Pair,Side,Order Price,Order Amount,Filled,Total,Fee,Status
2024-01-15 10:00:00,ETHBTC,Buy,0.05,10,10,0.5,0.001 BNB,Filled`
    const result = binanceParser(csv)
    expect(result.trades[0].symbol).toBe("ETH/BTC")
  })
})

describe("ibParser", () => {
  it("returns empty for empty CSV", () => {
    const result = ibParser("")
    expect(result.trades).toHaveLength(0)
  })

  it("returns error for invalid CSV", () => {
    const result = ibParser("not,a,valid,statement")
    expect(result.trades.length).toBe(0)
  })

  it("parses a basic IB trades CSV", () => {
    const csv = `Symbol,Date/Time,Quantity,T. Price,Comm/Fee,Realized P&L
AAPL,2024-01-15 09:30:00,100,185.50,-1.00,50.00`
    const result = ibParser(csv)
    expect(result.trades.length).toBeGreaterThanOrEqual(1)
    expect(result.trades[0].side).toBe("long")
    expect(result.trades[0].quantity).toBe(100)
  })
})
