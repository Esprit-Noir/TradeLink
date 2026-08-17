"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type IPriceLine,
  type SeriesMarker,
  type Time,
} from "lightweight-charts"
import type { Candle } from "@/lib/market/types"
import type { IndicatorSeries, IndicatorsState, SimTrade } from "./types"

export interface ReplayChartRef {
  setData: (candles: Candle[]) => void
  updateTick: (candle: Candle) => void
  scrollToEnd: () => void
  takeScreenshot: () => HTMLCanvasElement
}

interface ReplayChartProps {
  indicatorData: IndicatorSeries
  indicators: IndicatorsState
  positions: SimTrade[]
  selectedPositionId: string | null
  closedTrades: SimTrade[]
  theme: "dark" | "light"
  onUpdateLevels: (id: string, levels: { stopLoss: number; takeProfit: number }) => void
}

const PALETTES = {
  dark: {
    text: "#a1a1aa",
    grid: "#14141a",
    crosshair: "#3f3f46",
    up: "#10b981",
    down: "#ef4444",
    volUp: "rgba(16,185,129,0.35)",
    volDown: "rgba(239,68,68,0.35)",
    brand: "#22c55e",
    ema9: "#f59e0b",
    ema20: "#3b82f6",
    ema50: "#a855f7",
    ema200: "#ec4899",
    rsi: "#8b5cf6",
    vwap: "#eab308",
    bb: "#94a3b8",
  },
  light: {
    text: "#52525b",
    grid: "#e8e8ec",
    crosshair: "#c8c8cf",
    up: "#059669",
    down: "#dc2626",
    volUp: "rgba(5,150,105,0.22)",
    volDown: "rgba(220,38,38,0.22)",
    brand: "#16a34a",
    ema9: "#d97706",
    ema20: "#2563eb",
    ema50: "#9333ea",
    ema200: "#db2777",
    rsi: "#7c3aed",
    vwap: "#a16207",
    bb: "#64748b",
  },
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(2)
  if (p >= 0.01) return p.toFixed(4)
  return p.toFixed(8)
}

