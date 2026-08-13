"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export function SetupBarChart() {
  const [data, setData] = useState<{name: string, pnl: number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/metrics/charts")
      .then((r) => r.json())
      .then((d) => {
        setData(d.setupData || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="chart-card">
      <div className="chart-title">P&L by Setup</div>
      
      {loading ? (
        <div className="skeleton" style={{ height: 260 }} />
      ) : data.length === 0 ? (
        <div className="empty-state" style={{ padding: "1.5rem", height: 260 }}>
          <p style={{ fontSize: "0.85rem" }}>Tag your trades to see this chart.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: "var(--color-gray-500)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
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
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Net P&L"]}
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
