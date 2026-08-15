// Curated catalogue of CFD instruments the user can add to the watchlist.
// Symbols are normalized display symbols (EUR/USD, XAU/USD, US500, BTC/USD...)
// mapped internally to the active provider via `yahooSymbol()` / Twelve Data.

export type SymbolCategory = "Forex" | "Métaux" | "Indices" | "Énergie" | "Crypto" | "Actions"

export interface WatchSymbol {
  symbol: string
  name: string
  category: SymbolCategory
}

export const CFD_SYMBOLS: WatchSymbol[] = [
  // Forex
  { symbol: "EUR/USD", name: "EUR/USD", category: "Forex" },
  { symbol: "GBP/USD", name: "GBP/USD", category: "Forex" },
  { symbol: "USD/JPY", name: "USD/JPY", category: "Forex" },
  { symbol: "USD/CHF", name: "USD/CHF", category: "Forex" },
  { symbol: "AUD/USD", name: "AUD/USD", category: "Forex" },
  { symbol: "USD/CAD", name: "USD/CAD", category: "Forex" },
  { symbol: "NZD/USD", name: "NZD/USD", category: "Forex" },
  { symbol: "EUR/GBP", name: "EUR/GBP", category: "Forex" },
  { symbol: "EUR/JPY", name: "EUR/JPY", category: "Forex" },
  { symbol: "GBP/JPY", name: "GBP/JPY", category: "Forex" },
  { symbol: "USD/SEK", name: "USD/SEK", category: "Forex" },
  { symbol: "USD/MXN", name: "USD/MXN", category: "Forex" },
  { symbol: "USD/NOK", name: "USD/NOK", category: "Forex" },
  { symbol: "AUD/JPY", name: "AUD/JPY", category: "Forex" },
  // Métaux
  { symbol: "XAU/USD", name: "Or (XAU/USD)", category: "Métaux" },
  { symbol: "XAG/USD", name: "Argent (XAG/USD)", category: "Métaux" },
  { symbol: "XPT/USD", name: "Platine (XPT/USD)", category: "Métaux" },
  { symbol: "XPD/USD", name: "Palladium (XPD/USD)", category: "Métaux" },
  // Indices
  { symbol: "US500", name: "US 500 (S&P 500)", category: "Indices" },
  { symbol: "US30", name: "US 30 (Dow Jones)", category: "Indices" },
  { symbol: "NAS100", name: "NAS 100 (Nasdaq)", category: "Indices" },
  { symbol: "US2000", name: "US 2000 (Russell)", category: "Indices" },
  { symbol: "GER40", name: "GER 40 (DAX)", category: "Indices" },
  { symbol: "UK100", name: "UK 100 (FTSE)", category: "Indices" },
  { symbol: "JP225", name: "JP 225 (Nikkei)", category: "Indices" },
  { symbol: "FR40", name: "FR 40 (CAC)", category: "Indices" },
  { symbol: "EU50", name: "EU 50 (Euro Stoxx)", category: "Indices" },
  // Énergie
  { symbol: "WTI", name: "Pétrole brut WTI", category: "Énergie" },
  { symbol: "BRENT", name: "Pétrole Brent", category: "Énergie" },
  { symbol: "NATGAS", name: "Gaz naturel", category: "Énergie" },
  // Crypto
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto" },
  { symbol: "SOL/USD", name: "Solana", category: "Crypto" },
  { symbol: "XRP/USD", name: "Ripple", category: "Crypto" },
  { symbol: "DOGE/USD", name: "Dogecoin", category: "Crypto" },
  // Actions (CFD)
  { symbol: "AAPL", name: "Apple", category: "Actions" },
  { symbol: "TSLA", name: "Tesla", category: "Actions" },
  { symbol: "NVDA", name: "NVIDIA", category: "Actions" },
  { symbol: "MSFT", name: "Microsoft", category: "Actions" },
  { symbol: "AMZN", name: "Amazon", category: "Actions" },
  { symbol: "META", name: "Meta", category: "Actions" },
  { symbol: "GOOGL", name: "Alphabet", category: "Actions" },
  { symbol: "NFLX", name: "Netflix", category: "Actions" },
  { symbol: "AMD", name: "AMD", category: "Actions" },
]

export const DEFAULT_WATCHLIST = ["EUR/USD", "XAU/USD", "US500", "BTC/USD"]

// ─── Yahoo Finance mapping ─────────────────────────────────────────────────────

const YAHOO_CRYPTO: Record<string, string> = {
  "BTC/USD": "BTC-USD",
  "ETH/USD": "ETH-USD",
  "SOL/USD": "SOL-USD",
  "XRP/USD": "XRP-USD",
  "DOGE/USD": "DOGE-USD",
}

