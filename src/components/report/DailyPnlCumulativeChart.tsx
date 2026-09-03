"use client"

import { useMemo } from "react"
import { ComposedChart, Bar, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"

interface DailyData {
  date: string
  pnl: number
  cumPnl: number
}

interface DailyPnlCumulativeChartProps {
  data: DailyData[]
  height?: number
}

function fmtMoney(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val)
}

export function DailyPnlCumulativeChart({ data, height = 380 }: DailyPnlCumulativeChartProps) {
  const chartData = useMemo(() =>
    data.map(d => ({
      date: d.date.split("T")[0],
      pnl: d.pnl,
      cumPnl: d.cumPnl,
      pnlColor: d.pnl >= 0 ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)",
    })),
    [data]
  )

  if (data.length === 0) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height, color: "var(--color-gray-500)" }}>No data</div>
  }

  return (
    <div>
      <div style={{ height, borderRadius: 8, overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, bottom: 5, left: 0, right: 10 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                const d = new Date(val as string)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
            />
            <YAxis
              yAxisId="pnl"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
              width={60}
            />
            <YAxis
              yAxisId="cum"
              orientation="right"
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
              formatter={(value, name) => {
                const v = Number(value)
                if (name === "pnl") return [fmtMoney(v), "Daily P&L"]
                return [fmtMoney(v), "Cumulative"]
              }}
            />
            <ReferenceLine yAxisId="pnl" y={0} stroke="var(--color-gray-700)" strokeDasharray="3 3" />
            <Bar yAxisId="pnl" dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnlColor} />
              ))}
            </Bar>
            <Area
              yAxisId="cum"
              type="monotone"
              dataKey="cumPnl"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="rgba(139,92,246,0.15)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#8B5CF6", fill: "#0a0f0c" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-gray-800)", fontSize: "0.7rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: 12, height: 8, borderRadius: 2, background: "rgba(34,197,94,0.6)" }} />
          <span style={{ color: "var(--color-gray-500)" }}>Daily P&L</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: 12, height: 2, borderRadius: 1, background: "#8B5CF6" }} />
          <span style={{ color: "var(--color-gray-500)" }}>Cumulative</span>
        </div>
      </div>
    </div>
  )
}
