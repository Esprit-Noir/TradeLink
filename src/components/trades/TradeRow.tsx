"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"

type TradeRowProps = {
  trade: any
  timezone?: string
  baseCurrency?: string
  visibleColumns?: Record<string, boolean>
  selected?: boolean
  onSelect?: () => void
}

export function TradeRow({ trade, timezone = "UTC", baseCurrency = "USD", visibleColumns, selected, onSelect }: TradeRowProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const show = (key: string) => visibleColumns ? visibleColumns[key] !== false : true

  const handleRowClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tradeId", trade.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.()
  }

  const pnl = Number(trade.netPnl || 0)

  return (
    <tr
      onClick={handleRowClick}
      style={{ cursor: "pointer", transition: "background-color 0.15s", ...(selected ? { background: "rgba(139,92,246,0.08)" } : {}) }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "var(--gray-900)" }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "transparent" }}
    >
      {visibleColumns && (
        <td style={{ width: "36px" }} onClick={handleSelectClick}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.()}
            onClick={(e) => e.stopPropagation()}
            style={{ accentColor: "var(--color-brand-500)", cursor: "pointer" }}
          />
        </td>
      )}
      {show("entryAt") && (
        <td>
          <div suppressHydrationWarning style={{ fontWeight: 500, color: "var(--color-gray-200)", whiteSpace: "nowrap" }}>
            {formatDateWithTimezone(trade.entryAt, timezone)}
          </div>
          <div suppressHydrationWarning style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
            {new Date(trade.entryAt).toLocaleTimeString([], { timeZone: timezone, hour: "2-digit", minute: "2-digit" })}
          </div>
        </td>
      )}
      {show("symbol") && (
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
      )}
      {show("instrumentType") && (
        <td>
          <span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>{trade.instrumentType}</span>
        </td>
      )}
      {show("side") && (
        <td>
          <span className={`badge ${trade.side === "LONG" ? "badge-profit" : "badge-loss"}`}>{trade.side}</span>
        </td>
      )}
      {show("quantity") && <td>{Number(trade.quantity).toString()}</td>}
      {show("entryPrice") && <td>{formatCurrency(Number(trade.entryPrice), baseCurrency, false, 2)}</td>}
      {show("exitPrice") && <td>{trade.exitPrice ? formatCurrency(Number(trade.exitPrice), baseCurrency, false, 2) : "—"}</td>}
      {show("stopLoss") && <td>{trade.stopLoss ? formatCurrency(Number(trade.stopLoss), baseCurrency, false, 2) : "—"}</td>}
      {show("riskAmount") && <td>{trade.riskAmount ? formatCurrency(Number(trade.riskAmount), baseCurrency, true, 0) : "—"}</td>}
      {show("fees") && <td>{Number(trade.fees) > 0 ? formatCurrency(Number(trade.fees), baseCurrency, true, 2) : "—"}</td>}
      {show("setupTags") && (
        <td>
          {trade.setupTags && trade.setupTags.length > 0 ? (
            <span className="badge badge-neutral" style={{ fontSize: "0.72rem" }}>
              {trade.setupTags[0]}
              {trade.setupTags.length > 1 && <span style={{ opacity: 0.6 }}> +{trade.setupTags.length - 1}</span>}
            </span>
          ) : (
            <span style={{ color: "var(--color-gray-600)" }}>—</span>
          )}
        </td>
      )}
      {show("emotionTags") && (
        <td>
          {trade.emotionTags && trade.emotionTags.length > 0 ? (
            <span style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>{trade.emotionTags.join(", ")}</span>
          ) : (
            <span style={{ color: "var(--color-gray-600)" }}>—</span>
          )}
        </td>
      )}
      {show("netPnl") && (
        <td style={{ textAlign: "right" }}>
          <span style={{ fontWeight: 600, color: pnl > 0 ? "var(--color-profit)" : pnl < 0 ? "var(--color-loss)" : "inherit" }}>
            {formatCurrency(pnl, baseCurrency, true, 2)}
          </span>
        </td>
      )}
      {show("status") && (
        <td>
          <span className="badge badge-neutral" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>{trade.status}</span>
        </td>
      )}
    </tr>
  )
}
