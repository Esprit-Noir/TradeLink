"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export function HourHeatmap() {
  const [data, setData] = useState<{hour: string, pnl: number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/metrics/charts")
      .then((r) => r.json())
      .then((d) => {
        setData(d.hourlyData || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="chart-card">
      <div className="chart-title">P&L by Hour of Day</div>
      
      {loading ? (
        <div className="skeleton" style={{ height: 180 }} />
      ) : data.length === 0 ? (
        <div className="empty-state" style={{ padding: "1.5rem", height: 180 }}>
          <p style={{ fontSize: "0.85rem" }}>Import trades to see your most profitable trading hours.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="hour" 
              tick={{ fill: "var(--color-gray-500)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis 
              tick={{ fill: "var(--color-gray-500)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              cursor={{ fill: "var(--color-gray-800)", opacity: 0.4 }}
              contentStyle={{
                background: "var(--color-gray-900)",
                border: "1px solid var(--color-gray-700)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-gray-200)",
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
