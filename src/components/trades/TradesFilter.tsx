"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"

type Account = { id: string; name: string; isDefault: boolean }

export function TradesFilter({ accounts = [] }: { accounts?: Account[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [accountId, setAccountId] = useState(searchParams?.get("accountId") || "")
  const [symbol, setSymbol] = useState(searchParams?.get("symbol") || "")
  const [side, setSide] = useState(searchParams?.get("side") || "")
  const [result, setResult] = useState(searchParams?.get("result") || "")
  const [date, setDate] = useState(searchParams?.get("date") || "")

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams as any)
    
    if (accountId) params.set("accountId", accountId)
    else params.delete("accountId")

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
    setAccountId("")
    setSymbol("")
    setSide("")
    setResult("")
    setDate("")
    router.push(pathname || "/trades")
    router.refresh()
  }

  const hasActiveFilters = accountId || symbol || side || result || date

  return (
    <form onSubmit={handleApply} className="flex flex-wrap gap-4 items-end mb-6 bg-[var(--color-gray-900)] p-5 rounded-[var(--radius-card)] border border-[var(--color-gray-800)]">
      
      {accounts.length > 1 && (
        <div className="flex-1 min-w-[170px] m-0">
          <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
            Account
          </label>
          <select 
            value={accountId} 
            onChange={(e) => setAccountId(e.target.value)} 
            className="input select"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}{a.isDefault ? " (default)" : ""}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 min-w-[200px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          Symbol
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]" size={16} />
          <input 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)} 
            placeholder="e.g. AAPL, BTCUSDT" 
            className="input pl-9"
          />
        </div>
      </div>

      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
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
      
      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
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
      
      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
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

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary px-6 h-[42px] flex items-center gap-2">
          <SlidersHorizontal size={16} /> Filter
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={handleClear} className="btn btn-outline px-4 h-[42px] flex items-center gap-2 text-[var(--color-gray-400)]">
            <X size={16} /> Clear
          </button>
        )}
      </div>
    </form>
  )
}

