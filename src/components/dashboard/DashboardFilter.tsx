"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Wallet } from "lucide-react"

type FilterAccount = {
  id: string
  name: string
  isDefault: boolean
}

export function DashboardFilter({ accounts }: { accounts: FilterAccount[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [accountId, setAccountId] = useState(searchParams?.get("accountId") || "all")
  const [period, setPeriod] = useState(searchParams?.get("period") || "all")
  const [showCustom, setShowCustom] = useState(period === "custom")
  const [startDate, setStartDate] = useState(searchParams?.get("from") || "")
  const [endDate, setEndDate] = useState(searchParams?.get("to") || "")

  useEffect(() => {
    const current = searchParams?.get("accountId") || "all"
    if (current !== accountId) setAccountId(current)
  }, [searchParams, accountId])

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams as any)
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k)
      else params.set(k, v)
    }
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setAccountId(val)
    if (val) pushParams({ accountId: val })
    else pushParams({ accountId: null })
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setPeriod(val)
    if (val === "custom") {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      pushParams({ period: val, from: null, to: null })
    }
  }

  const handleCustomDateApply = () => {
    pushParams({ period: "custom", from: startDate || null, to: endDate || null })
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
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
      {accounts.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Wallet size={14} style={{ color: "var(--color-gray-500)" }} />
          <select
            className="input select"
            style={{ width: "auto" }}
            value={accountId}
            onChange={handleAccountChange}
          >
            <option value="all">All accounts (consolidated)</option>
            <option value="">Active account</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}{a.isDefault ? " (default)" : ""}</option>
            ))}
          </select>
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
