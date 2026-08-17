"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
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

interface ReplayChartProps {
  candles: Candle[]
  indicatorData: IndicatorSeries
  indicators: IndicatorsState
  positions: SimTrade[]
  selectedPositionId: string | null
  closedTrades: SimTrade[]
  theme: "dark" | "light"
  playbackIndex?: number
  onChartReady?: (chart: IChartApi) => void
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

export function ReplayChart({
  candles,
  indicatorData,
  indicators,
  positions,
  selectedPositionId,
  closedTrades,
  theme,
  playbackIndex,
  onChartReady,
  onUpdateLevels,
}: ReplayChartProps) {
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
  const lastScrollTimeRef = useRef<number>(0)
  const prevCandleLenRef = useRef<number>(0)

  // Live refs so subscription callbacks never read stale props
  const candlesRef = useRef(candles)
  const activeTradeRef = useRef(selectedTrade)
  const onUpdateLevelsRef = useRef(onUpdateLevels)
  const indicatorsRef = useRef(indicators)

  useEffect(() => {
    candlesRef.current = candles
    activeTradeRef.current = selectedTrade
    onUpdateLevelsRef.current = onUpdateLevels
    indicatorsRef.current = indicators
  })

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
      timeScale: { borderColor: pal.grid, rightOffset: 20 },
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

    onChartReady?.(chart)

    return () => {
      ro.disconnect()
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
    // Rebuild volume colors (colors are per-bar) by re-applying data
    const series = volumeSeriesRef.current
    const cs = candlesRef.current
    if (series && cs.length) {
      const data = cs.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? pal.volUp : pal.volDown,
      }))
      series.setData(data)
    }
  }, [theme])

  // ── candles + volume + indicators ────────────────────────────────────────────
  useEffect(() => {
    const pal = PALETTES[theme]
    const cs = candleSeriesRef.current
    const vs = volumeSeriesRef.current
    const prevLen = prevCandleLenRef.current
    const currLen = candles.length

    // ── Incremental update (playback tick: new candles appended) ─────────────
    // Use update() for each newly added candle to avoid the O(N) setData()
    // overhead on every playback frame. Works for speed=1 and speed>1.
    if (prevLen > 0 && currLen > prevLen && currLen > 0) {
      for (let i = prevLen; i < currLen; i++) {
        const c = candles[i]!
        if (cs) {
          cs.update({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })
        }
        if (vs && indicators.volume) {
          vs.update({ time: c.time as Time, value: c.volume, color: c.close >= c.open ? pal.volUp : pal.volDown })
        }
        // Indicators: append point to each visible line
        const lineMap = lineSeriesRef.current
        const n = i
        const indSpecs: (keyof IndicatorSeries)[] = ["ema9", "ema20", "ema50", "ema200", "vwap", "bbUpper", "bbMiddle", "bbLower"]
        for (const key of indSpecs) {
          const s = lineMap.get(key)
          if (!s) continue
          const v = indicatorData[key][n]
          if (v != null) s.update({ time: c.time as Time, value: v })
        }
        const rs = rsiSeriesRef.current
        if (rs && indicators.rsi) {
          const rv = indicatorData.rsi[n]
          if (rv != null) rs.update({ time: c.time as Time, value: rv })
        }
      }
      prevCandleLenRef.current = currLen
      return
    }

    // ── Full reload (initial load or scrub / reset) ───────────────────────────
    prevCandleLenRef.current = currLen
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
      if (indicators.volume) {
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

    const n = candles.length
    const specs: { key: keyof IndicatorSeries; enabled: boolean }[] = [
      { key: "ema9", enabled: indicators.ema9 },
      { key: "ema20", enabled: indicators.ema20 },
      { key: "ema50", enabled: indicators.ema50 },
      { key: "ema200", enabled: indicators.ema200 },
      { key: "vwap", enabled: indicators.vwap },
    ]
    const bbEnabled = indicators.bb

    const lineColor = (key: string) =>
      key === "ema9" ? pal.ema9
      : key === "ema20" ? pal.ema20
      : key === "ema50" ? pal.ema50
      : key === "ema200" ? pal.ema200
      : key === "vwap" ? pal.vwap
      : pal.bb

    const ensureLine = (key: string, color: string): ISeriesApi<"Line"> => {
      let s = lineSeriesRef.current.get(key)
      if (!s) {
        s = chartRef.current!.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        lineSeriesRef.current.set(key, s)
      }
      return s
    }
    const removeLine = (key: string) => {
      const s = lineSeriesRef.current.get(key)
      if (s) {
        chartRef.current?.removeSeries(s)
        lineSeriesRef.current.delete(key)
      }
    }

    for (const { key, enabled } of specs) {
      if (enabled) {
        const s = ensureLine(key, lineColor(key))
        s.applyOptions({ color: lineColor(key) })
        s.setData(
          indicatorData[key].slice(0, n).map((v, i) => ({
            time: candles[i]!.time as Time,
            value: v,
          })),
        )
      } else {
        removeLine(key)
      }
    }

    if (bbEnabled) {
      for (const key of ["bbUpper", "bbMiddle", "bbLower"] as const) {
        const s = ensureLine(key, lineColor("bb"))
        s.applyOptions({ color: lineColor("bb") })
        s.setData(
          indicatorData[key].slice(0, n).map((v, i) => ({
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
      if (indicators.rsi) {
        chartRef.current?.priceScale("rsi").applyOptions({ visible: true })
        rs.setData(
          indicatorData.rsi.slice(0, n).map((v, i) => ({
            time: candles[i]!.time as Time,
            value: v,
          })),
        )
      } else {
        chartRef.current?.priceScale("rsi").applyOptions({ visible: false })
        rs.setData([])
      }
    }

    // Scroll to newest bar after full reload
    const chart = chartRef.current
    if (chart && candles.length > 0) {
      chart.timeScale().scrollToRealTime()
    }
  }, [candles, indicatorData, indicators, theme])

  // ── scroll to follow playback ─────────────────────────────────────────────────
  // Uses scrollToPosition to keep the current candle in view while always
  // leaving ~15 bars of empty space to the right for context.
  useLayoutEffect(() => {
    const chart = chartRef.current
    if (!chart || candles.length === 0 || playbackIndex == null) return
    const ts = chart.timeScale()
    const totalBars = candles.length
    const idx = Math.min(playbackIndex, totalBars - 1)

    // Work out how many bars fit on screen
    const visRange = ts.getVisibleLogicalRange()
    const windowSize = visRange ? Math.round(visRange.to - visRange.from) : 200
    const rightPad = 15 // bars of empty space kept to the right of current bar

    // The "target" position: current bar should sit windowSize - rightPad from the left edge
    const targetFrom = idx - (windowSize - rightPad)
    ts.setVisibleLogicalRange({
      from: targetFrom,
      to: targetFrom + windowSize,
    })
  }, [playbackIndex])

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
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  )
}
