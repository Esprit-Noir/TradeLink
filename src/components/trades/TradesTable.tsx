// components/trades/TradesTable.tsx
// Client — colonnes configurables, sélection multiple, tri, totaux, pagination
"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { toast } from "sonner"
import { Columns3, Trash2, CheckCheck, ArrowUpDown, ArrowUp, ArrowDown, X, Download, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import { TradeRow } from "@/components/trades/TradeRow"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useTranslations, useLocale } from "next-intl"

export type SerializedTrade = {
  id: string
  symbol: string
  instrumentType: string
  side: string
  quantity: number
  entryPrice: number
  exitPrice: number | null
  stopLoss: number | null
  riskAmount: number | null
  fees: number
  netPnl: number | null
  entryAt: string | Date
  status: string
  setupTags?: string[] | null
  emotionTags?: string[] | null
  screenshots?: { id: string }[]
}

export const TRADE_COLUMNS = [
  { key: "entryAt", label: "Entry Time", default: true, sortable: true },
  { key: "symbol", label: "Symbol", default: true, sortable: true },
  { key: "instrumentType", label: "Instrument", default: true, sortable: false },
  { key: "side", label: "Side", default: true, sortable: true },
  { key: "quantity", label: "Qty", default: true, sortable: true },
  { key: "entryPrice", label: "Entry Price", default: true, sortable: true },
  { key: "exitPrice", label: "Exit Price", default: true, sortable: true },
  { key: "stopLoss", label: "Stop Loss", default: false, sortable: false },
  { key: "riskAmount", label: "Risk $", default: false, sortable: false },
  { key: "fees", label: "Fees", default: false, sortable: false },
  { key: "setupTags", label: "Setup", default: true, sortable: false },
  { key: "emotionTags", label: "Emotions", default: false, sortable: false },
  { key: "netPnl", label: "Net P&L", default: true, sortable: true },
  { key: "status", label: "Status", default: true, sortable: false },
] as const

type Props = {
  trades: SerializedTrade[]
  totals: { count: number; netPnl: number; wins: number; losses: number }
  density: string
  timezone?: string
  baseCurrency?: string
  sortKey: string
  sortDir: string
  currentPage: number
  totalPages: number
  totalTrades: number
  itemsPerPage: number
}

