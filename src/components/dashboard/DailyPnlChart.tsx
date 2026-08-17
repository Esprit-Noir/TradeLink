"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
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
  // Group trades by date (YYYY-MM-DD in the user's timezone)
  const dailyPnlMap = trades.reduce((acc, trade) => {
    if (!trade.exitAt) return acc
    const dateStr = dayKey(new Date(trade.exitAt), timezone)
    acc[dateStr] = (acc[dateStr] || 0) + trade.netPnl
    return acc
  }, {} as Record<string, number>)

  // Convert to array and sort by date
  const data = Object.entries(dailyPnlMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({
      date,
      // Format label for display e.g. "Aug 12"
      displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pnl
    }))

  if (data.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gray-500)" }}>
        No data yet
      </div>
    )
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(val)
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis 
          dataKey="displayDate" 
          tick={{ fontSize: 11, fill: "var(--color-gray-500)" }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis 
          tickFormatter={(val) => val >= 1000 || val <= -1000 ? `${(val / 1000).toFixed(1)}k` : val}
          tick={{ fontSize: 11, fill: "var(--color-gray-500)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          cursor={{ fill: "var(--color-gray-800)", opacity: 0.4 }}
          contentStyle={{ 
            backgroundColor: "var(--color-gray-900)", 
            border: "1px solid var(--color-gray-800)",
            borderRadius: "8px",
            color: "var(--color-gray-100)"
          }}
          itemStyle={{ color: "var(--color-gray-100)" }}
          formatter={(value: any) => [formatCurrency(Number(value)), "P&L"]}
          labelStyle={{ color: "var(--color-gray-400)", marginBottom: "0.25rem" }}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
