"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/formatters"
import Link from "next/link"

export function YearHeatmap({ dailyPnl, year }: { dailyPnl: Record<string, number>, year: number }) {
  // Generate all dates for the year
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  
  const days = []
  let current = new Date(startDate)
  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  // Format YYYY-MM-DD
  const formatKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  // Month labels
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const getColor = (pnl?: number) => {
    if (pnl === undefined || pnl === 0) return "var(--color-gray-800)"
    if (pnl > 0) {
      if (pnl > 500) return "var(--color-profit)"
      return "rgba(0,199,88,0.5)"
    }
    if (pnl < 0) {
      if (pnl < -500) return "var(--color-loss)"
      return "rgba(255,59,48,0.5)"
    }
    return "var(--color-gray-800)"
  }

  return (
    <div style={{ width: "100%", overflowX: "auto", paddingBottom: "1rem" }}>
      <div style={{ minWidth: "800px" }}>
        
        {/* Months Row */}
        <div style={{ display: "flex", marginLeft: "2rem", marginBottom: "0.5rem" }}>
          {months.map((m, i) => (
            <div key={m} style={{ flex: 1, fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 600 }}>
              {m}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div style={{ display: "flex", gap: "4px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "16px", marginRight: "0.5rem" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", height: "14px", lineHeight: "14px" }}>Mon</span>
            <span style={{ fontSize: "0.65rem", color: "transparent", height: "14px", lineHeight: "14px" }}>Tue</span>
            <span style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", height: "14px", lineHeight: "14px" }}>Wed</span>
            <span style={{ fontSize: "0.65rem", color: "transparent", height: "14px", lineHeight: "14px" }}>Thu</span>
            <span style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", height: "14px", lineHeight: "14px" }}>Fri</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", flexDirection: "column", height: "130px", alignContent: "flex-start", gap: "4px" }}>
            {/* Empty slots for days before January 1st to align weeks */}
            {Array.from({ length: (startDate.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} style={{ width: "14px", height: "14px" }} />
            ))}

            {days.map((day, i) => {
              const key = formatKey(day)
              const pnl = dailyPnl[key]
              
              return (
                <Link key={key} href={`/journal/${key}`}>
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="relative group"
                    style={{ 
                      width: "14px", 
                      height: "14px", 
                      backgroundColor: getColor(pnl),
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--color-gray-900)] border border-[var(--color-gray-700)] rounded-md text-[0.7rem] text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      <div className="font-bold text-[var(--color-gray-400)]">{day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      {pnl !== undefined ? (
                        <div className={pnl >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}>
                          {formatCurrency(pnl, "USD", true)}
                        </div>
                      ) : (
                        <div>No trades</div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
          <span>Less</span>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "var(--color-loss)" }} />
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(255,59,48,0.5)" }} />
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "var(--color-gray-800)" }} />
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(0,199,88,0.5)" }} />
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "var(--color-profit)" }} />
          <span>More</span>
        </div>

      </div>
    </div>
  )
}
