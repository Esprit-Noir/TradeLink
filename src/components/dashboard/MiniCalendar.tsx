"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/ThemeProvider"
import { formatCurrency } from "@/lib/formatters"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

export function MiniCalendar({ dailyPnl, dailyTradeCount = {} }: { dailyPnl: Record<string, number>; dailyTradeCount?: Record<string, number> }) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  if (!mounted) {
    return <div style={{ padding: "0.5rem", minHeight: "350px", background: "transparent" }} />
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDow = firstDay.getDay()

  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })()

  const cells: ({ key: string; day: number; pnl: number; trades: number; isToday: boolean } | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({ key, day: d, pnl: dailyPnl[key] ?? 0, trades: dailyTradeCount[key] ?? 0, isToday: key === todayStr })
  }

  const monthPnl = cells.reduce((sum, c) => c ? sum + c.pnl : sum, 0)
  const greenDays = cells.filter(c => c && c.pnl > 0).length
  const redDays = cells.filter(c => c && c.pnl < 0).length
  const tradingDays = cells.filter(c => c && c.pnl !== 0).length

  const colors = isDark
    ? {
        profitBg: "rgba(16,185,129,0.12)",
        profitBorder: "rgba(16,185,129,0.3)",
        profitText: "var(--color-profit)",
        lossBg: "rgba(239,68,68,0.12)",
        lossBorder: "rgba(239,68,68,0.3)",
        lossText: "var(--color-loss)",
      }
    : {
        profitBg: "rgba(16,185,129,0.1)",
        profitBorder: "rgba(16,185,129,0.25)",
        profitText: "#065f46",
        lossBg: "rgba(239,68,68,0.1)",
        lossBorder: "rgba(239,68,68,0.25)",
        lossText: "#991b1b",
      }

  return (
    <div style={{ padding: "0.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="btn btn-secondary"
            style={{ padding: "0.35rem 0.6rem", display: "flex", alignItems: "center" }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-100)", minWidth: 140, textAlign: "center" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="btn btn-secondary"
            style={{ padding: "0.35rem 0.6rem", display: "flex", alignItems: "center" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.65rem", color: "var(--color-gray-500)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: colors.profitBg, border: `1px solid ${colors.profitBorder}`, display: "inline-block" }} /> Profit
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: colors.lossBg, border: `1px solid ${colors.lossBorder}`, display: "inline-block" }} /> Loss
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--color-gray-200)", border: "1px solid var(--color-gray-300)", display: "inline-block" }} /> No trades
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, border: "2px solid var(--color-brand-500)", display: "inline-block" }} /> Today
          </span>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.4rem", marginBottom: "0.4rem" }}>
        {DAY_NAMES.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "var(--color-gray-500)", padding: "0.4rem 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.4rem" }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} />
          const hasTrades = cell.pnl !== 0
          let bgColor = "var(--color-gray-900)"
          let borderColor = "var(--color-gray-800)"
          let textColor = "var(--color-gray-500)"

          if (cell.pnl > 0) {
            bgColor = colors.profitBg
            borderColor = colors.profitBorder
            textColor = colors.profitText
          } else if (cell.pnl < 0) {
            bgColor = colors.lossBg
            borderColor = colors.lossBorder
            textColor = colors.lossText
          }

          return (
            <div
              key={cell.key}
              onClick={() => router.push(`/calendar`)}
              className="calendar-cell"
              style={{
                background: bgColor,
                border: cell.isToday ? "2px solid var(--color-brand-500)" : `1px solid ${borderColor}`,
                borderRadius: "6px",
                minHeight: "72px",
                padding: "0.5rem 0.6rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: cell.isToday ? "var(--color-brand-400)" : "var(--color-gray-500)", textAlign: "right" }}>
                {cell.day}
              </span>
              {hasTrades ? (
                <>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: textColor, textAlign: "center", textShadow: isDark ? "0 1px 6px rgba(0,0,0,0.4)" : "none" }}>
                    {formatCurrency(cell.pnl, "USD", true, 2)}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: textColor, opacity: 0.7, textAlign: "center" }}>
                    {cell.trades} {cell.trades > 1 ? "trades" : "trade"}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textAlign: "center" }}>—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {tradingDays > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--color-gray-900)", borderRadius: "var(--radius-card)", border: "1px solid var(--color-gray-800)", fontSize: "0.7rem" }}>
          <span style={{ color: "var(--color-profit)", fontWeight: 600 }}>{greenDays} green days</span>
          <span style={{ color: "var(--color-gray-500)" }}>{tradingDays} trading days</span>
          <span style={{ color: monthPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 700, fontSize: "0.8rem" }}>
            {formatCurrency(monthPnl, "USD", true, 2)}
          </span>
          <span style={{ color: "var(--color-gray-500)" }}>{Math.round((greenDays / Math.max(tradingDays, 1)) * 100)}% win days</span>
          <span style={{ color: "var(--color-loss)", fontWeight: 600 }}>{redDays} red days</span>
        </div>
      )}
    </div>
  )
}
