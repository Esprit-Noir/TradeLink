"use client"

import { memo, useState } from "react"
import { fmtPrice } from "@/lib/formatters"
import {
  Save,
  Loader2,
  PlusCircle,
  List,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Target,
  ShieldAlert,
} from "lucide-react"
import type { Candle } from "@/lib/market/types"
import type { BacktestSessionItem, IndicatorsState, SimSide, SimTrade } from "./types"
import { unrealizedPnl } from "@/lib/market/simulator"
import { formatCurrency } from "@/lib/formatters"
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
  onOrder: (side: SimSide, levels?: { stopLoss?: number; takeProfit?: number }) => void
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

export const TradePanel = memo(function TradePanel({
  symbol,
  currentCandle,
  balance,
  riskPct,
  positions,
  closedTrades,
  indicators,
  pastSessions,
  onRiskPct,
  onSetIndicators,
  onOrder,
  onSaveTrade,
  backtestAccountId,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"order" | "sessions">("order")
  const [customSl, setCustomSl] = useState("")
  const [customTp, setCustomTp] = useState("")

  const price = currentCandle?.close ?? null
  const floating = positions.reduce((s, p) => s + (currentCandle ? unrealizedPnl(p, currentCandle) : 0), 0)
  const totalClosed = closedTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0)
  const total = closedTrades.length
  const wins = closedTrades.filter((t) => (t.netPnl ?? 0) > 0).length
  const winRate = total ? (wins / total) * 100 : 0
  const rVals = closedTrades.map((t) => t.rMultiple ?? 0)
  const avgR = rVals.length ? rVals.reduce((s, r) => s + r, 0) / rVals.length : 0
  const riskAmount = (balance * riskPct) / 100

  const handlePlaceOrder = (side: SimSide) => {
    const sl = parseFloat(customSl)
    const tp = parseFloat(customTp)
    onOrder(side, {
      stopLoss: Number.isFinite(sl) && sl > 0 ? sl : undefined,
      takeProfit: Number.isFinite(tp) && tp > 0 ? tp : undefined,
    })
    setCustomSl("")
    setCustomTp("")
  }

  return (
    <>
      <div className="tz-replay-sidebar">
        {/* Session Stats Bar */}
        <div className="tz-sidebar-stats">
          <div className="tz-sidebar-stat">
            <span className="tz-sidebar-stat-label">Balance</span>
            <span className="tz-sidebar-stat-value">{formatCurrency(balance, "USD")}</span>
          </div>
          <div className="tz-sidebar-stat-divider" />
          <div className="tz-sidebar-stat">
            <span className="tz-sidebar-stat-label">P&amp;L</span>
            <span
              className={`tz-sidebar-stat-value ${total === 0 ? "" : totalClosed >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}
            >
              {total > 0 ? formatCurrency(totalClosed, "USD", true) : "—"}
            </span>
          </div>
          <div className="tz-sidebar-stat-divider" />
          <div className="tz-sidebar-stat">
            <span className="tz-sidebar-stat-label">Win%</span>
            <span className={`tz-sidebar-stat-value ${total > 0 ? (winRate >= 50 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]") : ""}`}>
              {total > 0 ? `${winRate.toFixed(0)}%` : "—"}
            </span>
          </div>
          <div className="tz-sidebar-stat-divider" />
          <div className="tz-sidebar-stat">
            <span className="tz-sidebar-stat-label">Avg R</span>
            <span className={`tz-sidebar-stat-value ${total > 0 ? (avgR >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]") : ""}`}>
              {total > 0 ? `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—"}
            </span>
          </div>
        </div>

        {/* Tab Header */}
        <div className="tz-replay-sidebar-header">
          <div className="tz-replay-sidebar-tabs">
            <button
              className={`tz-sidebar-tab ${activeTab === "order" ? "active" : ""}`}
              onClick={() => setActiveTab("order")}
            >
              <TrendingUp size={13} /> Order
            </button>
            <button
              className={`tz-sidebar-tab ${activeTab === "sessions" ? "active" : ""}`}
              onClick={() => setActiveTab("sessions")}
            >
              <BarChart2 size={13} /> History
            </button>
          </div>
        </div>

        {activeTab === "order" ? (
          <div className="tz-replay-order-body">
            {/* Risk % quick select */}
            <div className="tz-replay-input-group">
              <label className="tz-replay-input-label">Risk per trade</label>
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
            </div>

            {/* Risk Amount + Market Price */}
            <div className="tz-replay-row-2">
              <div className="tz-replay-input-group">
                <label className="tz-replay-input-label">Max risk</label>
                <div className="tz-replay-input-wrapper">
                  <input
                    type="number"
                    className="tz-replay-input text-[var(--color-loss)] font-semibold"
                    value={riskAmount.toFixed(2)}
                    readOnly
                  />
                  <span className="tz-replay-input-suffix">USD</span>
                </div>
              </div>
              <div className="tz-replay-input-group">
                <label className="tz-replay-input-label">Market price</label>
                <div className="tz-replay-price-display">
                  <span className="tabular-nums font-bold">
                    {price ? fmtPrice(price) : "—"}
                  </span>
                  <span className="text-[0.65rem] text-[var(--color-gray-500)]">
                    {symbol.split("/")[0] || symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom TP / SL */}
            <div className="tz-replay-row-2">
              <div className="tz-replay-input-group">
                <label className="tz-replay-input-label flex items-center gap-1">
                  <Target size={11} className="text-[var(--color-profit)]" />
                  Take Profit
                </label>
                <div className="tz-replay-input-wrapper">
                  <input
                    type="number"
                    step="any"
                    className="tz-replay-input tz-input-profit"
                    placeholder="Auto (ATR)"
                    value={customTp}
                    onChange={(e) => setCustomTp(e.target.value)}
                  />
                </div>
              </div>
              <div className="tz-replay-input-group">
                <label className="tz-replay-input-label flex items-center gap-1">
                  <ShieldAlert size={11} className="text-[var(--color-loss)]" />
                  Stop Loss
                </label>
                <div className="tz-replay-input-wrapper">
                  <input
                    type="number"
                    step="any"
                    className="tz-replay-input tz-input-loss"
                    placeholder="Auto (ATR)"
                    value={customSl}
                    onChange={(e) => setCustomSl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Indicators */}
            <div className="tz-replay-input-group">
              <label className="tz-replay-input-label">Indicators</label>
              <div className="flex flex-wrap gap-1.5">
                {INDICATOR_TOGGLES.map((t) => (
                  <button
                    key={t.key}
                    className={`tz-replay-risk-btn px-2 py-1 text-[0.72rem] min-w-[42px] ${indicators[t.key] ? "active" : ""}`}
                    onClick={() => onSetIndicators({ [t.key]: !indicators[t.key] })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Floating P&L for open positions */}
            {positions.length > 0 && (
              <div className="tz-sidebar-floating">
                <span className="tz-sidebar-stat-label">Floating P&amp;L ({positions.length} open)</span>
                <span className={`font-bold text-[0.9rem] ${floating >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
                  {formatCurrency(floating, "USD", true)}
                </span>
              </div>
            )}

            {/* Unsaved trades — quick save list */}
            {closedTrades.filter(t => !t.saved && !t.saving).length > 0 && (
              <div className="tz-sidebar-unsaved">
                <div className="tz-sidebar-stat-label mb-1.5">
                  Unsaved ({closedTrades.filter(t => !t.saved).length})
                </div>
                {closedTrades.filter(t => !t.saved).slice(0, 3).map(t => (
                  <div key={t.id} className="tz-unsaved-row">
                    <span className={t.side === "long" ? "tz-badge-buy" : "tz-badge-sell"}>
                      {t.side === "long" ? "BUY" : "SELL"}
                    </span>
                    <span className="tabular-nums text-[0.8rem]">
                      {t.netPnl != null ? formatCurrency(t.netPnl, "USD", true) : "—"}
                    </span>
                    <button
                      className="tz-unsaved-save-btn"
                      onClick={() => onSaveTrade(t)}
                      disabled={t.saving}
                      title="Save to journal"
                    >
                      {t.saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="tz-replay-order-body">
            {pastSessions.length === 0 ? (
              <div className="text-[var(--color-gray-500)] text-[0.82rem] text-center pt-8 leading-relaxed">
                No past sessions yet.<br />Place and save trades to<br />build your history.
              </div>
            ) : (
              <div className="backtest-past-list">
                {pastSessions.map((s) => (
                  <div key={s.id} className="backtest-past-row">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-[0.82rem]">{s.symbol}</strong>
                        <span className="tz-tf-badge">{s.timeframe}</span>
                      </div>
                      <div className="backtest-past-sub">
                        {s.tradesCount} trade{s.tradesCount !== 1 ? "s" : ""}
                        {s.closedPnl != null && (
                          <span className={`ml-2 font-semibold ${s.closedPnl >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
                            {s.closedPnl >= 0 ? "+" : ""}{s.closedPnl.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buy / Sell Buttons */}
        <div className="tz-replay-order-actions">
          <button
            className="tz-replay-btn-buy"
            onClick={() => handlePlaceOrder("long")}
            disabled={!price}
          >
            <TrendingUp size={15} />
            Buy / Long
          </button>
          <button
            className="tz-replay-btn-sell"
            onClick={() => handlePlaceOrder("short")}
            disabled={!price}
          >
            <TrendingDown size={15} />
            Sell / Short
          </button>
        </div>
      </div>

      {/* Right vertical tabs */}
      <div className="tz-replay-vertical-tabs">
        <div
          className={`tz-replay-vtab ${activeTab === "order" ? "active" : ""}`}
          onClick={() => setActiveTab("order")}
        >
          <PlusCircle size={20} />Order
        </div>
        <div
          className="tz-replay-vtab cursor-pointer"
          onClick={() => {
            if (backtestAccountId) {
              router.push(`/accounts/${backtestAccountId}`)
            } else {
              router.push("/accounts")
            }
          }}
        >
          <List size={20} />Details
        </div>
      </div>
    </>
  )
})
