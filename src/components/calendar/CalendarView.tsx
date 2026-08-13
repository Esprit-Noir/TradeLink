"use client"

import { useState } from "react"

export function CalendarView({ dailyPnl }: { dailyPnl: Record<string, number> }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Define first day of month and total days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const days = []
  
  // Fill empty days for alignment
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }

  // Fill actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    // Adjust to YYYY-MM-DD local time correctly
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-')

    const pnl = dailyPnl[dateStr]
    
    let bgColor = "var(--color-gray-900)"
    let textColor = "var(--color-gray-400)"

    if (pnl !== undefined) {
      if (pnl > 0) {
        bgColor = "var(--color-profit-muted)"
        textColor = "var(--color-profit)"
      } else if (pnl < 0) {
        bgColor = "var(--color-loss-muted)"
        textColor = "var(--color-loss)"
      } else {
        bgColor = "var(--color-gray-800)"
        textColor = "var(--color-gray-200)"
      }
    }

    days.push(
      <div 
        key={dateStr} 
        style={{
          background: bgColor,
          border: "1px solid var(--color-gray-800)",
          borderRadius: "8px",
          padding: "0.5rem",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>{i}</div>
        {pnl !== undefined && (
          <div style={{ color: textColor, fontWeight: 700, textAlign: "right", fontSize: "0.875rem" }}>
            {pnl > 0 ? "+" : ""}${pnl.toFixed(2)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{monthNames[month]} {year}</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}>&larr; Prev</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}>Next &rarr;</button>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(7, 1fr)", 
        gap: "0.5rem",
        marginBottom: "0.5rem",
        textAlign: "center",
        fontWeight: 600,
        color: "var(--color-gray-500)",
        fontSize: "0.75rem",
        textTransform: "uppercase"
      }}>
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
        {days}
      </div>
    </div>
  )
}
