"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { useTranslations } from "next-intl"

type Account = { id: string; name: string; isDefault: boolean }

export function TradesFilter({ accounts = [] }: { accounts?: Account[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("TradesFilter")

  const [accountId, setAccountId] = useState(searchParams?.get("accountId") || "")
  const [symbol, setSymbol] = useState(searchParams?.get("symbol") || "")
  const [side, setSide] = useState(searchParams?.get("side") || "")
  const [result, setResult] = useState(searchParams?.get("result") || "")
  const [date, setDate] = useState(searchParams?.get("date") || "")
  const [instrument, setInstrument] = useState(searchParams?.get("instrument") || "")
  const [setup, setSetup] = useState(searchParams?.get("setup") || "")
  const [session, setSession] = useState(searchParams?.get("session") || "")

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams ?? undefined)
    
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

    if (instrument) params.set("instrument", instrument)
    else params.delete("instrument")

    if (setup) params.set("setup", setup)
    else params.delete("setup")

    if (session) params.set("session", session)
    else params.delete("session")

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
    setInstrument("")
    setSetup("")
    setSession("")
    router.push(pathname || "/trades")
    router.refresh()
  }

  const hasActiveFilters = accountId || symbol || side || result || date || instrument || setup || session

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-4 mb-6 bg-[var(--color-gray-900)] p-5 rounded-[var(--radius-card)] border border-[var(--color-gray-800)]">
      
      <div className="flex flex-wrap gap-4 items-end">
      {accounts.length > 1 && (
        <div className="flex-1 min-w-[170px] m-0">
          <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
            {t("account")}
          </label>
          <select 
            value={accountId} 
            onChange={(e) => setAccountId(e.target.value)} 
            className="input select"
          >
            <option value="">{t("allAccounts")}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}{a.isDefault ? ` (${t("default")})` : ""}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 min-w-[200px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          {t("symbol")}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]" size={16} />
          <input 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)} 
            placeholder={t("symbolPlaceholder")}
            className="input pl-9"
          />
        </div>
      </div>

      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          {t("tradeSide")}
        </label>
        <select 
          value={side} 
          onChange={(e) => setSide(e.target.value)} 
          className="input select"
        >
          <option value="">{t("allSides")}</option>
          <option value="LONG">{t("long")}</option>
          <option value="SHORT">{t("short")}</option>
        </select>
      </div>
      
      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          {t("result")}
        </label>
        <select 
          value={result} 
          onChange={(e) => setResult(e.target.value)} 
          className="input select"
        >
          <option value="">{t("allResults")}</option>
          <option value="win">{t("winningTrades")}</option>
          <option value="loss">{t("losingTrades")}</option>
          <option value="be">{t("breakEven")}</option>
        </select>
      </div>
      
      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          {t("timeframe")}
        </label>
        <select 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="input select"
        >
          <option value="">{t("allTime")}</option>
          <option value="today">{t("today")}</option>
          <option value="7d">{t("last7Days")}</option>
          <option value="30d">{t("last30Days")}</option>
          <option value="this_month">{t("thisMonth")}</option>
        </select>
      </div>

      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          {t("instrument")}
        </label>
        <select 
          value={instrument} 
          onChange={(e) => setInstrument(e.target.value)} 
          className="input select"
        >
          <option value="">{t("allTypes")}</option>
          <option value="forex">{t("forex")}</option>
          <option value="crypto">{t("crypto")}</option>
          <option value="indices">{t("indices")}</option>
          <option value="commodities">{t("commodities")}</option>
          <option value="stock">{t("stocks")}</option>
        </select>
      </div>
      
      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          {t("setupTag")}
        </label>
        <input 
          value={setup} 
          onChange={(e) => setSetup(e.target.value)} 
          placeholder={t("setupTagPlaceholder")}
          className="input"
        />
      </div>

      <div className="flex-1 min-w-[150px] m-0">
        <label className="label text-xs uppercase tracking-wider text-[var(--color-gray-500)] mb-2 font-bold">
          {t("session")}
        </label>
        <select 
          value={session} 
          onChange={(e) => setSession(e.target.value)} 
          className="input select"
        >
          <option value="">{t("allSessions")}</option>
          <option value="london">{t("london")}</option>
          <option value="ny_open">{t("newYork")}</option>
          <option value="asia">{t("asia")}</option>
          <option value="overlap">{t("overlap")}</option>
        </select>
      </div>

      </div>

      <div className="flex gap-3 pt-2 mt-2 border-t border-[var(--color-gray-800)]">
        <button type="submit" className="btn btn-primary px-6 h-[42px] flex items-center gap-2">
          <SlidersHorizontal size={16} /> {t("filter")}
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={handleClear} className="btn btn-outline px-4 h-[42px] flex items-center gap-2 text-[var(--color-gray-400)]">
            <X size={16} /> {t("clear")}
          </button>
        )}
      </div>
    </form>
  )
}