export function TradesTable({
  trades,
  totals,
  density,
  timezone,
  baseCurrency = "USD",
  sortKey,
  sortDir,
  currentPage,
  totalPages,
  totalTrades,
  itemsPerPage,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("TradesTable")
  const locale = useLocale()

  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    return TRADE_COLUMNS.reduce((acc: Record<string, boolean>, c) => ({ ...acc, [c.key]: c.default }), {})
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const columnsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("trades_columns")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setVisible(prev => {
          const next = { ...prev }
          for (const key of Object.keys(parsed)) {
            if (key in next) next[key] = parsed[key]
          }
          return next
        })
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("trades_columns", JSON.stringify(visible))
    } catch {
      // ignore
    }
  }, [visible])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  const toggleColumn = (key: string) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === trades.length && trades.length > 0) return new Set()
      return new Set(trades.map((t) => t.id))
    })
  }

  const handleSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get("sort") === key) {
      params.set("dir", params.get("dir") === "asc" ? "desc" : "asc")
    } else {
      params.set("sort", key)
      params.set("dir", key === "entryAt" ? "desc" : "asc")
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const runBulk = async (action: "delete" | "open" | "close") => {
    if (selectedIds.length === 0) return
    if (action === "delete" && !confirm(t("messages.deleteConfirm", { count: selectedIds.length }))) return
    setBusy(true)
    try {
      const res = await fetch("/api/trades/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success(t("messages.updatedTrades", { count: data.count }))
      setSelected(new Set())
      router.refresh()
    } catch (err) {
      toast.error((err as { message?: string })?.message || t("messages.actionFailed"))
    } finally {
      setBusy(false)
      setBulkOpen(false)
    }
  }

  const exportCsv = async () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    params.delete("tradeId")
    try {
      const res = await fetch(`/api/trades/export?${params.toString()}`)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "trades-export.csv"
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t("messages.exportedCsv"))
    } catch {
      toast.error(t("messages.exportFailed"))
    }
  }

  const exportPdf = async () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    params.delete("tradeId")
    params.set("format", "json")
    try {
      const res = await fetch(`/api/trades/export?${params.toString()}`)
      if (!res.ok) throw new Error("Export failed")
      const { trades: exportTrades } = await res.json() as { trades: SerializedTrade[] }
      
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
      
      doc.setFontSize(18)
      doc.text(t("report.tradesReport"), 40, 40)
      
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(t("report.generatedOn", { date: new Date().toLocaleDateString(locale) }), 40, 55)

      const totalPnl = exportTrades.reduce((sum: number, tr) => sum + Number(tr.netPnl || 0), 0)
      const winRate = exportTrades.length > 0 
        ? ((exportTrades.filter(tr => Number(tr.netPnl || 0) > 0).length / exportTrades.length) * 100).toFixed(1) 
        : 0
      
      doc.setFontSize(12)
      doc.setTextColor(totalPnl >= 0 ? 0 : 200, totalPnl >= 0 ? 150 : 0, 0)
      doc.text(`${t("report.totalPnl")}${totalPnl >= 0 ? '+' : ''}${formatCurrency(totalPnl, baseCurrency)} | ${t("report.winRate")}${winRate}% | ${t("report.trades")}${exportTrades.length}`, 40, 80)

      autoTable(doc, {
        startY: 100,
        head: [["Date", "Symbol", "Side", "Qty", "Entry", "Exit", "P&L", "Status"]],
        body: exportTrades.map((tr) => [
          new Date(tr.entryAt).toLocaleString(),
          tr.symbol,
          tr.side,
          tr.quantity,
          tr.entryPrice || "-",
          tr.exitPrice || "-",
          Number(tr.netPnl || 0).toFixed(2),
          tr.status
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })

      doc.save(`trades-export-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success(t("messages.exportedPdf"))
    } catch (err) {
      console.error(err)
      toast.error(t("messages.exportFailed"))
    }
  }

  const visibleColumns = TRADE_COLUMNS.filter((c) => visible[c.key])
  const pageNetPnl = trades.reduce((s, t) => s + Number(t.netPnl || 0), 0)
  const skip = (currentPage - 1) * itemsPerPage

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {/* Selection */}
        {selectedIds.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.6rem", borderRadius: "8px", background: "color-mix(in srgb, var(--color-brand-500) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-brand-500) 30%, transparent)" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-brand-300)" }}>
              {t("selection.selected", { count: selectedIds.length })}
            </span>
            <button onClick={() => setSelected(new Set())} title={t("actions.clearSelection")} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "var(--color-gray-400)" }}>
              <X size={14} />
            </button>
            <div style={{ display: "flex", gap: "0.35rem", position: "relative" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setBulkOpen((o) => !o)} disabled={busy} style={{ fontSize: "0.78rem" }}>
                {t("actions.bulkActions")}
              </button>
              {bulkOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 20, minWidth: "180px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", padding: "0.35rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => runBulk("open")} disabled={busy} style={{ justifyContent: "flex-start", gap: "0.4rem" }}>
                    <CheckCheck size={14} /> {t("actions.markOpen")}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => runBulk("close")} disabled={busy} style={{ justifyContent: "flex-start", gap: "0.4rem" }}>
                    <CheckCheck size={14} /> {t("actions.markClosed")}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => runBulk("delete")} disabled={busy} style={{ justifyContent: "flex-start", gap: "0.4rem", color: "var(--color-loss)" }}>
                    <Trash2 size={14} /> {t("actions.delete")}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
            {t("selection.matchingFilters", { count: totals.count })}
          </span>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={exportCsv}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            title={t("actions.exportCsv")}
          >
            <Download size={14} /> {t("actions.exportCsv")}
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={exportPdf}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            title={t("actions.exportPdf")}
          >
            <FileText size={14} /> {t("actions.exportPdf")}
          </button>
          {/* Column visibility */}
          <div style={{ position: "relative" }} ref={columnsRef}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setColumnsOpen((o) => !o)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Columns3 size={14} /> {t("actions.columns")}
            </button>
            {columnsOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 20, minWidth: "200px", maxHeight: "320px", overflowY: "auto", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", padding: "0.5rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                {TRADE_COLUMNS.map((c) => (
                  <label key={c.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.4rem", fontSize: "0.82rem", cursor: "pointer", color: "var(--color-gray-200)" }}>
                    <input
                      type="checkbox"
                      checked={!!visible[c.key]}
                      onChange={() => toggleColumn(c.key)}
                      style={{ accentColor: "var(--color-brand-500)" }}
                    />
                    {t(`columns.${c.key}`)}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className={`data-table ${density}`}>
          <thead>
            <tr>
              <th style={{ width: "36px" }}>
                <input
                  type="checkbox"
                  checked={trades.length > 0 && selected.size === trades.length}
                  onChange={toggleSelectAll}
                  style={{ accentColor: "var(--color-brand-500)", cursor: "pointer" }}
                  title="Select all on page"
                />
              </th>
              {visibleColumns.map((c) => (
                <th
                  key={c.key}
                  onClick={c.sortable ? () => handleSort(c.key) : undefined}
                  style={{
                    cursor: c.sortable ? "pointer" : "default",
                    userSelect: "none",
                    textAlign: c.key === "netPnl" ? "right" : "left",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    {t(`columns.${c.key}`)}
                    {c.sortable && (sortKey === c.key ? (
                      sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                    ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} style={{ textAlign: "center", padding: "3rem" }}>
                  <div className="empty-state">
                    <p>{t("empty.noTrades")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              trades.map((t, i) => (
                <TradeRow
                  key={t.id}
                  trade={t}
                  index={i}
                  timezone={timezone}
                  baseCurrency={baseCurrency}
                  visibleColumns={visible}
                  selected={selected.has(t.id)}
                  onSelect={() => toggleSelect(t.id)}
                />
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--color-gray-900)" }}>
              <td colSpan={visibleColumns.length + 1} style={{ textAlign: "right", paddingRight: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-gray-500)", marginRight: "0.5rem" }}>{t("tableFoot.pageTotal")}</span>
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: pageNetPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                  {formatCurrency(pageNetPnl, baseCurrency, true, 2)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Totals strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", padding: "0.75rem 1rem", background: "var(--color-gray-900)", borderRadius: "var(--radius-card)", border: "1px solid var(--color-gray-800)", fontSize: "0.8rem" }}>
        <div>
          <span style={{ color: "var(--color-gray-500)" }}>{t("summary.filteredNetPnl")}</span>
          <strong style={{ color: totals.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
            {formatCurrency(totals.netPnl, baseCurrency, true, 2)}
          </strong>
        </div>
        <div>
          <span style={{ color: "var(--color-gray-500)" }}>{t("summary.winRate")}</span>
          <strong style={{ color: "var(--color-gray-200)" }}>
            {totals.count > 0 ? ((totals.wins / totals.count) * 100).toFixed(1) : "0"}%
          </strong>
          <span style={{ color: "var(--color-gray-600)" }}> ({totals.wins}W / {totals.losses}L)</span>
        </div>
        <div>
          <span style={{ color: "var(--color-gray-500)" }}>{t("summary.avgPnl")}</span>
          <strong style={{ color: totals.count > 0 && totals.netPnl >= 0 ? "var(--color-profit)" : totals.count > 0 ? "var(--color-loss)" : "inherit" }}>
            {totals.count > 0 ? formatCurrency(totals.netPnl / totals.count, baseCurrency, true, 2) : "—"}
          </strong>
        </div>
        {selectedIds.length > 0 && (
          <div>
            <span style={{ color: "var(--color-gray-500)" }}>{t("summary.selectedPnl")}</span>
            <strong style={{ color: "var(--color-gray-200)" }}>
              {formatCurrency(
                trades.filter((t) => selected.has(t.id)).reduce((s, t) => s + Number(t.netPnl || 0), 0),
                baseCurrency,
                true,
                2
              )}
            </strong>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)" }}>
            {t("pagination.showing", { start: skip + 1, end: Math.min(skip + itemsPerPage, totalTrades), total: totalTrades })}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {currentPage > 1 ? (
              <LinkBtn href={pageHref(currentPage - 1, searchParams, pathname)}>{t("pagination.previous")}</LinkBtn>
            ) : (
              <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                {t("pagination.previous")}
              </button>
            )}
            <div style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--color-gray-200)" }}>
              {t("pagination.pageOf", { current: currentPage, total: totalPages })}
            </div>
            {currentPage < totalPages ? (
              <LinkBtn href={pageHref(currentPage + 1, searchParams, pathname)}>{t("pagination.next")}</LinkBtn>
            ) : (
              <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                {t("pagination.next")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LinkBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="btn btn-secondary" style={{ textDecoration: "none", display: "inline-block", padding: "0.5rem 1rem" }}>
      {children}
    </a>
  )
}

function pageHref(page: number, searchParams: URLSearchParams, pathname: string) {
  const params = new URLSearchParams(searchParams.toString())
  params.set("page", String(page))
  return `${pathname}?${params.toString()}`
}
