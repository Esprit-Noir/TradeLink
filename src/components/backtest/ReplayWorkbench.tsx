"use client"

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Loader2, RefreshCcw, Save, FileDown, FileText, TriangleAlert, Play, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Share, X } from "lucide-react"
import type { IChartApi } from "lightweight-charts"
import type { Candle, MarketTimeframe } from "@/lib/market/types"
import { MARKET_TIMEFRAMES } from "@/lib/market/types"
import { fetchCandles } from "@/lib/market/client"
import { CFD_SYMBOLS } from "@/lib/market/symbols"
import { ReplayChart } from "./ReplayChart"
import { ReplayControls } from "./ReplayControls"
import { PositionsStrip } from "./PositionsStrip"
import { TradesTimeline } from "./TradesTimeline"

const TradePanel = dynamic(() => import("./TradePanel").then(m => ({ default: m.TradePanel })), { ssr: false })
import { DEFAULT_INDICATORS, newId, type IndicatorsState, type SimSide, type SimTrade } from "./types"
import { atrAt, computeIndicatorSeries } from "./indicators"
import { atrBasedLevels, positionSizeFromRisk, simulateClose } from "@/lib/market/simulator"
import { exportSessionCsv, exportSessionPdf, type BacktestExportTrade } from "@/lib/backtest-export"
import type { BacktestSessionItem } from "./types"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"
import Link from "next/link"

interface SessionMeta {
  symbol: string
  timeframe: MarketTimeframe
  from: number
  to: number
  strategyName: string
}

interface ReplayState {
  meta: SessionMeta
  loading: boolean
  error: string | null
  data: Candle[]
  subData: Candle[]
  currentIndex: number
  playing: boolean
  speed: number
  indicators: IndicatorsState
  positions: SimTrade[]
  selectedPositionId: string | null
  closedTrades: SimTrade[]
  lastClosed: SimTrade | null
  entryMode: SimSide
  balance: number
  riskPct: number
  loadToken: number
}

type Action =
  | { type: "LOAD_START" }
  | { type: "LOADED"; meta: SessionMeta; data: Candle[]; subData: Candle[] }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "ADVANCE"; delta: number }
  | { type: "SET_INDEX"; index: number }
  | { type: "TOGGLE_PLAY" }
  | { type: "SET_SPEED"; speed: number }
  | { type: "SET_INDICATORS"; patch: Partial<IndicatorsState> }
  | { type: "SET_ENTRY_MODE"; mode: SimSide }
  | { type: "UPDATE_BALANCE"; balance: number }
  | { type: "UPDATE_RISK"; riskPct: number }
  | { type: "PLACE_ORDER"; candle: Candle; stopLoss?: number; takeProfit?: number }
  | { type: "UPDATE_LEVELS"; id: string; stopLoss: number; takeProfit: number }
  | { type: "CLOSE_MANUAL"; id: string }
  | { type: "SELECT_POSITION"; id: string }
  | { type: "SET_SCREENSHOT"; id: string; url: string }
  | { type: "SET_TRADE_SAVED"; id: string; saved: boolean }
  | { type: "SET_TRADE_SAVING"; id: string; saving: boolean }
  | { type: "DELETE_TRADE"; id: string }
  | { type: "RESET" }

function closeTrade(
  trade: SimTrade,
  exit: { price: number; time: number; index: number; reason: "sl" | "tp" | "manual" },
): SimTrade {
  const diff = trade.side === "long" ? exit.price - trade.entryPrice : trade.entryPrice - exit.price
  const netPnl = diff * trade.quantity
  const riskPerUnit =
    trade.side === "long" ? trade.entryPrice - trade.stopLoss : trade.stopLoss - trade.entryPrice
  const r = riskPerUnit > 0 ? diff / riskPerUnit : 0
  return {
    ...trade,
    exitPrice: exit.price,
    exitTime: exit.time,
    exitIndex: exit.index,
    reason: exit.reason,
    netPnl,
    rMultiple: r,
    screenshotUrl: null,
  }
}

