"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Save,
  Check,
  Loader2,
  X,
  PlusCircle,
  List,
  Calendar,
  BarChart2
} from "lucide-react"
import type { Candle } from "@/lib/market/types"
import type { BacktestSessionItem, IndicatorsState, SimSide, SimTrade } from "./types"
import { unrealizedPnl } from "@/lib/market/simulator"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"
import { useRouter } from "next/navigation"

interface Props {
  symbol: string
  timeframe: string
  currentCandle: Candle | undefined
  balance: number
  riskPct: number
  positions: SimTrade[]
  closedTrades: SimTrade[]
  indicators: IndicatorsState
  pastSessions: BacktestSessionItem[]
  timezone?: string
  onBalance: (v: number) => void
  onRiskPct: (v: number) => void
  onSetIndicators: (patch: Partial<IndicatorsState>) => void
  onOrder: (side: SimSide) => void
  onSaveTrade: (trade: SimTrade) => void
  backtestAccountId?: string
}

const INDICATOR_TOGGLES: { key: keyof IndicatorsState; label: string }[] = [
  { key: "ema9", label: "EMA 9" },
  { key: "ema20", label: "EMA 20" },
  { key: "ema50", label: "EMA 50" },
  { key: "ema200", label: "EMA 200" },
  { key: "vwap", label: "VWAP" },
  { key: "bb", label: "BB" },
  { key: "rsi", label: "RSI" },
  { key: "volume", label: "Vol" },
]

function fmtPnl(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPrice(v: number): string {
  const a = Math.abs(v)
  if (a >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (a >= 1) return v.toFixed(2)
  if (a >= 0.01) return v.toFixed(4)
  return v.toFixed(6)
}

export function TradePanel({
  symbol,
  timeframe,
  currentCandle,
  balance,
  riskPct,
  positions,
  closedTrades,
  indicators,
  pastSessions,
  timezone = "UTC",
  onBalance,
  onRiskPct,
  onSetIndicators,
  onOrder,
  onSaveTrade,
  backtestAccountId,
}: Props) {
  const router = useRouter()
  const [historyOpen, setHistoryOpen] = useState(true)

  const price = currentCandle?.close ?? null
  const candleTime = currentCandle
    ? formatDateWithTimezone(currentCandle.time * 1000, timezone, true)
    : null

  const floating = positions.reduce((s, p) => s + (currentCandle ? unrealizedPnl(p, currentCandle) : 0), 0)
  const totalClosed = closedTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0)
  const total = closedTrades.length
  const wins = closedTrades.filter((t) => (t.netPnl ?? 0) > 0).length
  const winRate = total ? (wins / total) * 100 : 0
  const rVals = closedTrades.map((t) => t.rMultiple ?? 0)
  const avgR = rVals.length ? rVals.reduce((s, r) => s + r, 0) / rVals.length : 0

  return (
    <>
      <div className="tz-replay-sidebar">
        <div className="tz-replay-sidebar-header">
          <div className="tz-replay-sidebar-title">PLACE ORDER</div>
          <button className="tz-btn-close" style={{ border: "none", padding: "4px" }}><X size={16} /></button>
        </div>

        <div className="tz-replay-order-body">
          <div className="tz-replay-toggle-row">
            <span>Advanced order</span>
            <input type="checkbox" style={{ accentColor: "var(--color-brand-500)", transform: "scale(1.2)" }} defaultChecked />
          </div>

          <div className="tz-replay-radio-group">
            <label className="tz-replay-radio">
              <input type="radio" name="balanceType" defaultChecked /> Current balance
            </label>
            <label className="tz-replay-radio">
              <input type="radio" name="balanceType" /> Initial balance
            </label>
          </div>

          <div className="tz-replay-risk-buttons">
            {[0.5, 1, 2, 3, 5].map((pct) => (
              <button
                key={pct}
                className={`tz-replay-risk-btn ${riskPct === pct ? "active" : ""}`}
                onClick={() => onRiskPct(pct)}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="tz-replay-input-group">
            <label className="tz-replay-input-label">Max risk percent</label>
            <div className="tz-replay-input-wrapper">
              <input
                type="number"
                className="tz-replay-input"
                value={riskPct}
                onChange={(e) => onRiskPct(Number(e.target.value))}
                step={0.1}
              />
              <span className="tz-replay-input-suffix">%</span>
            </div>
          </div>

          <div className="tz-replay-input-group">
            <label className="tz-replay-input-label">Max risk amount</label>
            <div className="tz-replay-input-wrapper">
              <input
                type="number"
                className="tz-replay-input"
                value={((balance * riskPct) / 100).toFixed(2)}
                readOnly
              />
              <span className="tz-replay-input-suffix">USD</span>
            </div>
          </div>

          <div className="tz-replay-row-2">
            <div className="tz-replay-input-group">
              <label className="tz-replay-input-label">Type</label>
              <select className="tz-replay-input">
                <option>Market</option>
              </select>
            </div>
            <div className="tz-replay-input-group">
              <label className="tz-replay-input-label">Market price</label>
              <div className="tz-replay-price-display">
                {price ? fmtPrice(price) : "—"}
                <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginLeft: "8px" }}>{symbol.split("/")[0] || symbol}</span>
              </div>
            </div>
          </div>

          <div className="tz-replay-row-2">
            <div className="tz-replay-input-group">
              <label className="tz-replay-input-label">Profit target</label>
              <div className="tz-replay-input-wrapper">
                <input type="text" className="tz-replay-input" placeholder="Price" />
              </div>
            </div>
            <div className="tz-replay-input-group">
              <label className="tz-replay-input-label">Stop loss <span style={{ color: "var(--color-loss)", fontWeight: "normal" }}>required</span></label>
              <div className="tz-replay-input-wrapper">
                <input type="text" className="tz-replay-input" placeholder="Price" />
              </div>
            </div>
          </div>

          <div className="tz-replay-reward-risk">
            <div>
              <div className="reward">Reward</div>
              <div className="total">— USD</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="risk">Risk</div>
              <div className="total">{((balance * riskPct) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} USD</div>
            </div>
          </div>

          {/* Indicators Toggles */}
          <div className="tz-replay-input-group" style={{ marginTop: "16px" }}>
            <label className="tz-replay-input-label">Indicators</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {INDICATOR_TOGGLES.map((t) => (
                <button
                  key={t.key}
                  className={`tz-replay-risk-btn ${indicators[t.key] ? "active" : ""}`}
                  onClick={() => onSetIndicators({ [t.key]: !indicators[t.key] })}
                  style={{ padding: "4px 8px", fontSize: "0.75rem", minWidth: "45px" }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="tz-replay-order-actions">
          <button className="tz-replay-btn-buy" onClick={() => onOrder("long")} disabled={!price}>Buy</button>
          <button className="tz-replay-btn-sell" onClick={() => onOrder("short")} disabled={!price}>Sell</button>
        </div>
      </div>

      {/* Right vertical tabs */}
      <div className="tz-replay-vertical-tabs">
        <div className="tz-replay-vtab active"><PlusCircle size={20} />Order</div>
        <div 
          className="tz-replay-vtab" 
          onClick={() => {
            if (backtestAccountId) {
              router.push(`/accounts/${backtestAccountId}`)
            } else {
              router.push("/accounts")
            }
          }}
          style={{ cursor: "pointer" }}
        ><List size={20} />Details</div>
        <div className="tz-replay-vtab"><Calendar size={20} />Calendar</div>
        <div className="tz-replay-vtab"><BarChart2 size={20} />Add Chart</div>
      </div>
    </>
  )
}
