"use client"

import { useState, useEffect } from "react"
import { Settings, RefreshCcw, X, Check } from "lucide-react"

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts"

interface SymbolData {
  symbol: string
  name: string
  price: string
  change: number
  signal: "BUY" | "SELL" | "NEUTRAL"
  score: number
  short: number
  medium: number
  long: number
  trend: "BULLISH" | "BEARISH" | "NEUTRAL"
  history: { value: number }[]
}

const generateHistory = (trend: string, start: number) => {
  const data = []
  let current = start
  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - (trend === "BULLISH" ? 0.3 : trend === "BEARISH" ? 0.7 : 0.5)) * (start * 0.002)
    current += change
    data.push({ value: current })
  }
  return data
}

const AVAILABLE_SYMBOLS: SymbolData[] = [
  { symbol: "EURUSD", name: "Euro / US Dollar", price: "1.0854", change: -0.23, signal: "SELL", score: -43.5, short: -23, medium: -33, long: -65, trend: "BEARISH", history: generateHistory("BEARISH", 1.0880) },
  { symbol: "GBPJPY", name: "Pound / Yen", price: "188.45", change: -0.05, signal: "NEUTRAL", score: -6.75, short: -47, medium: -37, long: 38, trend: "BEARISH", history: generateHistory("BEARISH", 188.50) },
  { symbol: "NAS100", name: "NAS100 Index", price: "17850.5", change: 1.25, signal: "NEUTRAL", score: 12.5, short: 15, medium: 5, long: 25, trend: "BULLISH", history: generateHistory("BULLISH", 17600) },
  { symbol: "XAUUSD", name: "Gold / USD", price: "2345.10", change: -0.85, signal: "SELL", score: -65.2, short: -80, medium: -60, long: -55, trend: "BEARISH", history: generateHistory("BEARISH", 2365) },
  { symbol: "BTCUSD", name: "Bitcoin / USD", price: "64230.00", change: 3.45, signal: "BUY", score: 85.0, short: 90, medium: 75, long: 90, trend: "BULLISH", history: generateHistory("BULLISH", 62000) },
  { symbol: "US30", name: "Dow Jones Index", price: "39150.2", change: 0.45, signal: "BUY", score: 45.2, short: 30, medium: 55, long: 50, trend: "BULLISH", history: generateHistory("BULLISH", 38900) },
  { symbol: "ETHUSD", name: "Ethereum / USD", price: "3450.20", change: 1.15, signal: "NEUTRAL", score: 10.5, short: -10, medium: 15, long: 25, trend: "NEUTRAL", history: generateHistory("NEUTRAL", 3410) },
  { symbol: "USDJPY", name: "US Dollar / Yen", price: "151.20", change: 0.15, signal: "BUY", score: 30.0, short: 20, medium: 35, long: 35, trend: "BULLISH", history: generateHistory("BULLISH", 150.90) },
]

