"use client"

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { createChart, ColorType, CrosshairMode, AreaSeries, type IChartApi, type ISeriesApi } from "lightweight-charts"
import { MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

interface Trade {
  id: string
  symbol: string
  side: string
  entryPrice: number
  exitPrice: number | null
  entryAt: string
  exitAt: string | null
  netPnl: number | null
}

interface TradeAnnotationsChartProps {
  trades: Trade[]
  className?: string
}

export function TradeAnnotationsChart({ trades, className }: TradeAnnotationsChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

  const chartData = useMemo(() => {
    if (!trades.length) return []
    return trades
      .filter(t => t.entryAt)
      .sort((a, b) => new Date(a.entryAt).getTime() - new Date(b.entryAt).getTime())
      .map(t => ({
        time: t.entryAt.split("T")[0],
        value: t.netPnl ?? 0,
      }))
  }, [trades])

  const initChart = useCallback(() => {
    if (!chartContainerRef.current || chartData.length === 0) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1a1a20" },
        horzLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1a1a20" },
      },
      rightPriceScale: { borderColor: "rgba(42, 42, 51, 0.4)" },
      timeScale: { borderColor: "rgba(42, 42, 51, 0.4)", timeVisible: false },
      handleScroll: { vertTouchDrag: false },
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#00c758",
      lineWidth: 2,
      topColor: "rgba(0,199,88,0.25)",
      bottomColor: "transparent",
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: "#00c758",
      crosshairMarkerBackgroundColor: "#0a0f0c",
    })

    areaSeries.setData(chartData as { time: string; value: number }[])

    chart.timeScale().fitContent()
    chartRef.current = chart
    seriesRef.current = areaSeries

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [chartData])

  useEffect(() => {
    const cleanup = initChart()
    return () => {
      cleanup?.()
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [initChart])

  const sortedTrades = useMemo(() =>
    trades.filter(t => t.entryAt).sort((a, b) => new Date(b.entryAt).getTime() - new Date(a.entryAt).getTime()),
    [trades]
  )

  if (!trades.length) {
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--color-gray-500)", fontSize: "0.85rem" }}>
        No trades to annotate.
      </div>
    )
  }

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div ref={chartContainerRef} style={{ height: 220, width: "100%" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflow: "auto" }}>
        {sortedTrades.slice(0, 20).map(t => {
          const pnl = t.netPnl ?? 0
          const isWin = pnl > 0
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTrade(selectedTrade?.id === t.id ? null : t)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", borderRadius: 6, cursor: "pointer",
                background: selectedTrade?.id === t.id ? "rgba(0,199,88,0.1)" : "transparent",
                border: "none", width: "100%", textAlign: "left",
                transition: "background 0.15s",
              }}
            >
              <MapPin size={12} style={{ color: isWin ? "var(--color-profit)" : "var(--color-loss)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", flexShrink: 0, minWidth: 70 }}>
                {new Date(t.entryAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-gray-200)", flexShrink: 0 }}>
                {t.symbol}
              </span>
              <span style={{
                fontSize: "0.65rem", padding: "1px 5px", borderRadius: 4,
                background: t.side === "LONG" ? "rgba(0,199,88,0.12)" : "rgba(239,68,68,0.12)",
                color: t.side === "LONG" ? "var(--color-profit)" : "var(--color-loss)",
                fontWeight: 600,
              }}>
                {t.side}
              </span>
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, fontVariantNumeric: "tabular-nums",
                color: isWin ? "var(--color-profit)" : "var(--color-loss)", marginLeft: "auto",
              }}>
                {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, "USD", true)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
