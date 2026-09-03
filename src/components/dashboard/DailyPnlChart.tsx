"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { dayKey } from "@/lib/dates"

interface Trade {
  exitAt: Date | null
  netPnl: number
}

interface DailyPnlChartProps {
  trades: Trade[]
  currency?: string
  timezone?: string
}

export function DailyPnlChart({ trades, currency = "USD", timezone = "UTC" }: DailyPnlChartProps) {
  const data = useMemo(() => {
    const dailyPnlMap = trades.reduce((acc, trade) => {
      if (!trade.exitAt) return acc
      const dateStr = dayKey(new Date(trade.exitAt), timezone)
      acc[dateStr] = (acc[dateStr] || 0) + trade.netPnl
      return acc
    }, {} as Record<string, number>)

    return Object.entries(dailyPnlMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => ({
        date: date.split("T")[0],
        pnl,
        color: pnl >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)",
      }))
  }, [trades, timezone])

  if (data.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-gray-500)" }}>
        No data yet
      </div>
    )
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, bottom: 5, left: 0, right: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => {
              const d = new Date(val)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${val}`}
            width={60}
          />
          <Tooltip
            cursor={{ fill: "var(--color-gray-800)", opacity: 0.2 }}
            contentStyle={{
              background: "var(--color-gray-900)",
              border: "1px solid var(--color-gray-800)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-gray-200)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            itemStyle={{ color: "var(--color-gray-100)", fontWeight: 600 }}
            labelFormatter={(label) => {
              const d = new Date(label as string)
              return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Net P&L"]}
          />
          <ReferenceLine y={0} stroke="var(--color-gray-700)" strokeDasharray="3 3" />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
