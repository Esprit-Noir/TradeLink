"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AreaChart, Area, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

export function TradesEquityMini() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<{ equity: number; date: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams()
    const accountId = searchParams?.get("accountId")
    const from = searchParams?.get("from")
    const to = searchParams?.get("to")
    if (accountId) params.set("accountId", accountId)
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    const qs = params.toString()
    fetch(`/api/metrics/equity-curve${qs ? `?${qs}` : ""}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setData((d.data || []).map((p: { equity: number; date: string }) => ({ equity: p.equity, date: p.date })))
        setLoading(false)
      })
      .catch((e) => { if (e.name !== "AbortError") setLoading(false) })
    return () => controller.abort()
  }, [searchParams])

  if (loading) return <div className="skeleton" style={{ height: 80, borderRadius: "var(--radius-card)" }} />
  if (data.length < 2) return null

  const first = data[0].equity
  const last = data[data.length - 1].equity
  const change = last - first
  const changePct = first !== 0 ? ((change / Math.abs(first)) * 100) : 0
  const isPositive = change >= 0
  const minVal = Math.min(...data.map(d => d.equity)) * 0.999
  const maxVal = Math.max(...data.map(d => d.equity)) * 1.001

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "1.5rem",
      background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
      borderRadius: "var(--radius-card)", padding: "0.75rem 1.25rem",
      marginBottom: "1rem",
    }}>
      <div style={{ flex: 1, height: 50, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="miniEqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? "var(--color-profit)" : "var(--color-loss)"} stopOpacity={0.25} />
                <stop offset="100%" stopColor={isPositive ? "var(--color-profit)" : "var(--color-loss)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine y={first} stroke="var(--color-gray-700)" strokeDasharray="3 3" strokeWidth={1} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return (
                  <div style={{
                    background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)",
                    borderRadius: 8, padding: "0.4rem 0.6rem", fontSize: "0.7rem",
                  }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-gray-100)" }}>
                      ${Number(payload[0].value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={isPositive ? "var(--color-profit)" : "var(--color-loss)"}
              strokeWidth={1.5}
              fill="url(#miniEqGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", justifyContent: "flex-end" }}>
          {isPositive ? <TrendingUp size={14} color="var(--color-profit)" /> : <TrendingDown size={14} color="var(--color-loss)" />}
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.95rem", color: isPositive ? "var(--color-profit)" : "var(--color-loss)" }}>
            {isPositive ? "+" : ""}{changePct.toFixed(2)}%
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: "0.1rem" }}>
          {data.length} points
        </div>
      </div>
    </div>
  )
}
