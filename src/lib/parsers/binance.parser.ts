// lib/parsers/binance.parser.ts
// Binance Spot/Futures — Trade History CSV parser

import type { ParsedTrade } from "./ib.parser"
import type { ParseResult } from "./index"

export function binanceParser(csvText: string): ParseResult {
  const errors: { row: number; message: string }[] = []
  const trades: ParsedTrade[] = []

  const lines = csvText.trim().split("\n").filter(Boolean)
  if (lines.length < 2) {
    return { broker: "binance", trades: [], errors: [{ row: 0, message: "Empty file" }], totalRows: 0 }
  }

  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
  const col = (name: string) => headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))

  // Binance format: Date(UTC), Pair, Side, Order Price, Order Amount, Filled, Total, Fee, status
  const idxDate   = col("Date")
  const idxPair   = col("Pair")
  const idxSide   = col("Side")
  const idxPrice  = col("Price") !== -1 ? col("Price") : col("Order Price")
  const idxFilled = col("Filled")
  const idxFee    = col("Fee")
  const idxStatus = col("Status")
  const idxOrderId = col("Order ID")

  let totalRows = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim())
    totalRows++

    try {
      // Skip cancelled orders
      if (idxStatus !== -1 && cols[idxStatus]?.toLowerCase() === "cancelled") continue

      const dateStr  = cols[idxDate]
      const pair     = cols[idxPair]
      const sideStr  = cols[idxSide]?.toLowerCase()
      const priceStr = cols[idxPrice]
      const filledStr = cols[idxFilled]
      const feeStr   = cols[idxFee] ?? "0"

      if (!dateStr || !pair || !sideStr || !priceStr || !filledStr) {
        errors.push({ row: i + 1, message: `Missing required fields on row ${i + 1}` })
        continue
      }

      const price  = parseFloat(priceStr)
      const filled = parseFloat(filledStr)
      const fee    = Math.abs(parseBinanceFee(feeStr))

      if (isNaN(price) || isNaN(filled) || price <= 0) {
        errors.push({ row: i + 1, message: `Invalid price/quantity on row ${i + 1}` })
        continue
      }

      const entryAt = new Date(dateStr)
      if (isNaN(entryAt.getTime())) {
        errors.push({ row: i + 1, message: `Invalid date on row ${i + 1}: ${dateStr}` })
        continue
      }

      // Binance pair: BTCUSDT → symbol = BTC/USDT
      const symbol = formatBinancePair(pair)
      const side: "long" | "short" = sideStr === "buy" ? "long" : "short"

      trades.push({
        externalId: idxOrderId !== -1 ? cols[idxOrderId] : undefined,
        symbol,
        instrumentType: "crypto",
        side,
        quantity: filled,
        entryPrice: price,
        entryAt,
        fees: fee,
        session: "ny_open", // Binance 24/7 — pas de session
        importSource: "csv",
      })
    } catch (err) {
      errors.push({ row: i + 1, message: `Parse error on row ${i + 1}: ${String(err)}` })
    }
  }

  return { broker: "binance", trades, errors, totalRows }
}

function parseBinanceFee(feeStr: string): number {
  // Format: "0.00042 BNB" ou "0.00042"
  const match = feeStr.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

function formatBinancePair(pair: string): string {
  // BTCUSDT → BTC/USDT, ETHBTC → ETH/BTC
  const quoteCurrencies = ["USDT", "BUSD", "BTC", "ETH", "BNB", "USD"]
  for (const quote of quoteCurrencies) {
    if (pair.endsWith(quote)) {
      const base = pair.slice(0, -quote.length)
      return `${base}/${quote}`
    }
  }
  return pair
}