const YAHOO_METALS: Record<string, string> = {
  "XAU/USD": "GC=F",
  "XAG/USD": "SI=F",
  "XPT/USD": "PA=F",
  "XPD/USD": "PL=F",
}

const YAHOO_INDICES: Record<string, string> = {
  US500: "^GSPC",
  US30: "^DJI",
  NAS100: "NQ=F",
  US2000: "^RUT",
  GER40: "^GDAXI",
  UK100: "^FTSE",
  JP225: "^N225",
  FR40: "^FCHI",
  EU50: "^STOXX50E",
}

const YAHOO_ENERGY: Record<string, string> = {
  WTI: "CL=F",
  BRENT: "BZ=F",
  NATGAS: "NG=F",
}

/**
 * Translate a normalized display symbol into a Yahoo Finance symbol.
 * Already-Yahoo symbols (^GSPC, EURUSD=X, GC=F, AAPL) pass through.
 */
export function yahooSymbol(symbol: string): string {
  const s = symbol.toUpperCase()
  if (s.startsWith("^") || /=[FX]$/.test(s)) return s
  if (YAHOO_CRYPTO[s]) return YAHOO_CRYPTO[s]
  if (YAHOO_METALS[s]) return YAHOO_METALS[s]
  if (YAHOO_INDICES[s]) return YAHOO_INDICES[s]
  if (YAHOO_ENERGY[s]) return YAHOO_ENERGY[s]
  if (s.includes("/")) return `${s.replace("/", "")}=X`
  return s
}

// ─── Classification ────────────────────────────────────────────────────────────

const SYMBOL_CATEGORIES: Record<string, SymbolCategory> = {}
for (const s of CFD_SYMBOLS) SYMBOL_CATEGORIES[s.symbol] = s.category

export function symbolName(symbol: string): string {
  return CFD_SYMBOLS.find((s) => s.symbol === symbol)?.name ?? symbol
}

export function symbolCategory(symbol: string): SymbolCategory {
  return SYMBOL_CATEGORIES[symbol] ?? classifySymbol(symbol)
}

/**
 * Classify an instrument into the Trade.instrumentType vocabulary so saved
 * backtest trades land in the right stats bucket.
 */
export function classifySymbol(symbol: string): string {
  const s = symbol.toUpperCase()
  if (s.includes("/USD") && !["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "DOGE/USD"].includes(s)) {
    const base = s.split("/")[0]
    if (["XAU", "XAG", "XPT", "XPD", "GOLD", "SILVER"].includes(base)) return "futures"
    if (["US500", "NAS100", "GER40", "UK100", "JP225", "FR40", "SPX500"].includes(base)) return "indices"
    return "forex"
  }
  if (s.includes("/")) {
    const base = s.split("/")[0]
    if (["BTC", "ETH", "SOL", "XRP", "LTC", "ADA", "DOGE", "BNB"].includes(base)) return "crypto"
    if (["WTI", "BRENT", "NATGAS", "XNG"].includes(base)) return "commodities"
    return "forex"
  }
  if (["WTI", "BRENT", "NATGAS", "GOLD", "SILVER"].includes(s)) return "commodities"
  if (["US500", "US30", "NAS100", "US2000", "GER40", "UK100", "JP225", "FR40", "EU50"].includes(s)) return "indices"
  if (["BTC", "ETH", "SOL", "XRP", "LTC", "ADA", "DOGE", "BNB"].includes(s)) return "crypto"
  if (s.endsWith("USDT") || s.endsWith("BUSD") || s.endsWith("USDC")) return "crypto"
  // Forex without slash: GBPJPY, EURUSD, AUDNZD, etc. (6 letters, two known currency codes)
  if (/^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY|CNY|HKD|SGD|SEK|NOK|DKK|ZAR|MXN|PLN|HUF|CZK|TRY|INR|BRL)(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY|CNY|HKD|SGD|SEK|NOK|DKK|ZAR|MXN|PLN|HUF|CZK|TRY|INR|BRL)$/.test(s)) return "forex"
  return "stock"
}

const SAFE_SYMBOL_RE = /^[A-Z0-9./^=\-_]+$/

/** Normalize + validate a symbol typed by the user. Returns null if invalid. */
export function sanitizeSymbol(raw: string): string | null {
  const s = raw.trim().toUpperCase()
  if (s.length < 2 || s.length > 24) return null
  if (!SAFE_SYMBOL_RE.test(s)) return null
  return s
}
