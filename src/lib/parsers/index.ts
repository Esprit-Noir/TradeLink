// lib/parsers/index.ts
// Auto-détection du broker + dispatch vers le bon parser

import { ibParser, type ParsedTrade } from "./ib.parser"
import { binanceParser } from "./binance.parser"
import { bybitParser } from "./bybit.parser"
import { metatraderParser } from "./metatrader.parser"

export type { ParsedTrade }

export type Broker = "interactive_brokers" | "binance" | "bybit" | "metatrader" | "generic" | "unknown"

export interface ParseResult {
  broker: Broker
  trades: ParsedTrade[]
  errors: { row: number; message: string }[]
  totalRows: number
}

// Fingerprints de colonnes pour l'auto-détection
const BROKER_FINGERPRINTS: Record<Broker, string[]> = {
  interactive_brokers: ["ClientAccountID", "TradeID", "Symbol", "Buy/Sell", "TradePrice"],
  binance: ["Order ID", "Pair", "Side", "Average Price", "Filled"],
  bybit: ["Order ID", "Symbol", "Side", "Order Price", "Order Qty"],
  metatrader: ["Ticket", "Type", "Size", "Profit"],
  generic: [],
  unknown: [],
}

export function detectBroker(headers: string[]): Broker {
  const headerSet = new Set(headers.map((h) => h.trim()))

  for (const [broker, fingerprint] of Object.entries(BROKER_FINGERPRINTS) as [Broker, string[]][]) {
    if (broker === "unknown" || broker === "generic") continue
    const matches = fingerprint.filter((col) => headerSet.has(col)).length
    if (matches >= Math.ceil(fingerprint.length * 0.6)) return broker
  }

  return "unknown"
}

export async function parseCSV(csvText: string, forceBroker?: Broker): Promise<ParseResult> {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) {
    return { broker: "unknown", trades: [], errors: [{ row: 0, message: "File is empty or has no data rows." }], totalRows: 0 }
  }

  // Parser les headers (première ligne non-vide non-commentaire)
  const headerLine = lines.find((l) => l.trim() && !l.startsWith("#")) ?? lines[0]
  const headers = headerLine.split(",").map((h) => h.replace(/"/g, "").trim())

  const broker = forceBroker ?? detectBroker(headers)

  switch (broker) {
    case "interactive_brokers":
      return ibParser(csvText)
    case "binance":
      return binanceParser(csvText)
    case "bybit":
      return bybitParser(csvText)
    case "metatrader":
      return metatraderParser(csvText)
    default:
      return {
        broker: "unknown",
        trades: [],
        errors: [{ row: 0, message: "Broker format not recognized. Supported: Interactive Brokers, Binance, Bybit, MetaTrader." }],
        totalRows: lines.length - 1,
      }
  }
}
