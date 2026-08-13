"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface WinRateDonutProps {
  wins: number
  losses: number
}

export function WinRateDonut({ wins, losses }: WinRateDonutProps) {
  const total = wins + losses
  const winRate = total > 0 ? (wins / total) * 100 : 0
  
  const data = [
    { name: "Wins", value: wins, color: "var(--color-profit)" },
    { name: "Losses", value: losses, color: "var(--color-loss)" },
  ]

  if (total === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gray-500)" }}>
        No data yet
      </div>
    )
  }

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="90%"
            stroke="none"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--color-gray-900)", 
              border: "1px solid var(--color-gray-800)",
              borderRadius: "8px",
              color: "var(--color-gray-100)"
            }} 
            itemStyle={{ color: "var(--color-gray-100)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        pointerEvents: "none"
      }}>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-gray-100)", lineHeight: 1 }}>
          {winRate.toFixed(0)}%
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
          Win Rate
        </div>
      </div>
    </div>
  )
}
