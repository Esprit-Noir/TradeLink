"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { DeleteTradeButton } from "@/components/trades/DeleteTradeButton"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"

type TradeRowProps = {
  trade: any
  timezone?: string
  baseCurrency?: string
}

export function TradeRow({ trade, timezone = "UTC", baseCurrency = "USD" }: TradeRowProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleRowClick = () => {
    const params = new URLSearchParams(searchParams as any)
    params.set("tradeId", trade.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click when clicking delete
  }

  return (
    <tr 
      onClick={handleRowClick}
      style={{ cursor: "pointer", transition: "background-color 0.15s" }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--gray-900)"}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    >
      <td>
        <div suppressHydrationWarning style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>
          {formatDateWithTimezone(trade.entryAt, timezone)}
        </div>
        <div suppressHydrationWarning style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
          {new Date(trade.entryAt).toLocaleTimeString([], { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontWeight: 600 }}>{trade.symbol}</span>
          {trade.screenshots && trade.screenshots.length > 0 && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-brand-500)" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </td>
      <td>
        <span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
          {trade.instrumentType}
        </span>
      </td>
      <td>
        <span className={`badge ${trade.side === 'LONG' ? 'badge-profit' : 'badge-loss'}`}>
          {trade.side}
        </span>
      </td>
      <td>{Number(trade.quantity).toString()}</td>
      <td>{formatCurrency(Number(trade.entryPrice), baseCurrency, false, 2)}</td>
      <td>{trade.exitPrice ? formatCurrency(Number(trade.exitPrice), baseCurrency, false, 2) : "—"}</td>
      <td style={{ textAlign: "right" }}>
        <span style={{ 
          fontWeight: 600, 
          color: Number(trade.netPnl) > 0 ? "var(--color-profit)" : Number(trade.netPnl) < 0 ? "var(--color-loss)" : "inherit" 
        }}>
          {formatCurrency(Number(trade.netPnl), baseCurrency, true, 2)}
        </span>
      </td>
      <td style={{ textAlign: "right", width: "40px" }} onClick={handleActionClick}>
        <DeleteTradeButton id={trade.id} />
      </td>
    </tr>
  )
}
