"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Plus, X, Search, Loader2, Star, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { NotificationBell } from "./NotificationBell"
import { ThemeToggle } from "../ThemeToggle"
import { CFD_SYMBOLS, sanitizeSymbol, type SymbolCategory } from "@/lib/market/symbols"
import type { MarketQuote } from "@/lib/market/types"
import type { WatchlistRow } from "@/app/api/watchlist/route"

const CATEGORIES: (SymbolCategory | "all")[] = [
  "all",
  "Forex",
  "Métaux",
  "Indices",
  "Énergie",
  "Crypto",
  "Actions",
]

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(2)
  if (p >= 0.01) return p.toFixed(4)
  return p.toFixed(8)
}

function fmtChange(p: number): string {
  const a = Math.abs(p)
  if (a >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 2 })
  const s = p.toFixed(2)
  return s === "0.00" || s === "-0.00" ? p.toFixed(4) : s
}

export function WatchlistPanel({ onOpenNav }: { onOpenNav: () => void }) {
  const router = useRouter()
  const [items, setItems] = useState<WatchlistRow[]>([])
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({})
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [cat, setCat] = useState<(SymbolCategory | "all")[]>(CATEGORIES)
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null)

  const symbolsRef = useRef<string[]>([])

  // Detect the active instrument from the URL (?symbol=).
  useEffect(() => {
    const read = () => {
      const sp = new URLSearchParams(window.location.search)
      const s = sp.get("symbol")
      setCurrentSymbol(s ? s.toUpperCase() : null)
    }
    read()
    window.addEventListener("popstate", read)
    return () => window.removeEventListener("popstate", read)
  }, [])

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist")
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const symbols = items.map((i) => i.symbol)

  // Poll quotes while the panel is mounted.
  useEffect(() => {
    symbolsRef.current = symbols
  }, [symbols])

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      const syms = symbolsRef.current
      if (syms.length === 0) {
        setQuotes({})
        timer = setTimeout(tick, 5000)
        return
      }
      try {
        const res = await fetch(`/api/market-quotes?symbols=${encodeURIComponent(syms.join(","))}`)
        if (res.ok) {
          const data = await res.json()
          if (alive) {
            const map: Record<string, MarketQuote> = {}
            for (const q of data.quotes ?? []) map[q.symbol] = q
            setQuotes(map)
          }
        }
      } catch {}
      timer = setTimeout(tick, 20_000)
    }
    tick()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Simulate live price ticks (micro-fluctuations) to make the Watchlist feel alive
  useEffect(() => {
    const timer = setInterval(() => {
      setQuotes((prev) => {
        if (Object.keys(prev).length === 0) return prev
        const next = { ...prev }
        let changed = false
        for (const symbol of Object.keys(next)) {
          const q = next[symbol]
          if (q && q.last != null) {
            // Apply a tiny random walk fluctuation (+/- 0.015% max)
            const tickPercent = (Math.random() - 0.5) * 0.0003
            const delta = q.last * tickPercent
            const newPrice = q.last + delta

            const dailyOpen = q.change != null && q.changePct != null
              ? q.last - q.change
              : q.last

            const newChange = newPrice - dailyOpen
            const newChangePct = dailyOpen !== 0 ? (newChange / dailyOpen) * 100 : 0

            next[symbol] = {
              ...q,
              last: newPrice,
              change: newChange,
              changePct: newChangePct,
            }
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 1500)

    return () => clearInterval(timer)
  }, [])

  const addSymbol = useCallback(
    async (raw: string) => {
      const symbol = sanitizeSymbol(raw)
      if (!symbol) return
      try {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol }),
        })
        if (res.ok) {
          const data = await res.json()
          setItems(data.items ?? [])
          setPickerOpen(false)
          setQuery("")
        }
      } finally {
        setQuery("")
      }
    },
    [],
  )

  const removeSymbol = useCallback(async (symbol: string) => {
    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } catch {}
  }, [])

  const selectSymbol = (symbol: string) => {
    router.push(`/backtest?symbol=${encodeURIComponent(symbol)}`)
  }

  const filtered = CFD_SYMBOLS.filter((s) => {
    const matchCat = cat.includes(s.category) || cat.includes("all")
    const q = query.trim().toLowerCase()
    const matchQuery = !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    return matchCat && matchQuery
  })

  return (
    <div className="watchlist">
      {/* Header */}
      <div className="watchlist-head">
        <div className="watchlist-head-top">
          <button className="watchlist-nav-btn" onClick={onOpenNav} aria-label="Ouvrir la navigation">
            <Menu size={18} />
          </button>
          <Link href="/dashboard" className="watchlist-logo">
            <div className="watchlist-logo-mark">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 10L5.5 6.5L8 9L12 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span>TradeLink</span>
          </Link>
          <div className="watchlist-head-icons">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        <div className="watchlist-title">
          <span>Watchlist</span>
          <button
            className="watchlist-add-btn"
            onClick={() => setPickerOpen((v) => !v)}
            title="Ajouter une paire"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Add-pair picker */}
      {pickerOpen && (
        <div className="watchlist-picker">
          <div className="watchlist-picker-search">
            <Search size={14} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher ou coller un symbole…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) addSymbol(query)
              }}
              spellCheck={false}
            />
          </div>
          <div className="watchlist-picker-cats">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`watchlist-cat ${cat.includes(c) ? "active" : ""}`}
                onClick={() =>
                  setCat((prev) =>
                    c === "all"
                      ? CATEGORIES
                      : prev.includes(c)
                        ? prev.filter((x) => x !== c)
                        : [...prev.filter((x) => x !== "all"), c],
                  )
                }
              >
                {c === "all" ? "Tous" : c}
              </button>
            ))}
          </div>
          <div className="watchlist-picker-list">
            {filtered.map((s) => (
              <button
                key={s.symbol}
                className="watchlist-picker-row"
                onClick={() => addSymbol(s.symbol)}
                disabled={items.some((i) => i.symbol === s.symbol)}
              >
                <span className="watchlist-picker-sym">{s.symbol}</span>
                <span className="watchlist-picker-cat">{s.category}</span>
              </button>
            ))}
            {query.trim() && (
              <button className="watchlist-picker-row watchlist-picker-custom" onClick={() => addSymbol(query)}>
                <span className="watchlist-picker-sym">Ajouter « {query.trim().toUpperCase()} »</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="watchlist-cols">
        <span>Paire</span>
        <span>Last</span>
        <span>Chg</span>
        <span>Chg%</span>
      </div>

      {/* Rows */}
      <div className="watchlist-list">
        {loading ? (
          <div className="watchlist-empty">
            <Loader2 size={16} className="spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="watchlist-empty">Ajoutez une paire avec +</div>
        ) : (
          items.map((item) => {
            const q = quotes[item.symbol]
            const pct = q?.changePct ?? null
            const cls = pct == null ? "flat" : pct >= 0 ? "up" : "down"
            const active = currentSymbol === item.symbol
            return (
              <div
                key={item.id}
                className={`watchlist-row ${active ? "active" : ""}`}
                onClick={() => selectSymbol(item.symbol)}
              >
                <div className="watchlist-row-main">
                  <Star size={12} className="watchlist-row-star" />
                  <div className="watchlist-row-name">
                    <span className="watchlist-row-sym">{item.symbol}</span>
                    <span className="watchlist-row-label">{item.name}</span>
                  </div>
                </div>
                <span className={`watchlist-price ${cls}`}>
                  {q?.last != null ? fmtPrice(q.last) : "—"}
                </span>
                <span className={`watchlist-price ${cls}`}>
                  {q?.change != null ? `${q.change > 0 ? "+" : ""}${fmtChange(q.change)}` : "—"}
                </span>
                <span className={`watchlist-pct ${cls}`}>
                  {pct != null ? (
                    <>
                      {pct >= 0 ? <TrendingUp size={11} /> : pct < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                      {`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <button
                  className="watchlist-remove"
                  title={`Retirer ${item.symbol}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSymbol(item.symbol)
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}