function GaugeChart({ score }: { score: number }) {
  const clampedScore = Math.max(-100, Math.min(100, score))
  const angle = (clampedScore / 100) * 90

  return (
    <div style={{ position: "relative", width: 140, height: 84, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 4, fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.05em", color: "var(--color-gray-200)", zIndex: 0 }}>
        {score > 0 ? "+" : ""}{score}
      </div>
      <svg viewBox="0 0 200 100" style={{ width: "100%", height: "100%", position: "absolute", bottom: 0, zIndex: 10, pointerEvents: "none" }}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--color-gray-700)" strokeWidth="20" strokeLinecap="round" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#00c758" />
          </linearGradient>
          <linearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="20" strokeLinecap="round" strokeDasharray="2 6" />
        <g style={{ transformOrigin: "100px 100px", transform: `rotate(${angle}deg)`, transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <polygon points="96,100 104,100 100,30" fill="url(#needleGrad)" />
        </g>
        <circle cx="100" cy="100" r="6" fill="var(--color-brand-500)" />
      </svg>
    </div>
  )
}

function SymbolCard({ data }: { data: SymbolData }) {
  const signalClass = data.signal === "BUY" ? "badge-profit" : data.signal === "SELL" ? "badge-loss" : "badge-neutral"
  const trendColor = data.trend === "BULLISH" ? "var(--color-profit)" : data.trend === "BEARISH" ? "var(--color-loss)" : "var(--color-gray-400)"
  const changeColor = data.change >= 0 ? "var(--color-profit)" : "var(--color-loss)"

  return (
    <div className="card card-hover" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.25rem" }}>
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-gray-200)", letterSpacing: "0.05em", marginBottom: 2 }}>{data.symbol}</div>
          <div style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{data.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-gray-200)", fontVariantNumeric: "tabular-nums" }}>{data.price}</div>
          <div style={{ fontSize: "0.7rem", fontWeight: 600, color: changeColor, fontVariantNumeric: "tabular-nums" }}>
            {data.change > 0 ? "+" : ""}{data.change}%
          </div>
        </div>
      </div>

      <div style={{ width: "100%", height: 40, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.history}>
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={changeColor} 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <span className={`badge ${signalClass}`} style={{ marginBottom: 20, fontSize: "0.6rem", padding: "4px 14px" }}>
        {data.signal}
      </span>

      <GaugeChart score={data.score} />

      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", marginTop: 20, padding: "0 8px", textAlign: "center" }}>
        {(["short", "medium", "long"] as const).map(k => (
          <div key={k} style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{k}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: data[k] >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
              {data[k] > 0 ? "+" : ""}{data[k]}
            </span>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 1, background: "var(--color-gray-800)", margin: "14px 0" }} />

      <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-gray-500)", textTransform: "uppercase" }}>
        Trend <span style={{ color: trendColor }}>{data.trend}</span>
      </div>
    </div>
  )
}

export function MarketOverview() {
  const [time, setTime] = useState("")
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["EURUSD", "GBPJPY", "NAS100", "XAUUSD"])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [allData, setAllData] = useState<SymbolData[]>(AVAILABLE_SYMBOLS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("market_overview_symbols")
    if (saved) {
      try { setSelectedSymbols(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    setTime(new Date().toLocaleTimeString("en-US", { hour12: false }))
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchRealData = async () => {
    try {
      setLoading(true)
      // Yahoo finance symbols corresponding to the hardcoded list
      const yahooSymbols = ["EURUSD=X", "GBPJPY=X", "^NDX", "GC=F", "BTC-USD", "^DJI", "ETH-USD", "JPY=X"]
      const res = await fetch(`/api/market-quotes?symbols=${encodeURIComponent(yahooSymbols.join(","))}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const result = await res.json()
      const quotes = result.quotes || []
      
      const updatedData = AVAILABLE_SYMBOLS.map((item, i) => {
        const quote = quotes[i]
        if (!quote) return item
        
        const price = quote.last ? (quote.last > 1000 ? quote.last.toFixed(1) : quote.last.toFixed(4)) : item.price
        const change = quote.changePct !== null ? Number(quote.changePct.toFixed(2)) : item.change
        
        const trend = change > 0.5 ? "BULLISH" : change < -0.5 ? "BEARISH" : "NEUTRAL"
        const signal = change > 0.5 ? "BUY" : change < -0.5 ? "SELL" : "NEUTRAL"
        
        const baseScore = Math.max(-100, Math.min(100, change * 40))
        const score = Number(baseScore.toFixed(1))
        const short = Math.max(-100, Math.min(100, Math.round(score + (Math.random() * 40 - 20))))
        const medium = Math.max(-100, Math.min(100, Math.round(score * 0.8 + (Math.random() * 30 - 15))))
        const long = Math.max(-100, Math.min(100, Math.round(score * 0.5 + (Math.random() * 20 - 10))))
        
        return {
          ...item,
          price: String(price),
          change: change,
          trend: trend as any,
          signal: signal as any,
          score,
          short,
          medium,
          long,
        }
      })
      setAllData(updatedData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealData()
    const interval = setInterval(fetchRealData, 60000)
    return () => clearInterval(interval)
  }, [])

  const saveSymbols = (symbols: string[]) => {
    setSelectedSymbols(symbols)
    localStorage.setItem("market_overview_symbols", JSON.stringify(symbols))
  }

  const displayedSymbols = allData.filter(s => selectedSymbols.includes(s.symbol))

  return (
    <div style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1rem" }}>&#128202;</span>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-gray-200)" }}>Market Overview</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setIsModalOpen(true)} style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer" }}>
            <Settings size={14} />
          </button>
          <button onClick={fetchRealData} disabled={loading} style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer" }}>
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>Last update <span style={{ fontFamily: "var(--font-mono)" }}>{time}</span></p>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-profit)" }}>{displayedSymbols.length} symbols</p>
      </div>

      {displayedSymbols.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", border: "1px dashed var(--color-gray-700)", borderRadius: 8 }}>
          <p style={{ color: "var(--color-gray-400)", marginBottom: 12, fontSize: "0.85rem" }}>No assets configured</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ fontSize: "0.75rem" }}>
            Configure Assets
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {displayedSymbols.map(item => (
            <SymbolCard key={item.symbol} data={item} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => setIsModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div className="chart-card" style={{ position: "relative", width: "100%", maxWidth: 440, padding: "1.5rem", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={16} style={{ color: "var(--color-brand-500)" }} />
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-gray-200)" }}>Configure Symbols</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: 4, borderRadius: 6, background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
              {allData.map(sym => {
                const isChecked = selectedSymbols.includes(sym.symbol)
                return (
                  <button key={sym.symbol} onClick={() => saveSymbols(isChecked ? selectedSymbols.filter(s => s !== sym.symbol) : [...selectedSymbols, sym.symbol])}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10,
                      borderRadius: 8, border: `1px solid ${isChecked ? "var(--color-brand-500)" : "var(--color-gray-700)"}`,
                      background: isChecked ? "var(--color-profit-muted)" : "var(--color-gray-950)",
                      color: isChecked ? "var(--color-gray-200)" : "var(--color-gray-400)", cursor: "pointer", textAlign: "left",
                    }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{sym.symbol}</div>
                      <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>{sym.name}</div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, border: `1px solid ${isChecked ? "var(--color-brand-500)" : "var(--color-gray-600)"}`,
                      background: isChecked ? "var(--color-brand-500)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isChecked && <Check size={12} style={{ color: "white", strokeWidth: 3 }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--color-gray-800)", paddingTop: 12 }}>
              <button onClick={() => saveSymbols(AVAILABLE_SYMBOLS.map(s => s.symbol))} className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "4px 10px" }}>Select All</button>
              <button onClick={() => saveSymbols([])} className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "4px 10px" }}>Clear All</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => setIsModalOpen(false)} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
