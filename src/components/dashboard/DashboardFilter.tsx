"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect, useTransition } from "react"
import { Wallet, Loader2 } from "lucide-react"

type FilterAccount = {
  id: string
  name: string
  isDefault: boolean
}

export function DashboardFilter({ accounts }: { accounts: FilterAccount[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
      router.refresh()
    })
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
    <div className="flex flex-wrap items-center gap-2">
      {showCustom && (
        <div className="flex items-center gap-2 bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] px-2 py-1 rounded-lg">
          <input
            type="date"
            className="input w-[130px] h-8 text-xs px-2"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <span className="text-[var(--color-gray-500)] text-xs">to</span>
          <input
            type="date"
            className="input w-[130px] h-8 text-xs px-2"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary h-8 px-3 text-xs"
            onClick={handleCustomDateApply}
            disabled={isPending}
          >
            Apply
          </button>
        </div>
      )}
      {accounts.length > 1 && (
        <div className="flex items-center gap-1.5 relative">
          <Wallet size={14} className="text-[var(--color-gray-500)] absolute left-3 pointer-events-none" />
          <select
            className="input select w-auto pl-8"
            value={accountId}
            onChange={handleAccountChange}
            disabled={isPending}
          >
            <option value="all">All accounts (consolidated)</option>
            <option value="">Active account</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}{a.isDefault ? " (default)" : ""}</option>
            ))}
          </select>
        </div>
      )}
      <div className="relative flex items-center">
        <select
          className="input select w-auto"
          value={period}
          onChange={handlePeriodChange}
          disabled={isPending}
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="ytd">Year to date</option>
          <option value="custom">Custom Date...</option>
        </select>
        {isPending && <Loader2 className="absolute right-[-1.5rem] animate-spin text-[var(--color-gray-500)]" size={16} />}
      </div>
    </div>
  )
}

