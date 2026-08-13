// lib/parsers/ib.parser.ts
// Interactive Brokers — Activity Statement CSV parser
// Format : Trades section avec colonnes fixes

import type { ParseResult, ParsedTrade } from "./index"

// Colonnes attendues dans l'Activity Statement IB
const REQUIRED_COLS = ["Symbol", "Date/Time", "Quantity", "T. Price", "Comm/Fee", "Realized P&L"]

export interface ParsedTrade {
  externalId?: string
  symbol: string
  instrumentType: string
  side: "long" | "short"
  quantity: number
  entryPrice: number
  exitPrice?: number
  entryAt: Date
  exitAt?: Date
  grossPnl?: number
  fees: number
  netPnl?: number
  session?: string
  importSource: "csv"
}

export function ibParser(csvText: string): ParseResult {
  const errors: { row: number; message: string }[] = []
  const trades: ParsedTrade[] = []

  // IB Activity Statement a plusieurs sections — on cherche la section "Trades"
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean)

  // Trouver l'en-tête de la section Trades
  // Format IB: "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,..."
  let headerIndex = -1
  let headers: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith("Trades,Header,") || line.includes("Date/Time") && line.includes("T. Price")) {
      headers = parseCSVLine(line)
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    // Essai avec format simple (export "Trades" only)
    headers = parseCSVLine(lines[0])
    headerIndex = 0
  }

  // Indices des colonnes clés
  const col = (name: string) => headers.findIndex((h) => h.includes(name))

  const idxSymbol    = col("Symbol")
  const idxDateTime  = col("Date/Time")
  const idxQty       = col("Quantity")
  const idxPrice     = col("T. Price")
  const idxFees      = col("Comm/Fee")
  const idxPnl       = col("Realized P&L")
  const idxAsset     = col("Asset Category")
  const idxCurrency  = col("Currency")
  const idxTradeId   = col("Trade ID")

  if (idxSymbol === -1 || idxDateTime === -1 || idxQty === -1 || idxPrice === -1) {
    return {
      broker: "interactive_brokers",
      trades: [],
      errors: [{ row: 0, message: `Missing required columns. Found: ${headers.join(", ")}` }],
      totalRows: 0,
    }
  }

  let totalRows = 0

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    // Ignorer les lignes de sous-totaux, totaux et autres sections
    if (!line.startsWith("Trades,Data,") && !isDataLine(line, headers)) continue

    const cols = parseCSVLine(line)
    totalRows++

    try {
      const symbol   = cols[idxSymbol]?.trim()
      const dateStr  = cols[idxDateTime]?.trim()
      const qtyStr   = cols[idxQty]?.trim()
      const priceStr = cols[idxPrice]?.trim()
      const feesStr  = cols[idxFees]?.trim() ?? "0"
      const pnlStr   = cols[idxPnl]?.trim()
      const asset    = cols[idxAsset]?.trim()?.toLowerCase() ?? ""

      if (!symbol || !dateStr || !priceStr || !qtyStr) {
        errors.push({ row: i + 1, message: `Missing required fields on row ${i + 1}` })
        continue
      }

      const qty   = parseFloat(qtyStr.replace(",", ""))
      const price = parseFloat(priceStr.replace(",", ""))
      const fees  = Math.abs(parseFloat(feesStr.replace(",", "") || "0"))
      const pnl   = pnlStr ? parseFloat(pnlStr.replace(",", "")) : undefined

      if (isNaN(qty) || isNaN(price)) {
        errors.push({ row: i + 1, message: `Invalid numeric values on row ${i + 1}` })
        continue
      }

      // IB format date: "2024-01-15, 09:30:00" or "2024-01-15;09:30:00"
      const entryAt = parseIBDate(dateStr)
      if (!entryAt) {
        errors.push({ row: i + 1, message: `Invalid date format: ${dateStr} on row ${i + 1}` })
        continue
      }

      const instrumentType = mapAssetType(asset)
      const side: "long" | "short" = qty > 0 ? "long" : "short"

      const trade: ParsedTrade = {
        externalId: idxTradeId !== -1 ? cols[idxTradeId]?.trim() : undefined,
        symbol,
        instrumentType,
        side,
        quantity: Math.abs(qty),
        entryPrice: price,
        entryAt,
        fees,
        grossPnl: pnl,
        netPnl: pnl !== undefined ? pnl - fees : undefined,
        session: detectSession(entryAt),
        importSource: "csv",
      }

      trades.push(trade)
    } catch (err) {
      errors.push({ row: i + 1, message: `Parse error on row ${i + 1}: ${String(err)}` })
    }
  }

  return { broker: "interactive_brokers", trades, errors, totalRows }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function isDataLine(line: string, headers: string[]): boolean {
  // Heuristique : la ligne a autant de colonnes que le header et commence par "Trades" ou est une ligne de données
  const cols = line.split(",")
  return cols.length >= Math.max(5, headers.length - 3)
}

function parseIBDate(dateStr: string): Date | null {
  // Formats: "2024-01-15, 09:30:00" / "2024-01-15;09:30:00" / "20240115  09:30:00"
  const cleaned = dateStr.replace(";", " ").replace(",", "").trim()
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d
}

function mapAssetType(asset: string): string {
  if (asset.includes("stock") || asset.includes("equity")) return "stock"
  if (asset.includes("forex") || asset.includes("cash")) return "forex"
  if (asset.includes("future")) return "futures"
  if (asset.includes("option")) return "options"
  if (asset.includes("crypto")) return "crypto"
  return "stock" // défaut pour IB
}

function detectSession(date: Date): string {
  const hour = date.getUTCHours()
  if (hour >= 13 && hour < 21) return "ny_open"      // 9am–5pm EST
  if (hour >= 7 && hour < 16) return "london"        // 7am–4pm UTC
  if (hour >= 0 && hour < 8) return "asia"
  return "pre_market"
}
