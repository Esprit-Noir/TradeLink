// lib/parsers/metatrader.parser.ts
// MetaTrader 4 & 5 (MT4/MT5) statement CSV parser
// Supports standard column names from MT4/MT5 exported reports (Ticket, Open Time, Type, Size, Item, Profit, etc.)

import type { ParseResult, ParsedTrade } from "./index"
import { classifySymbol } from "@/lib/market/symbols"

function parseRow(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      out.push(cur.trim())
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur.trim())
  return out
}

function parseNumber(value: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  const cleaned = value.replace(/[$,\s]/g, "")
  const n = parseFloat(cleaned)
  return isNaN(n) ? undefined : n
}

function parseDate(value: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  if (!isNaN(d.getTime())) return d

  // Handle format: DD.MM.YYYY HH:MM:SS
  const m = value.match(/^(\d{2})[.\-\/](\d{2})[.\-\/](\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/)
  if (m) {
    const [, dd, mm, yyyy, hr, min, sec] = m
    const dt = new Date(
      parseInt(yyyy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      hr ? parseInt(hr, 10) : 0,
      min ? parseInt(min, 10) : 0,
      sec ? parseInt(sec, 10) : 0
    )
    return isNaN(dt.getTime()) ? null : dt
  }
  return null
}

export function metatraderParser(csvText: string): ParseResult {
  const errors: { row: number; message: string }[] = []
  const trades: ParsedTrade[] = []

  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) {
    return {
      broker: "generic",
      trades: [],
      errors: [{ row: 0, message: "File is empty or has no data rows." }],
      totalRows: 0,
    }
  }

  // Find header row (usually contains Ticket, Type, Size, Item/Symbol, Profit, etc.)
  let headerIndex = -1
  let headers: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const row = parseRow(lines[i])
    const rowJoined = row.join(" ").toLowerCase()
    if (rowJoined.includes("ticket") && (rowJoined.includes("open time") || rowJoined.includes("close time"))) {
      headers = row
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    // Fallback: try first line as headers
    headers = parseRow(lines[0])
    headerIndex = 0
  }

  const colIdx = (keywords: string[]) => {
    return headers.findIndex((h) => {
      const val = h.toLowerCase().trim()
      return keywords.some((k) => val === k || val.includes(k))
    })
  }

  const idxTicket = colIdx(["ticket", "position id", "deal id", "order"])
  const idxOpenTime = colIdx(["open time", "time open", "open_time"])
  const idxCloseTime = colIdx(["close time", "time close", "close_time", "exit time", "exit_time"])
  const idxType = colIdx(["type", "action", "direction", "side"])
  const idxSize = colIdx(["size", "volume", "lots", "quantity", "qty"])
  const idxItem = colIdx(["item", "symbol", "instrument", "pair"])
  const idxOpenPrice = colIdx(["open price", "price open", "entry price", "open_price"])
  const idxClosePrice = colIdx(["close price", "price close", "exit price", "close_price"])
  const idxCommission = colIdx(["commission", "commissions", "comm"])
  const idxTaxes = colIdx(["taxes", "tax"])
  const idxSwap = colIdx(["swap", "rollover"])
  const idxProfit = colIdx(["profit", "pnl", "gain", "amount"])

  // Let's handle duplicate "Price" headers (MT4 exports often list "Price" twice: once for open, once for close)
  let openPriceIndex = idxOpenPrice
  let closePriceIndex = idxClosePrice
  if (openPriceIndex === -1 || closePriceIndex === -1) {
    const priceIndices: number[] = []
    headers.forEach((h, idx) => {
      if (h.toLowerCase().trim() === "price" || h.toLowerCase().trim() === "prix") {
        priceIndices.push(idx)
      }
    })
    if (priceIndices.length >= 2) {
      openPriceIndex = priceIndices[0]
      closePriceIndex = priceIndices[1]
    } else if (priceIndices.length === 1) {
      openPriceIndex = priceIndices[0]
      closePriceIndex = priceIndices[0]
    }
  }

  if (idxItem === -1 || idxType === -1 || (idxOpenTime === -1 && idxCloseTime === -1)) {
    return {
      broker: "generic",
      trades: [],
      errors: [{ row: 0, message: `Missing required columns. Found headers: ${headers.join(", ")}` }],
      totalRows: 0,
    }
  }

  let totalRows = 0

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("#")) continue

    const cols = parseRow(line)
    totalRows++

    try {
      const typeVal = cols[idxType]?.toLowerCase() ?? ""
      // Skip balance modifications, deposits, withdrawals, cancellations
      if (
        typeVal.includes("deposit") ||
        typeVal.includes("withdrawal") ||
        typeVal.includes("balance") ||
        typeVal.includes("credit") ||
        typeVal.includes("limit") ||
        typeVal.includes("stop")
      ) {
        continue
      }

      const symbol = cols[idxItem]?.trim().toUpperCase().replace(".PRO", "").replace("+", "")
      const side = typeVal.includes("buy") || typeVal.includes("long") ? "LONG" : "SHORT"
      
      const openTimeStr = idxOpenTime >= 0 ? cols[idxOpenTime]?.trim() : ""
      const closeTimeStr = idxCloseTime >= 0 ? cols[idxCloseTime]?.trim() : ""

      const entryAt = parseDate(openTimeStr || closeTimeStr)
      const exitAt = parseDate(closeTimeStr)

      const qty = parseNumber(cols[idxSize]) ?? 1
      const entryPrice = openPriceIndex >= 0 ? parseNumber(cols[openPriceIndex]) : undefined
      const exitPrice = closePriceIndex >= 0 ? parseNumber(cols[closePriceIndex]) : undefined

      const commission = idxCommission >= 0 ? parseNumber(cols[idxCommission]) ?? 0 : 0
      const taxes = idxTaxes >= 0 ? parseNumber(cols[idxTaxes]) ?? 0 : 0
      const swap = idxSwap >= 0 ? parseNumber(cols[idxSwap]) ?? 0 : 0
      const profit = idxProfit >= 0 ? parseNumber(cols[idxProfit]) ?? 0 : 0

      if (!symbol || !entryAt) {
        errors.push({ row: i + 1, message: `Row ${i + 1}: Missing symbol or date.` })
        continue
      }

      const fees = Math.abs(commission) + Math.abs(taxes) + Math.abs(swap)
      // MT4 profit is net (without commission/swap), so netPnl is profit + commission + taxes + swap
      const netPnl = profit + commission + taxes + swap

      trades.push({
        externalId: idxTicket >= 0 ? cols[idxTicket]?.trim() : undefined,
        symbol,
        side,
        quantity: qty,
        entryPrice,
        exitPrice,
        entryAt,
        exitAt: exitAt || undefined,
        fees,
        netPnl,
        status: exitAt ? "closed" : "open",
        instrumentType: classifySymbol(symbol),
        importSource: "csv",
      })
    } catch (err: any) {
      errors.push({ row: i + 1, message: `Row ${i + 1}: ${err.message}` })
    }
  }

  return {
    broker: "generic", // maps to generic or unknown for auto-detect mapping
    trades,
    errors,
    totalRows,
  }
}
