"use client"

import type { Candle } from "@/lib/market/types"
import { unrealizedPnl } from "@/lib/market/simulator"
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
}

export function PositionsStrip({
  positions,
  selectedPositionId,
  currentCandle,
  symbol,
  onSelect,
  onCloseManual,
  onUpdateLevels,
}: Props) {
  if (positions.length === 0) {
    return (
      <div className="bt-strip" style={{ padding: "0.5rem 0.7rem" }}>
        <div className="bt-strip-head" style={{ marginBottom: 0 }}>
          <span>Positions ouvertes</span>
          <span className="bt-strip-count">0</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bt-strip" style={{ padding: "0.75rem 1rem" }}>
      <div className="bt-strip-head" style={{ marginBottom: "0.75rem" }}>
        <span>Positions ouvertes</span>
        <span className="bt-strip-count">{positions.length}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-gray-800)", color: "var(--color-gray-500)", textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.5rem 0.5rem" }}>Symbole / Sens</th>
              <th style={{ padding: "0.5rem 0.5rem" }}>Taille (Qty)</th>
              <th style={{ padding: "0.5rem 0.5rem" }}>Prix d'entrée</th>
              <th style={{ padding: "0.5rem 0.5rem", width: "110px" }}>Stop Loss</th>
              <th style={{ padding: "0.5rem 0.5rem", width: "110px" }}>Take Profit</th>
              <th style={{ padding: "0.5rem 0.5rem" }}>PNL non réalisé (USD)</th>
              <th style={{ padding: "0.5rem 0.5rem", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const unrealized = currentCandle ? unrealizedPnl(p, currentCandle) : null
              const isProfit = unrealized !== null && unrealized >= 0
              const pnlColor = unrealized === null ? "var(--color-gray-400)" : isProfit ? "var(--color-profit)" : "var(--color-loss)"
              const active = selectedPositionId === p.id || (selectedPositionId == null && positions[0]?.id === p.id)
              
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  style={{
                    borderBottom: "1px solid var(--color-gray-800)",
                    cursor: "pointer",
                    background: active ? "var(--color-gray-800)" : "transparent",
                    transition: "background 0.1s"
                  }}
                >
                  <td style={{ padding: "0.6rem 0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-gray-200)" }}>{symbol}</span>
                    <span style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.35rem",
                      borderRadius: "4px",
                      background: p.side === "long" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: p.side === "long" ? "var(--color-profit)" : "var(--color-loss)",
                      border: p.side === "long" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)"
                    }}>
                      {p.side === "long" ? "Long" : "Short"}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem 0.5rem", fontWeight: 500, color: "var(--color-gray-300)" }}>
                    {fmtQty(p.quantity)}
                  </td>
                  <td style={{ padding: "0.6rem 0.5rem", fontWeight: 500, color: "var(--color-gray-300)" }}>
                    {fmtPrice(p.entryPrice)}
                  </td>
                  <td style={{ padding: "0.4rem 0.5rem" }}>
                    <input
                      type="number"
                      step="any"
                      value={Number.isFinite(p.stopLoss) ? p.stopLoss : ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateLevels(p.id, { stopLoss: Number(e.target.value), takeProfit: p.takeProfit })
                      }
                      style={{
                        width: "100%",
                        height: "26px",
                        background: "var(--color-gray-950)",
                        border: "1px solid var(--color-gray-800)",
                        borderRadius: "4px",
                        color: "var(--color-gray-200)",
                        padding: "0 0.4rem",
                        fontSize: "0.75rem",
                        outline: "none"
                      }}
                    />
                  </td>
                  <td style={{ padding: "0.4rem 0.5rem" }}>
                    <input
                      type="number"
                      step="any"
                      value={Number.isFinite(p.takeProfit) ? p.takeProfit : ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateLevels(p.id, { stopLoss: p.stopLoss, takeProfit: Number(e.target.value) })
                      }
                      style={{
                        width: "100%",
                        height: "26px",
                        background: "var(--color-gray-950)",
                        border: "1px solid var(--color-gray-800)",
                        borderRadius: "4px",
                        color: "var(--color-gray-200)",
                        padding: "0 0.4rem",
                        fontSize: "0.75rem",
                        outline: "none"
                      }}
                    />
                  </td>
                  <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700, color: pnlColor }}>
                    {unrealized === null ? "—" : (isProfit ? "+" : "") + formatCurrency(unrealized, "USD", true)}
                  </td>
                  <td style={{ padding: "0.4rem 0.5rem", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCloseManual(p.id)
                      }}
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "var(--color-loss)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.1s, color 0.1s"
                      }}
                    >
                      Market
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtQty(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 })
}

function fmtPrice(v: number): string {
  const a = Math.abs(v)
  if (a >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (a >= 1) return v.toFixed(2)
  if (a >= 0.01) return v.toFixed(4)
  return v.toFixed(6)
}