function advanceTo(state: ReplayState, to: number): ReplayState {
  const clamped = Math.max(0, Math.min(to, state.data.length - 1))
  const atEnd = clamped >= state.data.length - 1

  if (state.positions.length === 0) {
    return { ...state, currentIndex: clamped, playing: state.playing && !atEnd }
  }

  const newlyClosed: SimTrade[] = []
  const remaining: SimTrade[] = []
  for (const pos of state.positions) {
    const res = simulateClose(pos, state.data)
    if (res.closed && res.exitIndex <= clamped) {
      newlyClosed.push(
        closeTrade(pos, {
          price: res.exitPrice,
          time: res.exitTime,
          index: res.exitIndex,
          reason: res.reason,
        }),
      )
    } else {
      remaining.push(pos)
    }
  }

  if (newlyClosed.length === 0) {
    return { ...state, currentIndex: clamped, playing: state.playing && !atEnd }
  }

  const netPnlDelta = newlyClosed.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)

  return {
    ...state,
    currentIndex: clamped,
    positions: remaining,
    selectedPositionId: remaining.some((p) => p.id === state.selectedPositionId)
      ? state.selectedPositionId
      : (remaining[0]?.id ?? null),
    closedTrades: [...newlyClosed, ...state.closedTrades],
    balance: state.balance + netPnlDelta,
    lastClosed: newlyClosed[newlyClosed.length - 1],
    playing: state.playing && !atEnd,
  }
}

function reducer(state: ReplayState, action: Action): ReplayState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null }
    case "LOADED":
      return {
        ...state,
        meta: action.meta,
        data: action.data,
        subData: action.subData,
        currentIndex: 0,
        playing: false,
        positions: [],
        selectedPositionId: null,
        closedTrades: [],
        lastClosed: null,
        loading: false,
        error: null,
        loadToken: state.loadToken + 1,
      }
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error }
    case "ADVANCE":
      return advanceTo(state, state.currentIndex + action.delta)
    case "SET_INDEX":
      return advanceTo(state, action.index)
    case "TOGGLE_PLAY":
      if (state.data.length === 0) return state
      return { ...state, playing: !state.playing }
    case "SET_SPEED":
      return { ...state, speed: action.speed }
    case "SET_INDICATORS":
      return { ...state, indicators: { ...state.indicators, ...action.patch } }
    case "SET_ENTRY_MODE":
      return { ...state, entryMode: action.mode }
    case "UPDATE_BALANCE":
      return { ...state, balance: action.balance }
    case "UPDATE_RISK":
      return { ...state, riskPct: action.riskPct }
    case "PLACE_ORDER": {
      if (state.data.length === 0) return state
      const entryIndex = state.data.findIndex((c) => c.time >= action.candle.time)
      const idx = entryIndex === -1 ? Math.max(0, state.data.length - 1) : entryIndex
      const candle = state.data[idx]
      if (!candle) return state
      const atrValue = atrAt(state.data, idx, 14)
      const levels = atrBasedLevels(state.entryMode, candle.close, atrValue)
      const sl = action.stopLoss ?? levels.sl
      const tp = action.takeProfit ?? levels.tp
      const riskAmount = (state.balance * state.riskPct) / 100
      const quantity = positionSizeFromRisk(state.balance, state.riskPct, candle.close, sl)
      const trade: SimTrade = {
        id: newId(),
        side: state.entryMode,
        entryPrice: candle.close,
        stopLoss: sl,
        takeProfit: tp,
        quantity,
        riskAmount,
        entryTime: candle.time,
        entryIndex: idx,
        exitPrice: null,
        exitTime: null,
        exitIndex: null,
        reason: null,
        netPnl: null,
        rMultiple: null,
        screenshotUrl: null,
        saved: false,
        saving: false,
      }
      return { ...state, positions: [...state.positions, trade], selectedPositionId: trade.id }
    }
    case "UPDATE_LEVELS": {
      return {
        ...state,
        positions: state.positions.map((t) => {
          if (t.id !== action.id) return t
          const riskPerUnit = Math.abs(t.entryPrice - action.stopLoss)
          const quantity = riskPerUnit > 0 ? t.riskAmount / riskPerUnit : t.quantity
          return {
            ...t,
            stopLoss: action.stopLoss,
            takeProfit: action.takeProfit,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : t.quantity,
          }
        }),
      }
    }
    case "SELECT_POSITION":
      return { ...state, selectedPositionId: action.id }
    case "CLOSE_MANUAL": {
      const pos = state.positions.find((t) => t.id === action.id)
      if (!pos) return state
      const candle = state.data[state.currentIndex]
      if (!candle) return state
      const closed = closeTrade(pos, {
        price: candle.close,
        time: candle.time,
        index: state.currentIndex,
        reason: "manual",
      })
      const remaining = state.positions.filter((t) => t.id !== action.id)
      return {
        ...state,
        positions: remaining,
        selectedPositionId:
          state.selectedPositionId === action.id ? (remaining[0]?.id ?? null) : state.selectedPositionId,
        closedTrades: [closed, ...state.closedTrades],
        balance: state.balance + (closed.netPnl ?? 0),
        lastClosed: closed,
      }
    }
    case "SET_SCREENSHOT":
      return {
        ...state,
        closedTrades: state.closedTrades.map((t) => (t.id === action.id ? { ...t, screenshotUrl: action.url } : t)),
        lastClosed: state.lastClosed && state.lastClosed.id === action.id ? { ...state.lastClosed, screenshotUrl: action.url } : state.lastClosed,
      }
    case "SET_TRADE_SAVED":
      return {
        ...state,
        closedTrades: state.closedTrades.map((t) => (t.id === action.id ? { ...t, saved: action.saved, saving: false } : t)),
      }
    case "DELETE_TRADE":
      return {
        ...state,
        closedTrades: state.closedTrades.filter((t) => t.id !== action.id),
      }
    case "SET_TRADE_SAVING":
      return {
        ...state,
        closedTrades: state.closedTrades.map((t) => (t.id === action.id ? { ...t, saving: action.saving } : t)),
      }
    case "RESET":
      return {
        ...state,
        currentIndex: Math.min(INITIAL_WINDOW, Math.max(0, state.data.length - 1)),
        playing: false,
        positions: [],
        selectedPositionId: null,
        closedTrades: [],
        lastClosed: null,
      }
    default:
      return state
  }
}

