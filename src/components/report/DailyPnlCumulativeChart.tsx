"use client"

import { useEffect, useRef, useCallback } from "react"
import { createChart, ColorType, CrosshairMode, HistogramSeries, AreaSeries, type IChartApi } from "lightweight-charts"

interface DailyData {
  date: string
  pnl: number
  cumPnl: number
}

interface DailyPnlCumulativeChartProps {
  data: DailyData[]
  height?: number
}

function fmtMoney(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val)
}

export function DailyPnlCumulativeChart({ data, height = 380 }: DailyPnlCumulativeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const chartData = data.map(d => ({
    time: d.date.split("T")[0],
    pnl: d.pnl,
    cumPnl: d.cumPnl,
  }))

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

    // Histogram for daily P&L
    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    })

    const histData = chartData.map(d => ({
      time: d.time,
      value: d.pnl,
      color: d.pnl >= 0 ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)",
    }))

    histogramSeries.setData(histData)

    // Area for cumulative P&L
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#8B5CF6",
      lineWidth: 2,
      topColor: "rgba(139,92,246,0.15)",
      bottomColor: "transparent",
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#8B5CF6",
      crosshairMarkerBackgroundColor: "#0a0f0c",
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    })

    const cumData = chartData.map(d => ({
      time: d.time,
      value: d.cumPnl,
    }))

    areaSeries.setData(cumData)

    chart.timeScale().fitContent()

    chartRef.current = chart

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

  if (data.length === 0) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height, color: "var(--color-gray-500)" }}>No data</div>
  }

  return (
    <div>
      <div ref={chartContainerRef} style={{ height, borderRadius: 8, overflow: "hidden" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-gray-800)", fontSize: "0.7rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: 12, height: 8, borderRadius: 2, background: "rgba(34,197,94,0.6)" }} />
          <span style={{ color: "var(--color-gray-500)" }}>Daily P&L</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: 12, height: 2, borderRadius: 1, background: "#8B5CF6" }} />
          <span style={{ color: "var(--color-gray-500)" }}>Cumulative</span>
        </div>
      </div>
    </div>
  )
}
