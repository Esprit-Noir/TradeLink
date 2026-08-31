"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

type HeatmapCell = { day: number; hour: number; pnl: number }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function HourHeatmap() {
  const [data, setData] = useState<HeatmapCell[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const searchParams = useSearchParams()
  const qs = searchParams.toString()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/metrics/charts${qs ? `?${qs}` : ""}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setData(d.heatmapData || [])
        setLoading(false)
      })
      .catch((e) => { if (e.name !== "AbortError") setLoading(false) })
    return () => controller.abort()
  }, [qs])

  if (loading) {
    return (
      <div className="chart-card">
        <div className="chart-title">Performance by Hour & Day</div>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">Performance by Hour & Day</div>
        <div className="empty-state" style={{ padding: "1.5rem", height: 200 }}>
          <p style={{ fontSize: "0.85rem" }}>Import trades to see your most profitable trading hours.</p>
        </div>
      </div>
    )
  }

  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.pnl)))

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val)
  }

  const formatHour = (h: number) => `${String(h).padStart(2, "0")}:00`
  const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <div className="chart-card">
      <div className="chart-title">Performance by Hour & Day</div>
      
      <div style={{ display: "flex", flexDirection: "column", marginTop: "1rem", gap: "0.5rem" }}>
        <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "30px repeat(24, 1fr)", gap: "4px", minWidth: 560 }}>
          
          {/* Grid rows for each day (0 = Mon, 6 = Sun) */}
          {DAYS.map((dayLabel, d) => (
            <div key={d} style={{ display: "contents" }}>
              
              {/* Y Axis Label */}
              <div style={{ 
                fontSize: "0.7rem", 
                color: "var(--color-gray-500)", 
                display: "flex", 
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: "6px",
                height: "100%"
              }}>
                {dayLabel}
              </div>

              {/* 24 Hours */}
              {Array.from({ length: 24 }).map((_, h) => {
                const cell = data.find(c => c.day === d && c.hour === h)
                const pnl = cell?.pnl || 0
                const intensity = pnl === 0 ? 0 : Math.max(0.15, Math.abs(pnl) / maxAbs)
                const isProfit = pnl >= 0

                return (
                  <div 
                    key={`${d}-${h}`} 
                    className="heatmap-cell calendar-heatmap-cell"
                    style={{ 
                      aspectRatio: "1/1",
                      borderRadius: "3px",
                      background: pnl === 0 
                        ? "var(--color-gray-800)" 
                        : isProfit ? "var(--color-profit)" : "var(--color-loss)",
                      opacity: pnl === 0 ? 1 : intensity,
                      position: "relative",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        text: `${FULL_DAYS[d]} ${formatHour(h)}\n${formatCurrency(pnl)}`
                      })
                    }}
                    onMouseLeave={() => { setTooltip(null) }}
                  />
                )
              })}
            </div>
          ))}

        </div>

        {/* X Axis Labels */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "30px repeat(24, 1fr)", 
          gap: "4px",
          color: "var(--color-gray-500)", 
          fontSize: "0.7rem",
          marginTop: "4px",
          minWidth: 560
        }}>
          <div /> {/* offset for Y labels */}
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} style={{ textAlign: "center" }}>
              {String(h).padStart(2, "0")}H
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem", fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
        <span>No trades</span>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--color-gray-800)" }} />
        <span>Loss</span>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--color-loss)", opacity: 0.35 }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--color-loss)" }} />
        <span>Profit</span>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--color-profit)", opacity: 0.35 }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--color-profit)" }} />
      </div>

      {/* Custom Tooltip */}
      {tooltip && (
        <div 
          className="heatmap-tooltip"
          style={{ 
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)"
          }}
        >
          {tooltip.text.split("\n").map((line, i) => (
            <div key={i} style={{ color: i === 1 ? "var(--color-gray-100)" : "var(--color-gray-400)" }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
