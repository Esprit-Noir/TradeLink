"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export function SetupBarChart() {
  const [data, setData] = useState<{name: string, pnl: number}[]>([])
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
    fetch(`/api/metrics/charts${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.setupData || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [searchParams])

  return (
    <div className="chart-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="chart-title">P&L by Setup</div>
      
      {loading ? (
        <div className="skeleton" style={{ height: 180 }} />
      ) : data.length === 0 ? (
        <div className="empty-state" style={{ padding: "1.5rem", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "0.85rem" }}>Tag your trades to see this chart.</p>
        </div>
      ) : (
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="20%">
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
                itemStyle={{ color: "var(--color-gray-100)" }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Net P&L"]}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
