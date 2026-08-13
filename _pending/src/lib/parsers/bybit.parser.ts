// lib/parsers/bybit.parser.ts
// Bybit — Order History CSV parser (Spot & Derivatives)

import type { ParsedTrade } from "./ib.parser"
import type { ParseResult } from "./index"

export function bybitParser(csvText: string): ParseResult {
  const errors: { row: number; message: string }[] = []
  const trades: ParsedTrade[] = []

  const lines = csvText.trim().split("\n").filter(Boolean)
  if (lines.length < 2) {
    return { broker: "bybit", trades: [], errors: [{ row: 0, message: "Empty file" }], totalRows: 0 }
  }

  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
  const col = (name: string) => headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))

  // Bybit format: Order ID, Order Time, Symbol, Side, Order Type, Order Price, Order Qty,
  //               Order Status, Avg Fill Price, Filled Qty, Trading Fee(Taker)
  const idxOrderId   = col("Order ID")
  const idxTime      = col("Order Time") !== -1 ? col("Order Time") : col("Create Time")
  const idxSymbol    = col("Symbol")
  const idxSide      = col("Side")
  const idxAvgPrice  = col("Avg Fill Price") !== -1 ? col("Avg Fill Price") : col("Order Price")
  const idxFilledQty = col("Filled Qty") !== -1 ? col("Filled Qty") : col("Order Qty")
  const idxFee       = col("Trading Fee") !== -1 ? col("Trading Fee") : col("Fee")
  const idxStatus    = col("Order Status")
  const idxPnl       = col("Closed P&L") !== -1 ? col("Closed P&L") : col("Realized P&L")

  let totalRows = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim())
    totalRows++

    try {
      const status = idxStatus !== -1 ? cols[idxStatus]?.toLowerCase() : "filled"
      if (status !== "filled" && status !== "partially filled") continue

      const timeStr  = cols[idxTime]
      const symbol   = cols[idxSymbol]
      const sideStr  = cols[idxSide]?.toLowerCase()
      const priceStr = cols[idxAvgPrice]
      const qtyStr   = cols[idxFilledQty]
      const feeStr   = cols[idxFee] ?? "0"

      if (!timeStr || !symbol || !sideStr || !priceStr || !qtyStr) {
        errors.push({ row: i + 1, message: `Missing required fields on row ${i + 1}` })
        continue
      }

      const price = parseFloat(priceStr)
      const qty   = parseFloat(qtyStr)
      const fee   = Math.abs(parseFloat(feeStr.replace(",", "") || "0"))
      const pnl   = idxPnl !== -1 && cols[idxPnl] ? parseFloat(cols[idxPnl].replace(",", "")) : undefined

      if (isNaN(price) || isNaN(qty) || price <= 0) {
        errors.push({ row: i + 1, message: `Invalid price/quantity on row ${i + 1}` })
        continue
      }

      const entryAt = parseBybitDate(timeStr)
      if (!entryAt) {
        errors.push({ row: i + 1, message: `Invalid date on row ${i + 1}: ${timeStr}` })
        continue
      }

      // Bybit: Buy = long, Sell = short (pour les positions)
      const side: "long" | "short" = sideStr === "buy" ? "long" : "short"

      // Détecter le type (BTCUSDT perp vs spot)
      const instrumentType = symbol.endsWith("PERP") || symbol.includes("USD:") ? "futures" : "crypto"

      trades.push({
        externalId: idxOrderId !== -1 ? cols[idxOrderId] : undefined,
        symbol: formatBybitSymbol(symbol),
        instrumentType,
        side,
        quantity: qty,
        entryPrice: price,
        entryAt,
        fees: isNaN(fee) ? 0 : fee,
        grossPnl: pnl,
        netPnl: pnl !== undefined ? pnl - (isNaN(fee) ? 0 : fee) : undefined,
        session: "ny_open",
        importSource: "csv",
      })
    } catch (err) {
      errors.push({ row: i + 1, message: `Parse error on row ${i + 1}: ${String(err)}` })
    }
  }

  return { broker: "bybit", trades, errors, totalRows }
}

function parseBybitDate(dateStr: string): Date | null {
  // Formats: "2024-01-15 09:30:00" / "01/15/2024 09:30:00"
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function formatBybitSymbol(symbol: string): string {
  // BTCUSDT → BTC/USDT, BTCUSD-PERP → BTC/USD:PERP
  if (symbol.includes("-")) return symbol // déjà formaté
  const quoteCurrencies = ["USDT", "USDC", "USD", "BTC", "ETH"]
  for (const quote of quoteCurrencies) {
    if (symbol.endsWith(quote)) {
      return `${symbol.slice(0, -quote.length)}/${quote}`
    }
  }
  return symbol
}
