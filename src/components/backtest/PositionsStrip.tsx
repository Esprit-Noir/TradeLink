"use client"

import type { Candle } from "@/lib/market/types"
import { unrealizedPnl } from "@/lib/market/simulator"
import { fmtPrice } from "@/lib/formatters"
import type { SimTrade } from "./types"
import { X } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

interface Props {
  positions: SimTrade[]
  selectedPositionId: string | null
  currentCandle: Candle | undefined
  symbol: string
  onSelect: (id: string) => void
  onCloseManual: (id: string) => void
  onUpdateLevels: (id: string, levels: { stopLoss: number; takeProfit: number }) => void
  onDeleteTrade: (id: string) => void
  onSaveTrade?: (trade: SimTrade) => void
}

export function PositionsStrip({
  positions,
  selectedPositionId,
  currentCandle,
  symbol,
  onSelect,
  onCloseManual,
  onUpdateLevels,
  onDeleteTrade,
  onSaveTrade,
}: Props) {
  const closedTrades = positions.filter(p => p.exitPrice != null)
  const openPositions = positions.filter(p => p.exitPrice == null)
  const totalPnl = closedTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0)
  const wins = closedTrades.filter(t => (t.netPnl ?? 0) > 0).length
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : null
  const rVals = closedTrades.map(t => t.rMultiple ?? 0)
  const avgR = rVals.length > 0 ? rVals.reduce((s, r) => s + r, 0) / rVals.length : null
  if (positions.length === 0) {
    return (
      <>
        <div className="tz-replay-positions-header">
          <div className="tz-replay-positions-title">
            Positions <span style={{ background: "var(--color-gray-800)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", color: "var(--color-gray-400)" }}>0</span>
          </div>
        </div>
        <div className="tz-replay-positions-table" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gray-400)", fontSize: "0.85rem" }}>
          No open positions.
        </div>
      </>
    )
  }

  return (
    <>
      <div className="tz-replay-positions-header">
        <div className="tz-replay-positions-title">
          Positions
          {openPositions.length > 0 && (
            <span style={{ background: "var(--color-brand-500)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", color: "white" }}>{openPositions.length} open</span>
          )}
          {closedTrades.length > 0 && (
            <span style={{ background: "var(--color-gray-800)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", color: "var(--color-gray-400)" }}>{closedTrades.length} closed</span>
          )}
        </div>
        {closedTrades.length > 0 && (
          <div className="tz-replay-positions-summary">
            <span>P&amp;L: <b style={{ color: totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>{totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}</b></span>
            {winRate !== null && <span>Win: <b style={{ color: winRate >= 50 ? "var(--color-profit)" : "var(--color-loss)" }}>{winRate.toFixed(0)}%</b></span>}
            {avgR !== null && <span>Avg R: <b style={{ color: avgR >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>{avgR >= 0 ? "+" : ""}{avgR.toFixed(2)}R</b></span>}
          </div>
        )}
      </div>
      <div className="tz-replay-positions-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Symbol</th>
              <th>Direction</th>
              <th>Quantity</th>
              <th>Open time</th>
              <th>Entry</th>
              <th>Stop Loss</th>
              <th>Take Profit</th>
              <th>Unrealized P&L</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => {
              const isClosed = p.exitPrice != null
              const pnl = isClosed ? p.netPnl : (currentCandle ? unrealizedPnl(p, currentCandle) : null)
              const isProfit = pnl !== null && pnl >= 0
              const pnlColor = pnl === null ? "" : isProfit ? "tz-replay-td-pnl-up" : "tz-replay-td-pnl-down"
              const active = selectedPositionId === p.id || (selectedPositionId == null && positions[0]?.id === p.id)
              
              let statusText = "Open"
              if (isClosed) {
                statusText = p.saved ? "Saved" : p.saving ? "Saving..." : "Closed"
              }

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  style={{ background: active ? "var(--color-gray-800)" : "transparent", cursor: "pointer", opacity: isClosed ? 0.7 : 1 }}
                >
                  <td>{i + 1}</td>
                  <td>{symbol}</td>
                  <td className={p.side === "long" ? "tz-replay-td-buy" : "tz-replay-td-sell"}>
                    {p.side === "long" ? "BUY" : "SELL"}
                  </td>
                  <td>{fmtQty(p.quantity)}</td>
                  <td>{new Date(p.entryTime * 1000).toLocaleString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{fmtPrice(p.entryPrice)}</td>
                  <td>
                    {isClosed ? (
                      <span>{Number.isFinite(p.stopLoss) ? fmtPrice(p.stopLoss) : "—"}</span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={Number.isFinite(p.stopLoss) ? p.stopLoss : ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdateLevels(p.id, { stopLoss: Number(e.target.value), takeProfit: p.takeProfit })
                        }
                        style={{
                          width: "80px",
                          height: "24px",
                          background: "transparent",
                          border: "1px solid var(--color-gray-300)",
                          borderRadius: "4px",
                          padding: "0 0.4rem",
                          fontSize: "0.75rem",
                          outline: "none",
                          color: "inherit"
                        }}
                      />
                    )}
                  </td>
                  <td>
                    {isClosed ? (
                      <span>{Number.isFinite(p.takeProfit) ? fmtPrice(p.takeProfit) : "—"}</span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={Number.isFinite(p.takeProfit) ? p.takeProfit : ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdateLevels(p.id, { stopLoss: p.stopLoss, takeProfit: Number(e.target.value) })
                        }
                        style={{
                          width: "80px",
                          height: "24px",
                          background: "transparent",
                          border: "1px solid var(--color-gray-300)",
                          borderRadius: "4px",
                          padding: "0 0.4rem",
                          fontSize: "0.75rem",
                          outline: "none",
                          color: "inherit"
                        }}
                      />
                    )}
                  </td>
                  <td className={pnlColor}>
                    {pnl === null ? "—" : formatCurrency(pnl, "USD", true)}
                  </td>
                  <td style={{ color: isClosed && p.saved ? "var(--color-profit)" : "inherit" }}>
                    {isClosed && p.saved ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.72rem", color: "var(--color-profit)" }}>
                        ✓ Saved
                      </span>
                    ) : statusText}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      {isClosed && !p.saved && onSaveTrade && (
                        <button
                          type="button"
                          title="Save to journal"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSaveTrade(p)
                          }}
                          disabled={p.saving}
                          style={{
                            background: "var(--color-gray-800)",
                            border: "1px solid var(--color-gray-700)",
                            color: "var(--color-brand-400)",
                            cursor: "pointer",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          {p.saving ? "..." : "Save"}
                        </button>
                      )}
                      <button
                        type="button"
                        title={isClosed ? "Supprimer le trade" : "Fermer la position"}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isClosed) {
                            onDeleteTrade(p.id)
                          } else {
                            onCloseManual(p.id)
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--color-gray-400)",
                          cursor: "pointer"
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtQty(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 })
}
