"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Wallet } from "lucide-react"

type FilterAccount = {
  id: string
  name: string
  isDefault: boolean
}

export function CalendarFilter({ accounts }: { accounts: FilterAccount[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [accountId, setAccountId] = useState(searchParams?.get("accountId") || "all")

  useEffect(() => {
    const current = searchParams?.get("accountId") || "all"
    if (current !== accountId) setAccountId(current)
  }, [searchParams, accountId])

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
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

  if (accounts.length <= 1) return null

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <Wallet size={14} style={{ color: "var(--color-gray-500)" }} />
        <select
          className="input select"
          style={{ width: "auto", height: "38px" }}
          value={accountId}
          onChange={handleAccountChange}
          aria-label="Select account"
        >
          <option value="all">All accounts (consolidated)</option>
          <option value="">Active account</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
