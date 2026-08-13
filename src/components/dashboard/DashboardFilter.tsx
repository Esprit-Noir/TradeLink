"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"

export function DashboardFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [period, setPeriod] = useState(searchParams?.get("period") || "all")
  const [showCustom, setShowCustom] = useState(period === "custom")
  const [startDate, setStartDate] = useState(searchParams?.get("from") || "")
  const [endDate, setEndDate] = useState(searchParams?.get("to") || "")

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setPeriod(val)
    if (val === "custom") {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      const params = new URLSearchParams(searchParams as any)
      params.set("period", val)
      params.delete("from")
      params.delete("to")
      router.push(`${pathname}?${params.toString()}`)
      router.refresh()
    }
  }

  const handleCustomDateApply = () => {
    const params = new URLSearchParams(searchParams as any)
    params.set("period", "custom")
    if (startDate) params.set("from", startDate)
    if (endDate) params.set("to", endDate)
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {showCustom && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--gray-900)", padding: "0.25rem 0.5rem", borderRadius: "8px", border: "1px solid var(--gray-800)" }}>
          <input 
            type="date" 
            className="input" 
            style={{ width: "130px", height: "32px", fontSize: "0.8rem", padding: "0 0.5rem" }} 
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <span style={{ color: "var(--gray-500)", fontSize: "0.8rem" }}>to</span>
          <input 
            type="date" 
            className="input" 
            style={{ width: "130px", height: "32px", fontSize: "0.8rem", padding: "0 0.5rem" }} 
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ height: "32px", padding: "0 0.75rem", fontSize: "0.8rem" }}
            onClick={handleCustomDateApply}
          >
            Apply
          </button>
        </div>
      )}
      <select 
        className="input select" 
        style={{ width: "auto" }} 
        value={period} 
        onChange={handlePeriodChange}
      >
        <option value="all">All time</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="ytd">Year to date</option>
        <option value="custom">Custom Date...</option>
      </select>
    </div>
  )
}
