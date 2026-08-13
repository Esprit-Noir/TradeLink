"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"

export function TradesFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [symbol, setSymbol] = useState(searchParams?.get("symbol") || "")
  const [side, setSide] = useState(searchParams?.get("side") || "")

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams as any)
    
    if (symbol) params.set("symbol", symbol)
    else params.delete("symbol")

    if (side) params.set("side", side)
    else params.delete("side")

    // Reset to page 1 when filtering
    params.set("page", "1")

    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const handleClear = () => {
    setSymbol("")
    setSide("")
    router.push(pathname || "/trades")
    router.refresh()
  }

  return (
    <form onSubmit={handleApply} style={{
      display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem",
      background: "var(--gray-900)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--gray-800)",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
    }}>
      
      <div className="form-group" style={{ flex: 1, minWidth: "200px", margin: 0 }}>
        <label className="label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-500)", marginBottom: "0.5rem" }}>
          Search Symbol
        </label>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-500)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)} 
            placeholder="e.g. AAPL, BTCUSDT" 
            className="input"
            style={{ paddingLeft: "36px", backgroundColor: "var(--gray-950)", border: "1px solid var(--gray-800)" }}
          />
        </div>
      </div>

      <div className="form-group" style={{ flex: 1, minWidth: "150px", margin: 0 }}>
        <label className="label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-500)", marginBottom: "0.5rem" }}>
          Trade Side
        </label>
        <select 
          value={side} 
          onChange={(e) => setSide(e.target.value)} 
          className="input select"
          style={{ backgroundColor: "var(--gray-950)", border: "1px solid var(--gray-800)" }}
        >
          <option value="">All Sides</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="submit" className="btn btn-primary" style={{ padding: "0 1.5rem", height: "42px" }}>
          Apply Filters
        </button>
        {(symbol || side) && (
          <button type="button" onClick={handleClear} className="btn btn-ghost" style={{ padding: "0 1.5rem", height: "42px" }}>
            Reset
          </button>
        )}
      </div>
    </form>
  )
}
