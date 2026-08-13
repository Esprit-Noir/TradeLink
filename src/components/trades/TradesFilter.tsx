"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"

export function TradesFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [symbol, setSymbol] = useState(searchParams?.get("symbol") || "")
  const [side, setSide] = useState(searchParams?.get("side") || "")
  const [result, setResult] = useState(searchParams?.get("result") || "")
  const [date, setDate] = useState(searchParams?.get("date") || "")

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams as any)
    
    if (symbol) params.set("symbol", symbol)
    else params.delete("symbol")

    if (side) params.set("side", side)
    else params.delete("side")
    
    if (result) params.set("result", result)
    else params.delete("result")
    
    if (date) params.set("date", date)
    else params.delete("date")

    // Reset to page 1 when filtering
    params.set("page", "1")

    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const handleClear = () => {
    setSymbol("")
    setSide("")
    setResult("")
    setDate("")
    router.push(pathname || "/trades")
    router.refresh()
  }

  const hasActiveFilters = symbol || side || result || date

  return (
    <form onSubmit={handleApply} style={{
      display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem",
      background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "var(--radius-card)", border: "1px solid var(--color-gray-800)",
    }}>
      
      <div className="form-group" style={{ flex: 1, minWidth: "200px", margin: 0 }}>
        <label className="label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-500)", marginBottom: "0.5rem", fontWeight: 700 }}>
          Symbol
        </label>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-500)" }} size={16} />
          <input 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)} 
            placeholder="e.g. AAPL, BTCUSDT" 
            className="input"
            style={{ paddingLeft: "36px" }}
          />
        </div>
      </div>

      <div className="form-group" style={{ flex: 1, minWidth: "150px", margin: 0 }}>
        <label className="label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-500)", marginBottom: "0.5rem", fontWeight: 700 }}>
          Trade Side
        </label>
        <select 
          value={side} 
          onChange={(e) => setSide(e.target.value)} 
          className="input select"
        >
          <option value="">All Sides</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
      </div>
      
      <div className="form-group" style={{ flex: 1, minWidth: "150px", margin: 0 }}>
        <label className="label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-500)", marginBottom: "0.5rem", fontWeight: 700 }}>
          Result
        </label>
        <select 
          value={result} 
          onChange={(e) => setResult(e.target.value)} 
          className="input select"
        >
          <option value="">All Results</option>
          <option value="win">Winning Trades</option>
          <option value="loss">Losing Trades</option>
          <option value="be">Break-Even</option>
        </select>
      </div>
      
      <div className="form-group" style={{ flex: 1, minWidth: "150px", margin: 0 }}>
        <label className="label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-500)", marginBottom: "0.5rem", fontWeight: 700 }}>
          Timeframe
        </label>
        <select 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="input select"
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="this_month">This Month</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="submit" className="btn btn-primary" style={{ padding: "0 1.5rem", height: "42px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <SlidersHorizontal size={16} /> Filter
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={handleClear} className="btn btn-outline" style={{ padding: "0 1rem", height: "42px", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)" }}>
            <X size={16} /> Clear
          </button>
        )}
      </div>
    </form>
  )
}
