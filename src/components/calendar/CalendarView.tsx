"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, X, CalendarDays, List, TrendingUp, Target, Activity, Calendar as CalendarIcon, Award } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { formatCurrency } from "@/lib/formatters"
import { motion } from "framer-motion"

type DayDetail = {
  date: string
  dayPnl: number
  trades: {
    id: string
    symbol: string
    side: string
    quantity: number
    entryAt: string
    netPnl: number
    setupTags: string[]
    status: string
  }[]
  journal: {
    mood: string | null
    sleepHours: number | null
    sessionPlan: string | null
    endOfDaySummary: string | null
    rating: number | null
    disciplineChecks: Record<string, boolean> | null
    nightReflection: string | null
  } | null
  propSnapshots: { firmName: string; accountName: string; dailyPnl: number }[]
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const YCELL = 22
const YGAP = 5
const YLABEL_W = 36

const MOOD_ICONS: Record<string, string> = {
  happy: "😊", good: "🙂", neutral: "😐", anxious: "😟", frustrated: "😠", tired: "😴", "": "—",
}

export function CalendarView({
  dailyPnl,
  dailyTradeCount = {},
  propDailyPnl = {},
  accountId
}: {
  dailyPnl: Record<string, number>
  dailyTradeCount?: Record<string, number>
  propDailyPnl?: Record<string, number>
  accountId?: string
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [journalDates, setJournalDates] = useState<string[]>([])
  const [view, setView] = useState<"month" | "year">("month")
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [detail, setDetail] = useState<DayDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!selectedDay) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedDay(null) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [selectedDay])
  const isDark = mounted ? resolvedTheme !== "light" : true

  const colors = isDark
    ? {
        profitBg: "color-mix(in srgb, var(--color-profit) 10%, transparent)",
        profitBorder: "color-mix(in srgb, var(--color-profit) 25%, transparent)",
        profitText: "var(--color-profit)",
        lossBg: "color-mix(in srgb, var(--color-loss) 10%, transparent)",
        lossBorder: "color-mix(in srgb, var(--color-loss) 25%, transparent)",
        lossText: "var(--color-loss)",
        cellBg: "color-mix(in srgb, var(--color-gray-900) 40%, transparent)",
        cellBorder: "var(--color-gray-800)",
        cellText: "var(--color-gray-400)",
        zeroText: "var(--color-gray-500)",
      }
    : {
        profitBg: "color-mix(in srgb, var(--color-profit) 15%, transparent)",
        profitBorder: "color-mix(in srgb, var(--color-profit) 35%, transparent)",
        profitText: "var(--color-profit)",
        lossBg: "color-mix(in srgb, var(--color-loss) 15%, transparent)",
        lossBorder: "color-mix(in srgb, var(--color-loss) 35%, transparent)",
        lossText: "var(--color-loss)",
        cellBg: "rgba(255, 255, 255, 0.5)",
        cellBorder: "#e4e4e7",
        cellText: "#71717a",
        zeroText: "#a1a1aa",
      }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const loadJournalDates = useCallback(async (y: number, m: number) => {
    const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`
    try {
      const res = await fetch(`/api/journal?month=${monthStr}`)
      const data = await res.json()
      if (data.dates) setJournalDates(data.dates)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadJournalDates(year, month)
  }, [year, month, loadJournalDates])

  // Month summary
  const monthSummary = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`
    let total = 0
    let green = 0
    let red = 0
    let count = 0
    let best: { key: string; pnl: number } | null = null
    let worst: { key: string; pnl: number } | null = null
    const days: { key: string; pnl: number }[] = []
    for (const [key, pnl] of Object.entries(dailyPnl)) {
      if (!key.startsWith(prefix)) continue
      total += pnl
      count++
      if (pnl > 0) green++
      if (pnl < 0) red++
      days.push({ key, pnl })
      if (!best || pnl > best.pnl) best = { key, pnl }
      if (!worst || pnl < worst.pnl) worst = { key, pnl }
    }
    return { total, green, red, count, best, worst, avg: count > 0 ? total / count : 0 }
  }, [dailyPnl, year, month])

  // Green streak up to today
  const streak = useMemo(() => {
    const today = new Date()
    const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    let cursor = new Date()
    if ((dailyPnl[keyOf(cursor)] || 0) <= 0) cursor = new Date(cursor.getTime() - 86400000)
    let s = 0
    for (let i = 0; i < 730; i++) {
      const pnl = dailyPnl[keyOf(cursor)]
      if (pnl !== undefined && pnl > 0) s++
      else break
      cursor = new Date(cursor.getTime() - 86400000)
    }
    return s
  }, [dailyPnl])

  // Year stats
  const yearStats = useMemo(() => {
    const prefix = `${year}-`
    let total = 0
    let green = 0
    let count = 0
    for (const [key, pnl] of Object.entries(dailyPnl)) {
      if (!key.startsWith(prefix)) continue
      total += pnl
      count++
      if (pnl > 0) green++
    }
    return { total, green, count }
  }, [dailyPnl, year])

  // Year heatmap grid data (GitHub style)
  const yearHeatmap = useMemo(() => {
    const start = new Date(year, 0, 1)
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1)
    const weeks: { date: string; pnl: number }[][] = []
    const cursor = new Date(start)
    let maxPos = 1
    let maxNeg = 1
    const vals = Object.entries(dailyPnl).filter(([k]) => k.startsWith(`${year}-`))
    for (const [, pnl] of vals) {
      if (pnl > maxPos) maxPos = pnl
      if (pnl < 0 && -pnl > maxNeg) maxNeg = -pnl
    }
    for (let w = 0; w < 54; w++) {
      const week: { date: string; pnl: number }[] = []
      for (let d = 0; d < 7; d++) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`
        const pnl = dailyPnl[key] ?? 0
        const inYear = cursor.getFullYear() === year
        week.push({ date: key, pnl: inYear ? pnl : 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
    }

    // Month label per week (only on the week where the month starts within the year)
    const weekMonthLabels: (string | null)[] = []
    let prevLabel = ""
    for (const week of weeks) {
      const firstInYear = week.find((d) => d.date.startsWith(`${year}-`))
      const label = firstInYear ? MONTH_SHORT[Number(firstInYear.date.slice(5, 7)) - 1] : null
      if (label && label !== prevLabel) weekMonthLabels.push(label)
      else weekMonthLabels.push(null)
      if (label) prevLabel = label
    }

    return { weeks, maxPos, maxNeg, weekMonthLabels }
  }, [dailyPnl, year])

  const heatColor = (pnl: number, maxPos: number, maxNeg: number, inYear: boolean) => {
    if (!inYear) return "transparent"
    if (pnl > 0) return `rgba(16,185,129,${(0.2 + 0.8 * Math.min(1, pnl / maxPos)).toFixed(2)})`
    if (pnl < 0) return `rgba(239,68,68,${(0.2 + 0.8 * Math.min(1, -pnl / maxNeg)).toFixed(2)})`
    return colors.cellBg
  }

  const openDay = async (dateStr: string) => {
    setSelectedDay(dateStr)
    setDetail(null)
    setLoadingDetail(true)
    try {
      const url = accountId ? `/api/calendar/${dateStr}?accountId=${accountId}` : `/api/calendar/${dateStr}`
      const res = await fetch(url)
      const data = await res.json()
      setDetail(data)
    } catch {
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
  })()

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) days.push(<div key={`empty-${i}`} style={{ background: "transparent" }} />)

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
    const pnl = dailyPnl[dateStr]
    const propPnl = propDailyPnl[dateStr]
    const hasJournal = journalDates.includes(dateStr)
    const isToday = dateStr === todayStr

    let bgColor = colors.cellBg
    let borderColor = colors.cellBorder
    let textColor = colors.cellText

    if (pnl !== undefined) {
      if (pnl > 0) {
        bgColor = colors.profitBg
        borderColor = colors.profitBorder
        textColor = colors.profitText
      } else if (pnl < 0) {
        bgColor = colors.lossBg
        borderColor = colors.lossBorder
        textColor = colors.lossText
      } else {
        textColor = colors.zeroText
      }
    }

    days.push(
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: i * 0.015 }}
        className="card-hover relative calendar-day-cell"
        onClick={() => openDay(dateStr)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDay(dateStr) } }}
        role="button"
        tabIndex={0}
        title={pnl !== undefined ? `PnL: ${formatCurrency(Number(pnl), "USD", true)} | Trades: ${dailyTradeCount[dateStr] ?? 0}` : ""}
        style={{
          background: bgColor,
          border: isToday ? "2px solid var(--color-brand-500)" : `1px solid ${borderColor}`,
          borderRadius: "8px",
          minHeight: "96px",
          padding: "0.6rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isToday ? "var(--color-brand-400)" : colors.cellText }}>
            {i}
          </span>
        </div>
        {pnl !== undefined && (
          <div style={{ textAlign: "center", marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ 
              display: "inline-block",
              color: textColor,
              fontWeight: 700,
              fontSize: "1.05rem",
              textShadow: isDark ? "0 2px 10px rgba(0,0,0,0.5)" : "none"
            }}>
              {formatCurrency(Number(pnl), "USD", true)}
            </span>
            {(() => {
              const count = dailyTradeCount[dateStr] ?? 0
              if (count === 0) return null
              return (
                <span style={{ display: "block", fontSize: "0.68rem", opacity: 0.8, color: textColor, fontWeight: 500 }}>
                  {count} {count > 1 ? "trades" : "trade"}
                </span>
              )
            })()}
          </div>
        )}
        {pnl === undefined && (
          <div style={{ marginTop: "auto", textAlign: "center", fontSize: "0.7rem", color: isDark ? "#4c4c58" : "#a1a1aa" }}>
            {isToday ? "Today" : "—"}
          </div>
        )}
        {pnl !== undefined && dailyTradeCount[dateStr] !== undefined && (
          <div style={{ position: "absolute", bottom: "0.25rem", right: "0.4rem", fontSize: "0.65rem", fontWeight: 700, color: "var(--color-gray-500)", opacity: 0.7 }}>
            {dailyTradeCount[dateStr]}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Month KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", width: "100%" }}>
        <div className="kpi-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Stat label="Month P&L" value={formatCurrency(monthSummary.total, "USD", true)} color={monthSummary.total >= 0 ? "var(--color-profit)" : "var(--color-loss)"} size="large" icon={<Activity size={16} />} />
        </div>
        <div className="kpi-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Stat label="Win / Loss Days" value={`${monthSummary.green} / ${monthSummary.red}`} color="var(--color-gray-100)" icon={<Target size={16} />} />
        </div>
        <div className="kpi-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Stat label="Avg / day" value={formatCurrency(monthSummary.avg, "USD", true)} color={monthSummary.avg >= 0 ? "var(--color-profit)" : "var(--color-loss)"} icon={<TrendingUp size={16} />} />
        </div>
        <div className="kpi-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Stat label="Best day" value={monthSummary.best ? formatCurrency(monthSummary.best.pnl, "USD", true) : "—"} color="var(--color-profit)" icon={<Award size={16} />} />
        </div>
        <div className="kpi-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Stat label="Worst day" value={monthSummary.worst ? formatCurrency(monthSummary.worst.pnl, "USD", true) : "—"} color="var(--color-loss)" icon={<CalendarIcon size={16} />} />
        </div>
      </div>

      {/* Calendar Block */}
      <div className="chart-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              onClick={prevMonth}
              className="btn btn-secondary"
              style={{ padding: "0.45rem 0.7rem", display: "flex", alignItems: "center" }}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="btn btn-secondary"
              style={{ padding: "0.45rem 0.7rem", display: "flex", alignItems: "center" }}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{MONTH_NAMES[month]} {year}</h2>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", border: `1px solid ${colors.cellBorder}`, borderRadius: "8px", padding: "0.2rem" }}>
          <button
            onClick={() => setView("month")}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.8rem", borderRadius: "6px",
              background: view === "month" ? colors.cellBorder : "transparent",
              border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              color: view === "month" ? (isDark ? "#ededf0" : "#18181b") : colors.cellText,
            }}
          >
            <CalendarDays size={14} /> Month
          </button>
          <button
            onClick={() => setView("year")}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.8rem", borderRadius: "6px",
              background: view === "year" ? colors.cellBorder : "transparent",
              border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              color: view === "year" ? (isDark ? "#ededf0" : "#18181b") : colors.cellText,
            }}
          >
            <List size={14} /> Year
          </button>
        </div>
      </div>

      {/* Month view */}
      {view === "month" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", marginBottom: "0.25rem" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} style={{ textAlign: "center", fontWeight: 600, color: colors.cellText, fontSize: "0.85rem", padding: "0.5rem 0" }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.6rem" }}>{days}</div>
        </>
      ) : (
        /* Year view */
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 700, color: isDark ? "#ededf0" : "#18181b" }}>{year}</span>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: yearStats.total >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                {formatCurrency(yearStats.total, "USD", true)}
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>
              {yearStats.green} green days · {yearStats.count} trading days
            </div>
          </div>

          <div style={{ overflowX: "auto", paddingBottom: "0.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "fit-content" }}>
              {/* Month labels */}
              <div style={{ display: "flex", gap: YGAP, marginLeft: YLABEL_W }}>
                {yearHeatmap.weekMonthLabels.map((label, wi) => (
                  <div key={wi} style={{ width: YCELL, fontSize: "0.62rem", fontWeight: 600, color: "var(--color-gray-400)", whiteSpace: "nowrap", overflow: "visible" }}>
                    {label || ""}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: "flex", gap: YGAP }}>
                <div style={{ display: "flex", flexDirection: "column", gap: YGAP, marginRight: "6px", width: YLABEL_W }}>
                  {["", "Mon", "", "Wed", "", "Fri", ""].map((wd, i) => (
                    <div key={i} style={{ height: YCELL, fontSize: "0.65rem", color: "var(--color-gray-600)", lineHeight: `${YCELL}px`, textAlign: "right", paddingRight: "6px" }}>{wd}</div>
                  ))}
                </div>
                {yearHeatmap.weeks.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: YGAP }}>
                    {week.map((day, di) => {
                      const inYear = day.date.startsWith(`${year}-`)
                      return (
                        <div
                          key={di}
                          title={`${day.date}: ${formatCurrency(day.pnl, "USD", true)}`}
                          onClick={() => inYear && openDay(day.date)}
                          className={inYear ? "calendar-heatmap-cell" : ""}
                          style={{
                            width: YCELL, height: YCELL, borderRadius: 3, cursor: inYear ? "pointer" : "default",
                            background: heatColor(day.pnl, yearHeatmap.maxPos, yearHeatmap.maxNeg, inYear),
                            opacity: inYear ? 1 : 0,
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem", fontSize: "0.7rem", color: colors.cellText, flexWrap: "wrap" }}>
            <span>Loss</span>
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <div key={`l${t}`} style={{ width: YCELL, height: YCELL, borderRadius: 3, background: `rgba(239,68,68,${(0.25 * t + 0.1).toFixed(2)})` }} />
            ))}
            <div style={{ width: YCELL, height: YCELL, borderRadius: 3, background: colors.cellBg }} />
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <div key={`p${t}`} style={{ width: YCELL, height: YCELL, borderRadius: 3, background: `rgba(16,185,129,${(0.25 * t + 0.1).toFixed(2)})` }} />
            ))}
            <span>Profit</span>
            <span style={{ marginLeft: "0.75rem" }}>Click a day for details</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.7rem", color: colors.cellText, padding: "0 0.25rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: colors.profitBg, border: `1px solid ${colors.profitBorder}`, display: "inline-block" }} /> Profit</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: colors.lossBg, border: `1px solid ${colors.lossBorder}`, display: "inline-block" }} /> Loss</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: colors.cellBg, border: `1px solid ${colors.cellBorder}`, display: "inline-block" }} /> No trades</span>
        <span style={{ marginLeft: "auto" }}>Click a day to view details</span>
      </div>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <div
          onClick={() => setSelectedDay(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="chart-card"
            style={{ maxWidth: 520, width: "100%", maxHeight: "80vh", overflowY: "auto", padding: "1.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
                  {formatDate(selectedDay)}
                </div>
                {detail && (
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: detail.dayPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {formatCurrency(detail.dayPnl, "USD", true)}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/journal/${selectedDay}`)}>Journal</button>
                <button onClick={() => setSelectedDay(null)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-gray-400)" }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {loadingDetail && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className="skeleton" style={{ height: 40 }} />
                <div className="skeleton" style={{ height: 40 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            )}

            {detail && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Trades */}
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.5rem" }}>
                    Trades ({detail.trades.length})
                  </div>
                  {detail.trades.length === 0 ? (
                    <div style={{ fontSize: "0.82rem", color: "var(--color-gray-500)" }}>No trades on this day.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {detail.trades.map((t) => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.6rem", background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
                          <span className={`badge ${t.side === "LONG" ? "badge-profit" : "badge-loss"}`} style={{ fontSize: "0.62rem" }}>{t.side}</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-gray-100)" }}>{t.symbol}</span>
                          {t.setupTags[0] && <span className="badge badge-neutral" style={{ fontSize: "0.65rem" }}>{t.setupTags[0]}</span>}
                          <span style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", marginLeft: "auto" }}>
                            {new Date(t.entryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: t.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                            {formatCurrency(t.netPnl, "USD", true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prop snapshots */}
                {detail.propSnapshots.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.5rem" }}>
                      Prop firm challenges
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {detail.propSnapshots.map((s, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.6rem", background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)", fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--color-gray-200)" }}>{s.firmName} · {s.accountName}</span>
                          <span style={{ fontWeight: 600, color: s.dailyPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                            {formatCurrency(s.dailyPnl, "USD", true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Journal */}
                {detail.journal ? (
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.5rem" }}>
                      Journal {detail.journal.mood && <span style={{ marginLeft: "0.25rem" }}>{MOOD_ICONS[detail.journal.mood] ?? "🙂"}</span>}
                      {detail.journal.sleepHours != null && <span style={{ marginLeft: "0.5rem" }}>😴 {detail.journal.sleepHours}h</span>}
                      {detail.journal.rating !== null && <span style={{ marginLeft: "0.5rem" }}>{"★".repeat(Math.max(0, Math.min(5, detail.journal.rating)))}</span>}
                    </div>
                    {detail.journal.sessionPlan && (
                      <div style={{ fontSize: "0.82rem", color: "var(--color-gray-300)", marginBottom: "0.35rem" }}>
                        <strong style={{ color: "var(--color-gray-400)" }}>Plan: </strong>{detail.journal.sessionPlan}
                      </div>
                    )}
                    {detail.journal.endOfDaySummary && (
                      <div style={{ fontSize: "0.82rem", color: "var(--color-gray-300)" }}>
                        <strong style={{ color: "var(--color-gray-400)" }}>Review: </strong>{detail.journal.endOfDaySummary}
                      </div>
                    )}
                    {detail.journal.disciplineChecks && (() => {
                      const checks = detail.journal.disciplineChecks
                      const vals = Object.values(checks)
                      const done = vals.filter(Boolean).length
                      return vals.length > 0 ? (
                        <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginTop: "0.4rem" }}>
                          <strong style={{ color: "var(--color-gray-400)" }}>Discipline: </strong>
                          <span style={{ color: done === vals.length ? "var(--color-profit)" : done > 0 ? "var(--color-warning)" : "var(--color-gray-500)", fontWeight: 600 }}>
                            {done}/{vals.length}
                          </span>
                        </div>
                      ) : null
                    })()}
                    {detail.journal.nightReflection && (
                      <div style={{ fontSize: "0.82rem", color: "var(--color-gray-300)", marginTop: "0.35rem" }}>
                        <strong style={{ color: "var(--color-gray-400)" }}>Reflection: </strong>{detail.journal.nightReflection}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "var(--color-gray-500)" }}>
                    No journal entry for this day. <a href={`/journal/${selectedDay}`} style={{ color: "var(--color-brand-500)" }}>Create one</a>.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color, size = "normal", icon }: { label: string; value: string; color: string, size?: "normal" | "large", icon?: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: size === "large" ? "1.6rem" : "1.2rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}