const INITIAL_STATE: ReplayState = {
  meta: { symbol: "EUR/USD", timeframe: "15m", from: 0, to: 0, strategyName: "" },
  loading: false,
  error: null,
  data: [],
  subData: [],
  currentIndex: 0,
  playing: false,
  speed: 1,
  indicators: {
    ema9: true,
    ema20: false,
    ema50: true,
    ema200: false,
    rsi: false,
    vwap: false,
    bb: false,
    volume: true,
  },
  positions: [],
  selectedPositionId: null,
  closedTrades: [],
  lastClosed: null,
  entryMode: "long",
  balance: 10000,
  riskPct: 1,
  loadToken: 0,
}

/** Number of candles shown at once when a session loads/resets. */
const INITIAL_WINDOW = 120

const DEFAULT_FROM = Math.floor(Date.now() / 1000) - 365 * 86400
const DEFAULT_TO = Math.floor(Date.now() / 1000)

export function ReplayWorkbench({
  initialSymbol,
  pastSessions,
  timezone = "UTC",
  initialCapital = 10000,
  backtestAccountId,
}: {
  initialSymbol?: string
  pastSessions: BacktestSessionItem[]
  timezone?: string
  initialCapital?: number
  backtestAccountId?: string
}) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === "light" ? "light" : "dark"
  const chartRef = useRef<IChartApi | null>(null)
  const processedTradesRef = useRef<Set<string>>(new Set())

  const [fullscreen, setFullscreen] = useState(false)
  const [watchlistCollapsed, setWatchlistCollapsed] = useState(false)

  useEffect(() => {
    const handleToggle = () => setWatchlistCollapsed((v) => !v)
    window.addEventListener("toggle-watchlist", handleToggle)
    return () => window.removeEventListener("toggle-watchlist", handleToggle)
  }, [])

  const [config, setConfig] = useState({
    symbol: initialSymbol ?? "XAU/USD",
    timeframe: "15m" as MarketTimeframe,
    subTf: null as MarketTimeframe | null,
    from: DEFAULT_FROM,
    to: DEFAULT_TO,
    strategyName: "",
  })

  const [state, dispatch] = useReducer(
    reducer,
    INITIAL_STATE,
    (initial) => ({ ...initial, balance: initialCapital })
  )

  useEffect(() => {
    dispatch({ type: "UPDATE_BALANCE", balance: initialCapital })
  }, [initialCapital])

  // ── refs for the playback loop ───────────────────────────────────────────────
  const speedRef = useRef(state.speed)
  const playingRef = useRef(state.playing)
  const indexRef = useRef(state.currentIndex)
  const lenRef = useRef(state.data.length)

  useEffect(() => {
    speedRef.current = state.speed
    playingRef.current = state.playing
    indexRef.current = state.currentIndex
    lenRef.current = state.data.length
  })

  useEffect(() => {
    if (!state.playing) return
    const acc = { v: 0 }
    const iv = setInterval(() => {
      acc.v += speedRef.current
      const step = Math.floor(acc.v)
      acc.v -= step
      if (step <= 0) return
      if (indexRef.current >= lenRef.current - 1) return
      dispatch({ type: "ADVANCE", delta: Math.min(step, lenRef.current - 1 - indexRef.current) })
    }, 100)
    return () => clearInterval(iv)
  }, [state.playing])

  // ── data loading ─────────────────────────────────────────────────────────────
  const load = useCallback(
    async (overrides?: Partial<typeof config>) => {
      const cfg = { ...config, ...overrides }
      setConfig(cfg)
      dispatch({ type: "LOAD_START" })
      try {
        const { symbol, timeframe, subTf, from, to, strategyName } = cfg
        const [main, sub] = await Promise.all([
          fetchCandles({ symbol, timeframe, from, to }),
          subTf ? fetchCandles({ symbol, timeframe: subTf, from, to }) : Promise.resolve(null),
        ])
        if (main.candles.length < 5) {
          dispatch({
            type: "LOAD_ERROR",
            error: `Pas assez de données pour ${symbol} (${main.candles.length} bougies). Vérifiez le symbole ou la période.`,
          })
          return
        }
        dispatch({
          type: "LOADED",
          meta: { symbol, timeframe, from, to, strategyName },
          data: main.candles,
          subData: sub?.candles ?? [],
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : "Échec du chargement des données"
        dispatch({ type: "LOAD_ERROR", error: message })
      }
    },
    [config],
  )

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-reload when the timeframe or period changes (not on symbol keystrokes).
  const autoKey = `${config.timeframe}|${config.to - config.from}`
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoKey])

  // Clear processed trades ref on session reset or symbol load
  useEffect(() => {
    processedTradesRef.current.clear()
  }, [state.loadToken])

  // ── screenshot capture on trade close ────────────────────────────────────────
  useEffect(() => {
    const t = state.lastClosed
    if (!t) return

    // Avoid duplicate toast / screenshot upload for the same trade ID
    if (processedTradesRef.current.has(t.id)) return
    processedTradesRef.current.add(t.id)

    const pnl = t.netPnl ?? 0
    const label = t.reason === "sl" ? "Stop Loss" : t.reason === "tp" ? "Take Profit" : "Clôture manuelle"
    const sym = state.meta.symbol || "—"
    const formattedPnl = formatCurrency(pnl, "USD", true)
    if (pnl >= 0) {
      toast.success(`${label} — ${t.side.toUpperCase()} ${sym}: ${formattedPnl} (R ${t.rMultiple?.toFixed(2)})`)
    } else {
      toast.error(`${label} — ${t.side.toUpperCase()} ${sym}: ${formattedPnl} (R ${t.rMultiple?.toFixed(2)})`)
    }
    ;(async () => {
      const chart = chartRef.current
      if (!chart) return
      const canvas = chart.takeScreenshot()
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) return
      const fd = new FormData()
      fd.append("file", blob, "replay.png")
      try {
        const res = await fetch("/api/upload?filename=replay.png", { method: "POST", body: fd })
        if (!res.ok) return
        const data = await res.json()
        if (data.url) dispatch({ type: "SET_SCREENSHOT", id: t.id, url: data.url })
      } catch {}
    })()
  }, [state.lastClosed, state.meta.symbol])

  // ── derived display ──────────────────────────────────────────────────────────
  const cursorTime = state.data[state.currentIndex]?.time ?? null
  const useSub = !!config.subTf && state.subData.length > 0
  const displayed = useMemo(
    () => useSub
      ? state.subData.filter((c) => cursorTime != null && c.time <= cursorTime)
      : state.data,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useSub, state.subData, state.data, cursorTime]
  )

  const mainInd = useMemo(() => computeIndicatorSeries(state.data), [state.data])
  const subInd = useMemo(() => (config.subTf ? computeIndicatorSeries(state.subData) : null), [state.subData, config.subTf])
  const indicatorData = useSub && subInd ? subInd : mainInd

  const currentCandle = state.data[state.currentIndex]

  // ── actions ──────────────────────────────────────────────────────────────────
  const handleChartReady = useCallback((chart: IChartApi) => {
    chartRef.current = chart
  }, [])

  const handleOrder = useCallback(
    (side: SimSide, levels?: { stopLoss?: number; takeProfit?: number }) => {
      const candle = state.data[state.currentIndex]
      if (!candle) {
        toast.info("Chargement des données en cours…")
        return
      }
      dispatch({ type: "SET_ENTRY_MODE", mode: side })
      dispatch({ type: "PLACE_ORDER", candle, stopLoss: levels?.stopLoss, takeProfit: levels?.takeProfit })
    },
    [state.data, state.currentIndex],
  )

  const handleUpdateLevels = useCallback(
    (id: string, levels: { stopLoss: number; takeProfit: number }) =>
      dispatch({ type: "UPDATE_LEVELS", id, stopLoss: levels.stopLoss, takeProfit: levels.takeProfit }),
    [],
  )

  const handleSaveTrade = useCallback(
    async (trade: SimTrade) => {
      dispatch({ type: "SET_TRADE_SAVING", id: trade.id, saving: true })
      try {
        const res = await fetch("/api/backtest/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session: {
              symbol: state.meta.symbol,
              timeframe: state.meta.timeframe,
              from: state.meta.from,
              to: state.meta.to,
              strategyName: state.meta.strategyName || undefined,
              initialBalance: state.balance,
            },
            trade: {
              side: trade.side,
              symbol: state.meta.symbol,
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice,
              entryAt: trade.entryTime,
              exitAt: trade.exitTime,
              stopLoss: Number.isFinite(trade.stopLoss) && trade.stopLoss > 0 ? trade.stopLoss : undefined,
              takeProfit: Number.isFinite(trade.takeProfit) && trade.takeProfit > 0 ? trade.takeProfit : undefined,
              quantity: trade.quantity,
              riskAmount: Number.isFinite(trade.riskAmount) && trade.riskAmount > 0 ? trade.riskAmount : undefined,
              netPnl: trade.netPnl,
              screenshotUrl: trade.screenshotUrl ?? undefined,
            },
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erreur serveur")
        dispatch({ type: "SET_TRADE_SAVED", id: trade.id, saved: true })
        toast.success(`Trade enregistré dans le journal`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement")
        dispatch({ type: "SET_TRADE_SAVING", id: trade.id, saving: false })
      }
    },
    [state.meta, state.balance],
  )

  const handleSaveAll = useCallback(async () => {
    const unsaved = state.closedTrades.filter((t) => !t.saved && !t.saving)
    if (unsaved.length === 0) {
      toast.info("Tous les trades sont déjà enregistrés")
      return
    }
    for (const t of unsaved) {
      await handleSaveTrade(t)
    }
  }, [state.closedTrades, handleSaveTrade])

  const exportTrades = (): BacktestExportTrade[] =>
    state.closedTrades
      .filter((t) => t.exitPrice != null)
      .reverse()
      .map((t) => ({
        side: t.side,
        symbol: state.meta.symbol,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice!,
        stopLoss: t.stopLoss,
        takeProfit: t.takeProfit,
        quantity: t.quantity,
        entryAt: t.entryTime,
        exitAt: t.exitTime!,
        netPnl: t.netPnl ?? 0,
        rMultiple: t.rMultiple,
      }))

  const handleExportCsv = () => {
    if (state.closedTrades.length === 0) {
      toast.info("Aucun trade à exporter")
      return
    }
    exportSessionCsv(
      {
        symbol: state.meta.symbol,
        timeframe: state.meta.timeframe,
        from: state.meta.from,
        to: state.meta.to,
        strategyName: state.meta.strategyName || undefined,
        initialBalance: state.balance,
      },
      exportTrades(),
    )
  }

  const handleExportPdf = () => {
    if (state.closedTrades.length === 0) {
      toast.info("Aucun trade à exporter")
      return
    }
    exportSessionPdf(
      {
        symbol: state.meta.symbol,
        timeframe: state.meta.timeframe,
        from: state.meta.from,
        to: state.meta.to,
        strategyName: state.meta.strategyName || undefined,
        initialBalance: state.balance,
      },
      exportTrades(),
    )
  }

  const fmtPrice = (v: number | undefined | null) => {
    if (v == null) return "—"
    const a = Math.abs(v)
    if (a >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 })
    if (a >= 1) return v.toFixed(2)
    if (a >= 0.01) return v.toFixed(4)
    return v.toFixed(6)
  }

  const progress = state.data.length > 1 ? (state.currentIndex / (state.data.length - 1)) * 100 : 0

  const currentTime = state.data[state.currentIndex]?.time ?? null

  return (
    <div className="tz-replay-fullscreen">
      {/* ── Top Bar ── */}
      <div className="tz-replay-topbar">
        <div className="tz-replay-topbar-left">
          <Link href="/dashboard" className="tz-replay-logo">
            <img src="/logo-light.png" alt="TradeLink" className="logo-light" style={{ height: "28px", objectFit: "contain" }} />
            <img src="/logo-dark.png" alt="TradeLink" className="logo-dark" style={{ height: "28px", objectFit: "contain" }} />
          </Link>
          {/* Session info badge */}
          {!state.loading && !state.error && (
            <div className="tz-session-info">
              <span className="tz-session-symbol">{state.meta.symbol || config.symbol}</span>
              <span className="tz-session-tf">{state.meta.timeframe || config.timeframe}</span>
            </div>
          )}
        </div>

        <div className="tz-replay-topbar-center">
          <div className="tz-replay-date">
            {currentTime ? formatDateWithTimezone(currentTime * 1000, timezone, true) : "—"}
          </div>
          <div className="tz-replay-timeline-bar" title={`${Math.min(state.currentIndex + 1, state.data.length)} / ${state.data.length} bougies`}>
            <div className="tz-replay-timeline-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: "0.62rem", color: "var(--color-gray-600)", fontVariantNumeric: "tabular-nums" }}>
            {state.data.length > 0 ? `${Math.min(state.currentIndex + 1, state.data.length)} / ${state.data.length} candles` : "Loading…"}
          </div>
        </div>

        <div className="tz-replay-topbar-right">
          <button
            className="tz-btn-close"
            onClick={() => dispatch({ type: "RESET" })}
            title="Réinitialiser la session"
          >
            <RefreshCcw size={14} /> Reset
          </button>
          <button
            className="tz-btn-share"
            onClick={handleSaveAll}
            disabled={state.closedTrades.length === 0}
            title="Enregistrer dans le journal"
            style={{ position: "relative" }}
          >
            <Save size={14} /> Save All
            {state.closedTrades.filter(t => !t.saved).length > 0 && (
              <span className="tz-save-badge">{state.closedTrades.filter(t => !t.saved).length}</span>
            )}
          </button>
          <button className="tz-btn-close" onClick={handleExportPdf}>
            <Share size={14} /> Export
          </button>
          <Link href="/dashboard" className="tz-btn-close" title="Back to Dashboard">
            <X size={16} />
          </Link>
        </div>
      </div>


      {/* ── Main Area ── */}
      <div className="tz-replay-main">
        <div className="tz-replay-content">
          <div className="tz-replay-chart-area">
            {/* Chart Header Tabs */}
            <div className="tz-replay-chart-header">
              <div className="tz-replay-symbol-tab">
                <select
                  value={config.symbol}
                  onChange={(e) => load({ symbol: e.target.value })}
                  style={{ background: "transparent", border: "none", fontWeight: "inherit", fontSize: "inherit", outline: "none", width: "100px", color: "inherit", cursor: "pointer" }}
                >
                  {CFD_SYMBOLS.map((s) => (
                    <option key={s.symbol} value={s.symbol} style={{ color: "black" }}>
                      {s.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className="tz-replay-tf-select"
                value={config.timeframe}
                onChange={(e) => setConfig((c) => ({ ...c, timeframe: e.target.value as MarketTimeframe }))}
              >
                {MARKET_TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* Chart View */}
            <div style={{ flex: 1, position: "relative" }}>
              {state.loading ? (
                <div className="backtest-skeleton">
                  <Loader2 className="spin" size={22} />
                  <span>Chargement {config.symbol} · {config.timeframe}…</span>
                </div>
              ) : state.error ? (
                <div className="backtest-error">
                  <TriangleAlert size={18} />
                  <span>{state.error}</span>
                </div>
              ) : (
                <ReplayChart
                  key={state.loadToken}
                  candles={displayed}
                  indicatorData={indicatorData}
                  indicators={state.indicators}
                  positions={state.positions}
                  selectedPositionId={state.selectedPositionId}
                  closedTrades={state.closedTrades}
                  theme={theme}
                  playbackIndex={state.currentIndex}
                  onChartReady={handleChartReady}
                  onUpdateLevels={handleUpdateLevels}
                />
              )}
            </div>

            {/* Speed Controls */}
            {!state.loading && !state.error && (
              <div className="tz-replay-speed-controls">
                <div className="tz-replay-speed-slider">
                  {state.speed}x
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={state.speed}
                    onChange={(e) => dispatch({ type: "SET_SPEED", speed: Number(e.target.value) })}
                    disabled={state.data.length === 0}
                  />
                </div>
                <div className="tz-replay-play-btns">
                  <button onClick={() => dispatch({ type: "ADVANCE", delta: -1 })} disabled={state.data.length === 0}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                  </button>
                  <button onClick={() => dispatch({ type: "TOGGLE_PLAY" })} disabled={state.data.length === 0}>
                    {state.playing ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                  </button>
                  <button onClick={() => dispatch({ type: "ADVANCE", delta: 1 })} disabled={state.data.length === 0}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="tz-replay-positions">
            <PositionsStrip
              positions={[...state.positions, ...state.closedTrades]}
              selectedPositionId={state.selectedPositionId}
              currentCandle={currentCandle}
              symbol={state.meta.symbol || config.symbol}
              onSelect={(id) => dispatch({ type: "SELECT_POSITION", id })}
              onCloseManual={(id) => dispatch({ type: "CLOSE_MANUAL", id })}
              onDeleteTrade={(id) => dispatch({ type: "DELETE_TRADE", id })}
              onUpdateLevels={handleUpdateLevels}
              onSaveTrade={handleSaveTrade}
            />
          </div>
        </div>

        <TradePanel
          symbol={state.meta.symbol || config.symbol}
          timeframe={state.meta.timeframe}
          currentCandle={currentCandle}
          balance={state.balance}
          riskPct={state.riskPct}
          positions={state.positions}
          closedTrades={state.closedTrades}
          indicators={state.indicators}
          pastSessions={pastSessions}
          timezone={timezone}
          backtestAccountId={backtestAccountId}
          onBalance={(v) => dispatch({ type: "UPDATE_BALANCE", balance: v })}
          onRiskPct={(v) => dispatch({ type: "UPDATE_RISK", riskPct: v })}
          onSetIndicators={(patch) => dispatch({ type: "SET_INDICATORS", patch })}
          onOrder={handleOrder}
          onSaveTrade={handleSaveTrade}
        />
      </div>
    </div>
  )
}
