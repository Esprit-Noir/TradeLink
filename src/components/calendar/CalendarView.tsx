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
    days.push(<div key={`empty-${i}`} style={{ background: "transparent", border: "none" }}></div>)
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
    let borderColor = "var(--color-gray-800)"
    let textColor = "var(--color-gray-400)"

    // Flat Color logic (No Glassmorphism)
    if (pnl !== undefined) {
      if (pnl > 0) {
        bgColor = "#064e3b" // solid dark green
        borderColor = "#047857"
        textColor = "#34d399" // light green for text
      } else if (pnl < 0) {
        bgColor = "#7f1d1d" // solid dark red
        borderColor = "#b91c1c"
        textColor = "#f87171" // light red for text
      } else {
        textColor = "var(--color-gray-300)"
      }
    }

    days.push(
      <div 
        key={i} 
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: "8px",
          minHeight: "100px",
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: pnl !== undefined ? "pointer" : "default",
        }}
        onMouseEnter={(e) => {
          if (pnl !== undefined) {
            e.currentTarget.style.transform = "scale(1.05)"
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"
            e.currentTarget.style.zIndex = "10"
          }
        }}
        onMouseLeave={(e) => {
          if (pnl !== undefined) {
            e.currentTarget.style.transform = "scale(1)"
            e.currentTarget.style.boxShadow = "none"
            e.currentTarget.style.zIndex = "1"
          }
        }}
      >
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-gray-500)", alignSelf: "flex-end" }}>
          {i}
        </span>
        
        {pnl !== undefined && (
          <div style={{ textAlign: "center", marginTop: "auto" }}>
            <span style={{ 
              display: "block",
              fontWeight: 700, 
              fontSize: "1.1rem", 
              color: textColor,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)"
            }}>
              {pnl > 0 ? "+" : ""}${Number(pnl).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>{monthNames[month]} {year}</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={prevMonth} className="btn btn-outline">← Prev</button>
          <button onClick={nextMonth} className="btn btn-outline">Next →</button>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(7, 1fr)", 
        gap: "0.5rem",
        marginBottom: "1rem"
      }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} style={{ textAlign: "center", fontWeight: 600, color: "var(--color-gray-500)", fontSize: "0.85rem", padding: "0.5rem 0" }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(7, 1fr)", 
        gap: "0.75rem" 
      }}>
        {days}
      </div>
    </div>
  )
}
