// lib/parsers/generic.parser.ts
// Parser CSV générique piloté par un mapping de colonnes (user mapping)

import type { ParseResult, ParsedTrade } from "./index"

export type GenericMapping = Partial<Record<
  "symbol" | "side" | "entryAt" | "exitAt" | "quantity" | "entryPrice" | "exitPrice" | "fees" | "netPnl" | "instrumentType" | "status",
  string
>>

// Tokeniseur CSV simple gérant les champs entre guillemets
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

function guessDateFormat(value: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  if (!isNaN(d.getTime())) return d

  // Common formats like 13/08/2026 14:30 or 13-08-2026
  const m = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?/)
  if (m) {
    const [, a, b, y, h, min] = m
    let day = parseInt(a, 10)
    let month = parseInt(b, 10)
    let year = parseInt(y, 10)
    if (year < 100) year += 2000
    // Ambiguity: assume US format (mm/dd) if first > 12 else dd/mm
    if (day > 12 && month <= 12) {
      ;[day, month] = [month, day]
    }
    const dt = new Date(year, month - 1, day, h ? parseInt(h, 10) : 0, min ? parseInt(min, 10) : 0)
    return isNaN(dt.getTime()) ? null : dt
  }
  return null
}

function parseNumber(value: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  const cleaned = value.replace(/[$,\s]/g, "")
  const n = parseFloat(cleaned)
  return isNaN(n) ? undefined : n
}

export function parseGenericCSV(
  csvText: string,
  mapping: GenericMapping
): ParseResult {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) {
    return { broker: "unknown", trades: [], errors: [{ row: 0, message: "File is empty or has no data rows." }], totalRows: 0 }
  }

  const headerLine = lines.find((l) => l.trim() && !l.startsWith("#")) ?? lines[0]
  const headers = parseRow(headerLine)
  const indexOf = (header: string) => headers.findIndex((h) => h.toLowerCase() === (header || "").toLowerCase())

  // Résoudre le mapping header name -> column index
  const fieldToIndex: Record<string, number> = {}
  for (const [field, header] of Object.entries(mapping)) {
    if (!header) continue
    const idx = indexOf(header)
    if (idx >= 0) fieldToIndex[field] = idx
  }

  if (fieldToIndex.symbol === undefined) {
    return { broker: "unknown", trades: [], errors: [{ row: 0, message: "Please map a 'symbol' column to continue." }], totalRows: lines.length - 1 }
  }
  if (fieldToIndex.entryAt === undefined) {
    return { broker: "unknown", trades: [], errors: [{ row: 0, message: "Please map an 'entry date' column to continue." }], totalRows: lines.length - 1 }
  }
  if (fieldToIndex.side === undefined) {
    return { broker: "unknown", trades: [], errors: [{ row: 0, message: "Please map a 'side' column to continue." }], totalRows: lines.length - 1 }
  }

  const trades: ParsedTrade[] = []
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("#")) continue
    const cells = parseRow(line)
    if (cells.length === 0 || cells.every((c) => c === "")) continue

    const get = (field: string) => {
      const idx = fieldToIndex[field]
      return idx !== undefined && idx >= 0 ? cells[idx] ?? "" : ""
    }

    const symbol = get("symbol").toUpperCase()
    const sideRaw = get("side").toUpperCase()
    if (!symbol || !sideRaw) {
      if (i > 0) errors.push({ row: i + 1, message: "Missing symbol or side." })
      continue
    }

    const side = sideRaw.startsWith("S") ? "SHORT" : "LONG"
    const entryAt = guessDateFormat(get("entryAt"))
    if (!entryAt) {
      errors.push({ row: i + 1, message: `Could not parse entry date: "${get("entryAt")}"` })
      continue
    }
    const exitAt = guessDateFormat(get("exitAt")) || entryAt

    const quantity = parseNumber(get("quantity"))
    const entryPrice = parseNumber(get("entryPrice"))
    const exitPrice = parseNumber(get("exitPrice"))
    const fees = parseNumber(get("fees")) ?? 0
    const netPnlRaw = parseNumber(get("netPnl"))

    let netPnl: number | undefined = netPnlRaw
    if (netPnl === undefined && entryPrice !== undefined && exitPrice !== undefined && quantity !== undefined) {
      netPnl = (side === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice) * quantity - fees
    }
    if (netPnl === undefined) {
      errors.push({ row: i + 1, message: "Could not determine P&L (map netPnl or entry/exit prices)." })
      continue
    }

    trades.push({
      symbol,
      side,
      entryAt,
      exitAt,
      quantity: quantity ?? 0,
      entryPrice,
      exitPrice,
      fees,
      netPnl: Math.round(netPnl * 100) / 100,
      instrumentType: get("instrumentType") || undefined,
      status: get("status") ? (get("status").toLowerCase() === "open" ? "open" : "closed") : "closed",
      importSource: "csv" as const,
    })
  }

  return {
    broker: "generic",
    trades,
    errors,
    totalRows: lines.length - 1,
  }
}