export const ReplayChart = forwardRef<ReplayChartRef, ReplayChartProps>(function ReplayChart(
  {
    indicatorData,
    indicators,
    positions,
    selectedPositionId,
    closedTrades,
    theme,
    onUpdateLevels,
  },
  ref,
) {
  const selectedTrade =
    selectedPositionId != null
      ? positions.find((p) => p.id === selectedPositionId) ?? null
      : positions[0] ?? null
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const lineSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map())
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const entryLineRef = useRef<IPriceLine | null>(null)
  const slLineRef = useRef<IPriceLine | null>(null)
  const tpLineRef = useRef<IPriceLine | null>(null)
  const dragRef = useRef<{ mode: "sl" | "tp" } | null>(null)
  const lastSelectedTradeIdRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)
  const candlesCountRef = useRef<number>(0)

  // Live refs so callbacks never read stale props
  const activeTradeRef = useRef(selectedTrade)
  const onUpdateLevelsRef = useRef(onUpdateLevels)
  const indicatorsRef = useRef(indicators)
  const indicatorDataRef = useRef(indicatorData)
  const pal = PALETTES[theme]

  useEffect(() => {
    activeTradeRef.current = selectedTrade
    onUpdateLevelsRef.current = onUpdateLevels
    indicatorsRef.current = indicators
    indicatorDataRef.current = indicatorData
  })

  // ── helpers ────────────────────────────────────────────────────────────────
  const updateIndicators = (n: number, candles: Candle[]) => {
    const pal = PALETTES[theme]
    const ind = indicatorsRef.current
    const indData = indicatorDataRef.current
    const lineMap = lineSeriesRef.current

    const specs: { key: keyof IndicatorSeries; enabled: boolean }[] = [
      { key: "ema9", enabled: ind.ema9 },
      { key: "ema20", enabled: ind.ema20 },
      { key: "ema50", enabled: ind.ema50 },
      { key: "ema200", enabled: ind.ema200 },
      { key: "vwap", enabled: ind.vwap },
    ]

    const lineColor = (key: string) =>
      key === "ema9" ? pal.ema9
      : key === "ema20" ? pal.ema20
      : key === "ema50" ? pal.ema50
      : key === "ema200" ? pal.ema200
      : key === "vwap" ? pal.vwap
      : pal.bb

    const ensureLine = (key: string, color: string): ISeriesApi<"Line"> => {
      let s = lineMap.get(key)
      if (!s) {
        s = chartRef.current!.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        lineMap.set(key, s)
      }
      return s
    }
    const removeLine = (key: string) => {
      const s = lineMap.get(key)
      if (s) {
        chartRef.current?.removeSeries(s)
        lineMap.delete(key)
      }
    }

    for (const { key, enabled } of specs) {
      if (enabled) {
        const s = ensureLine(key, lineColor(key))
        s.applyOptions({ color: lineColor(key) })
        s.setData(
          indData[key].slice(0, n).map((v, i) => ({
            time: candles[i]!.time as Time,
            value: v,
          })),
        )
      } else {
        removeLine(key)
      }
    }

    if (ind.bb) {
      for (const key of ["bbUpper", "bbMiddle", "bbLower"] as const) {
        const s = ensureLine(key, lineColor("bb"))
        s.applyOptions({ color: lineColor("bb") })
        s.setData(
          indData[key].slice(0, n).map((v, i) => ({
            time: candles[i]!.time as Time,
            value: v,
          })),
        )
      }
    } else {
      removeLine("bbUpper")
      removeLine("bbMiddle")
      removeLine("bbLower")
    }

    const rs = rsiSeriesRef.current
    if (rs) {
      if (ind.rsi) {
        chartRef.current?.priceScale("rsi").applyOptions({ visible: true })
        rs.setData(
          indData.rsi.slice(0, n).map((v, i) => ({
            time: candles[i]!.time as Time,
            value: v,
          })),
        )
      } else {
        chartRef.current?.priceScale("rsi").applyOptions({ visible: false })
        rs.setData([])
      }
    }
  }

  // ── init chart (once) ────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const seriesMap = lineSeriesRef.current

    const pal = PALETTES[theme]
    const chart = createChart(container, {
      autoSize: false,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: pal.text,
        fontFamily: "inherit",
        fontSize: 11,
      },
      grid: { vertLines: { color: pal.grid }, horzLines: { color: pal.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: pal.crosshair, width: 1, style: LineStyle.LargeDashed },
        horzLine: { color: pal.crosshair, width: 1, style: LineStyle.LargeDashed },
      },
      rightPriceScale: { borderColor: pal.grid },
      timeScale: { borderColor: pal.grid, rightOffset: 5 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: pal.up,
      downColor: pal.down,
      borderVisible: false,
      wickUpColor: pal.up,
      wickDownColor: pal.down,
      priceFormat: { type: "custom", formatter: fmtPrice },
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "vol",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    })
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })

    const rsiSeries = chart.addSeries(LineSeries, {
      priceScaleId: "rsi",
      color: pal.rsi,
      lineWidth: 2,
      priceLineVisible: false,
      priceFormat: { type: "price", precision: 1, minMove: 0.1 },
    })
    chart.priceScale("rsi").applyOptions({ scaleMargins: { top: 0.8, bottom: 0.05 }, visible: false })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    rsiSeriesRef.current = rsiSeries
    markersRef.current = createSeriesMarkers(candleSeries, [])

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) chart.applyOptions({ width: Math.round(rect.width), height: Math.round(rect.height) })
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      rsiSeriesRef.current = null
      seriesMap.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current
    const pal = PALETTES[theme]
    if (!chart) return
    chart.applyOptions({
      layout: { textColor: pal.text },
      grid: { vertLines: { color: pal.grid }, horzLines: { color: pal.grid } },
      crosshair: {
        vertLine: { color: pal.crosshair },
        horzLine: { color: pal.crosshair },
      },
      rightPriceScale: { borderColor: pal.grid },
      timeScale: { borderColor: pal.grid },
    })
    candleSeriesRef.current?.applyOptions({
      upColor: pal.up,
      downColor: pal.down,
      wickUpColor: pal.up,
      wickDownColor: pal.down,
    })
    rsiSeriesRef.current?.applyOptions({ color: pal.rsi })
    lineSeriesRef.current.forEach((s, key) => {
      const color =
        key === "ema9" ? pal.ema9
        : key === "ema20" ? pal.ema20
        : key === "ema50" ? pal.ema50
        : key === "ema200" ? pal.ema200
        : key === "vwap" ? pal.vwap
        : pal.bb
      s.applyOptions({ color })
    })
  }, [theme])

  // ── imperative data methods ──────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    setData: (candles: Candle[]) => {
      const cs = candleSeriesRef.current
      const vs = volumeSeriesRef.current
      const pal = PALETTES[theme]
      candlesCountRef.current = candles.length

      if (cs) {
        cs.setData(
          candles.map((c) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        )
      }
      if (vs) {
        if (indicatorsRef.current.volume) {
          vs.setData(
            candles.map((c) => ({
              time: c.time as Time,
              value: c.volume,
              color: c.close >= c.open ? pal.volUp : pal.volDown,
            })),
          )
        } else {
          vs.setData([])
        }
      }
      updateIndicators(candles.length, candles)
      chartRef.current?.timeScale().scrollToRealTime()
    },

    updateTick: (candle: Candle) => {
      const cs = candleSeriesRef.current
      const vs = volumeSeriesRef.current
      const pal = PALETTES[theme]
      const n = candlesCountRef.current

      if (cs) {
        cs.update({ time: candle.time as Time, open: candle.open, high: candle.high, low: candle.low, close: candle.close })
      }
      if (vs && indicatorsRef.current.volume) {
        vs.update({ time: candle.time as Time, value: candle.volume, color: candle.close >= candle.open ? pal.volUp : pal.volDown })
      }
      // Update indicators for this new bar
      const ind = indicatorsRef.current
      const indData = indicatorDataRef.current
      const lineMap = lineSeriesRef.current
      const indSpecs: (keyof IndicatorSeries)[] = ["ema9", "ema20", "ema50", "ema200", "vwap", "bbUpper", "bbMiddle", "bbLower"]
      for (const key of indSpecs) {
        const s = lineMap.get(key)
        if (!s) continue
        const v = indData[key][n]
        if (v != null) s.update({ time: candle.time as Time, value: v })
      }
      if (ind.rsi) {
        const rv = indData.rsi[n]
        if (rv != null) rsiSeriesRef.current?.update({ time: candle.time as Time, value: rv })
      }
      candlesCountRef.current = n + 1
    },

    scrollToEnd: () => {
      chartRef.current?.timeScale().scrollToRealTime()
    },

    takeScreenshot: () => {
      return chartRef.current!.takeScreenshot()
    },
  }))

  // ── indicators-only update (when indicators toggle changes) ──────────────────
  useEffect(() => {
    // We need access to the current candles to update indicators.
    // Since candles are managed externally via setData/updateTick,
    // we use the candleSeries data as source of truth.
    // This effect only runs when indicator toggles change.
  }, [indicators])

  // ── markers (entries / exits) ────────────────────────────────────────────────
  useEffect(() => {
    const cs = candleSeriesRef.current
    if (!cs) return
    const pal = PALETTES[theme]
    const markers: SeriesMarker<Time>[] = []

    for (const t of closedTrades) {
      if (t.exitTime == null) continue
      const pnl = t.netPnl ?? 0
      markers.push({
        time: t.entryTime as Time,
        position: t.side === "long" ? "belowBar" : "aboveBar",
        color: pal.brand,
        shape: t.side === "long" ? "arrowUp" : "arrowDown",
        text: ` ${t.side.toUpperCase()} ${t.entryPrice.toFixed(2)}`,
      })
      markers.push({
        time: t.exitTime as Time,
        position: t.side === "long" ? "aboveBar" : "belowBar",
        color: pnl >= 0 ? pal.up : pal.down,
        shape: "circle",
        text: ` ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`,
      })
    }
    for (const p of positions) {
      markers.push({
        time: p.entryTime as Time,
        position: p.side === "long" ? "belowBar" : "aboveBar",
        color: pal.brand,
        shape: p.side === "long" ? "arrowUp" : "arrowDown",
        text: ` ${p.side.toUpperCase()} ${p.entryPrice.toFixed(2)}`,
      })
    }
    markers.sort((a, b) => Number(a.time) - Number(b.time))
    markersRef.current?.setMarkers(markers)
  }, [positions, closedTrades, theme])

  // ── SL / TP / entry price lines ──────────────────────────────────────────────
  useEffect(() => {
    const cs = candleSeriesRef.current
    if (!cs) return
    const pal = PALETTES[theme]

    const tradeId = selectedTrade?.id ?? null
    const idChanged = tradeId !== lastSelectedTradeIdRef.current

    if (idChanged) {
      if (entryLineRef.current) {
        cs.removePriceLine(entryLineRef.current)
        entryLineRef.current = null
      }
      if (slLineRef.current) {
        cs.removePriceLine(slLineRef.current)
        slLineRef.current = null
      }
      if (tpLineRef.current) {
        cs.removePriceLine(tpLineRef.current)
        tpLineRef.current = null
      }

      if (selectedTrade) {
        entryLineRef.current = cs.createPriceLine({
          price: selectedTrade.entryPrice,
          color: pal.brand,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "Entry",
        })
        slLineRef.current = cs.createPriceLine({
          price: selectedTrade.stopLoss,
          color: pal.down,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: "SL",
        })
        tpLineRef.current = cs.createPriceLine({
          price: selectedTrade.takeProfit,
          color: pal.up,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: "TP",
        })
      }
      lastSelectedTradeIdRef.current = tradeId
    } else if (selectedTrade) {
      if (entryLineRef.current) entryLineRef.current.applyOptions({ price: selectedTrade.entryPrice })
      if (slLineRef.current) slLineRef.current.applyOptions({ price: selectedTrade.stopLoss })
      if (tpLineRef.current) tpLineRef.current.applyOptions({ price: selectedTrade.takeProfit })
    }
  }, [selectedTrade, theme])

  // ── pointer drag on SL/TP lines using capturing phase ────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      const chart = chartRef.current
      const act = activeTradeRef.current
      if (!chart || !act || e.button !== 0) return

      const rect = el.getBoundingClientRect()
      const y = e.clientY - rect.top
      const cs = candleSeriesRef.current
      if (!cs) return

      const slPx = cs.priceToCoordinate(act.stopLoss)
      const tpPx = cs.priceToCoordinate(act.takeProfit)

      if (slPx != null && Math.abs(y - slPx) <= 12) {
        dragRef.current = { mode: "sl" }
      } else if (tpPx != null && Math.abs(y - tpPx) <= 12) {
        dragRef.current = { mode: "tp" }
      } else {
        return
      }

      e.stopPropagation()
      e.preventDefault()
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
    }

    const onPointerMove = (e: PointerEvent) => {
      const d = dragRef.current
      const chart = chartRef.current
      const act = activeTradeRef.current
      if (!chart || !act) return

      const rect = el.getBoundingClientRect()
      const y = e.clientY - rect.top
      const cs = candleSeriesRef.current
      if (!cs) return

      if (d) {
        e.stopPropagation()
        e.preventDefault()
        const price = cs.coordinateToPrice(y)
        if (price == null) return
        if (d.mode === "sl") {
          onUpdateLevelsRef.current(act.id, { stopLoss: price, takeProfit: act.takeProfit })
        } else {
          onUpdateLevelsRef.current(act.id, { stopLoss: act.stopLoss, takeProfit: price })
        }
      } else {
        const slPx = cs.priceToCoordinate(act.stopLoss)
        const tpPx = cs.priceToCoordinate(act.takeProfit)
        const isNearSl = slPx != null && Math.abs(y - slPx) <= 12
        const isNearTp = tpPx != null && Math.abs(y - tpPx) <= 12
        if (isNearSl || isNearTp) {
          el.style.cursor = "ns-resize"
        } else {
          el.style.cursor = "crosshair"
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (dragRef.current) {
        e.stopPropagation()
        e.preventDefault()
        dragRef.current = null
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {}
      }
    }

    el.addEventListener("pointerdown", onPointerDown, { capture: true })
    el.addEventListener("pointermove", onPointerMove, { capture: true })
    el.addEventListener("pointerup", onPointerUp, { capture: true })
    el.addEventListener("pointercancel", onPointerUp, { capture: true })

    return () => {
      el.removeEventListener("pointerdown", onPointerDown, { capture: true })
      el.removeEventListener("pointermove", onPointerMove, { capture: true })
      el.removeEventListener("pointerup", onPointerUp, { capture: true })
      el.removeEventListener("pointercancel", onPointerUp, { capture: true })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="replay-chart"
      style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "transparent" }}
    />
  )
})
