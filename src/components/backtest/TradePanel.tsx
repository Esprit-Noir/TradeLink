"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Save,
  Check,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react"
import type { Candle } from "@/lib/market/types"
import type { BacktestSessionItem, IndicatorsState, SimSide, SimTrade } from "./types"
import { unrealizedPnl } from "@/lib/market/simulator"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"

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
}: Props) {
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
    <div className="bt-panel">
      {/* ── Prix actuel ── */}
      <div className="bt-price-banner">
        <div className="bt-price-banner-top">
          <span className="bt-label">Prix actuel</span>
          <span className="bt-sub">{symbol} · {timeframe}{candleTime ? ` · ${candleTime}` : ""}</span>
        </div>
        <div className={`bt-price${price == null ? "" : price >= (currentCandle?.open ?? 0) ? " up" : " down"}`}>
          {price == null ? "—" : fmtPrice(price)}
        </div>
      </div>

      {/* ── Capital & risque ── */}
      <div className="bt-section">
        <div className="bt-row">
          <div className="bt-row-icon">
            <Wallet size={13} />
          </div>
          <span className="bt-label">Capital (USD)</span>
          <input
            className="bt-num"
            type="number"
            min={0}
            step={500}
            value={balance}
            onChange={(e) => onBalance(Number(e.target.value))}
          />
        </div>
        <div className="bt-row">
          <div className="bt-row-icon">
            <Activity size={13} />
          </div>
          <span className="bt-label">Risque / trade (%)</span>
          <input
            className="bt-num"
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={riskPct}
            onChange={(e) => onRiskPct(Number(e.target.value))}
          />
        </div>
      </div>

      {/* ── Boutons Achat / Vente ── */}
      <div className="bt-order-btns">
        <button className="bt-sellbtn" onClick={() => onOrder("short")} disabled={!price}>
          <div className="bt-order-btn-left">
            <TrendingDown size={14} />
            <span>Vendre</span>
          </div>
        </button>
        <button className="bt-buybtn" onClick={() => onOrder("long")} disabled={!price}>
          <div className="bt-order-btn-left">
            <TrendingUp size={14} />
            <span>Acheter</span>
          </div>
        </button>
      </div>

      {/* ── Stats session ── */}
      <div className="bt-stats">
        <div className="bt-stat">
          <span>Floating</span>
          <b className={floating >= 0 ? "up" : "down"}>{formatCurrency(floating, "USD", true)}</b>
        </div>
        <div className="bt-stat">
          <span>Clôturé</span>
          <b className={totalClosed >= 0 ? "up" : "down"}>{formatCurrency(totalClosed, "USD", true)}</b>
        </div>
        <div className="bt-stat">
          <span>Win %</span>
          <b>{total ? `${winRate.toFixed(0)}%` : "—"}</b>
        </div>
        <div className="bt-stat">
          <span>R moyen</span>
          <b className={avgR >= 0 ? "up" : "down"}>{avgR != null && total ? `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}` : "—"}</b>
        </div>
        <div className="bt-stat">
          <span>Trades</span>
          <b>{total}</b>
        </div>
      </div>

      {/* ── Indicateurs ── */}
      <div className="bt-section">
        <div className="bt-section-title">Indicateurs</div>
        <div className="bt-toggles">
          {INDICATOR_TOGGLES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`bt-toggle${indicators[key] ? " on" : ""}`}
              onClick={() => onSetIndicators({ [key]: !indicators[key] })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Historique ── */}
      <div className="bt-section bt-grow">
        <div className="bt-section-head">
          <div className="bt-section-title">
            <History size={12} /> Trades clôturés
            <span className="bt-strip-count">{total}</span>
          </div>
          {total > 0 && (
            <button className="bt-chev" onClick={() => setHistoryOpen((o) => !o)}>
              {historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {historyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bt-history"
            >
              {total === 0 ? (
                <div className="bt-empty">Aucun trade clôturé pour l&apos;instant.</div>
              ) : (
                closedTrades.map((t) => {
                  const pnl = t.netPnl ?? 0
                  return (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bt-trade-row"
                    >
                      <div className="bt-trade-main">
                        <span className={`bt-live-badge ${t.side === "long" ? "profit" : "loss"}`}>
                          {t.side === "long" ? "L" : "S"}
                        </span>
                        <span className="bt-reason">{t.reason === "sl" ? "SL" : t.reason === "tp" ? "TP" : "Manuel"}</span>
                        <strong className={pnl >= 0 ? "up" : "down"}>{formatCurrency(pnl, "USD", true)}</strong>
                        <span className="bt-r">
                          R {t.rMultiple != null ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)}` : "—"}
                        </span>
                      </div>
                      <button
                        className={`bt-save ${t.saved ? "saved" : ""}`}
                        onClick={() => onSaveTrade(t)}
                        disabled={t.saved || t.saving}
                        title={t.saved ? "Enregistré dans le journal" : "Enregistrer dans le journal"}
                      >
                        {t.saving ? <Loader2 size={13} className="spin" /> : t.saved ? <Check size={13} /> : <Save size={13} />}
                      </button>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sessions passées ── */}
      {pastSessions.length > 0 && (
        <div className="bt-section">
          <div className="bt-section-title">Sessions passées</div>
          <div className="bt-past">
            {pastSessions.slice(0, 5).map((s) => (
              <div key={s.id} className="bt-past-row">
                <strong>{s.symbol}</strong>
                <span>{s.timeframe}</span>
                <span>{s.tradesCount} trades</span>
                <b className={s.closedPnl != null && s.closedPnl >= 0 ? "up" : "down"}>
                  {s.closedPnl != null ? formatCurrency(s.closedPnl, "USD", true) : "—"}
                </b>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
