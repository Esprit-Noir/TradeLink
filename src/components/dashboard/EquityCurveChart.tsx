"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"
import type { EquityPoint } from "@/lib/metrics"

export function EquityCurveChart() {
  const [data, setData] = useState<EquityPoint[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    const period = searchParams.get("period")
    const accountId = searchParams.get("accountId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    if (period) params.set("period", period)
    if (accountId) params.set("accountId", accountId)
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    const qs = params.toString()
    fetch(`/api/metrics/equity-curve${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [searchParams])

  const isPositive = data.length > 0 && data[data.length - 1].equity >= (data[0]?.equity ?? 0)
  const lineColor = isPositive ? "var(--color-profit)" : "var(--color-loss)"

  return (
    <div className="chart-card">
      <div className="chart-title">Equity Curve</div>
      {loading ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : data.length === 0 ? (
        <div className="empty-state" style={{ padding: "2rem" }}>
          <p style={{ fontSize: "0.85rem" }}>Import or add trades to see your equity curve.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-gray-500)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => {
                const date = new Date(d)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis
              tick={{ fill: "var(--color-gray-500)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-gray-800)",
                border: "1px solid var(--color-gray-700)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-gray-200)",
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Equity"]}
            />
            <ReferenceLine y={data[0]?.equity ?? 0} stroke="var(--color-gray-700)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="equity"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, stroke: "var(--color-gray-900)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
