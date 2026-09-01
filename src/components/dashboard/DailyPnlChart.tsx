"use client"

import { useEffect, useRef, useCallback } from "react"
import { createChart, ColorType, CrosshairMode, HistogramSeries, type IChartApi } from "lightweight-charts"
import { dayKey } from "@/lib/dates"

interface Trade {
  exitAt: Date | null
  netPnl: number
}

interface DailyPnlChartProps {
  trades: Trade[]
  currency?: string
  timezone?: string
}

export function DailyPnlChart({ trades, currency = "USD", timezone = "UTC" }: DailyPnlChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const dailyPnlMap = trades.reduce((acc, trade) => {
    if (!trade.exitAt) return acc
    const dateStr = dayKey(new Date(trade.exitAt), timezone)
    acc[dateStr] = (acc[dateStr] || 0) + trade.netPnl
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(dailyPnlMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ time: date.split("T")[0], value: pnl }))

  const initChart = useCallback(() => {
    if (!chartContainerRef.current || data.length === 0) return

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

    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    })

    const coloredData = data.map(d => ({
      ...d,
      color: d.value >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)",
    }))

    histogramSeries.setData(coloredData)
    chart.timeScale().fitContent()

    chartRef.current = chart

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [data, currency])

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

  if (data.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-gray-500)" }}>
        No data yet
      </div>
    )
  }

  return <div ref={chartContainerRef} style={{ height: "100%", borderRadius: 8, overflow: "hidden" }} />
}
