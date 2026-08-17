"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar,
} from "recharts"
import { Activity, BarChart2 } from "lucide-react"
import type { EquityPoint } from "@/lib/metrics"

type ViewMode = "balance" | "drawdown"
const TIMEFRAMES = ["1W", "1M", "3M", "6M", "1Y", "ALL"]

interface EquityData {
  data: EquityPoint[]
  initialBalance: number
  currentBalance: number
  maxDrawdown: number
  currentDrawdown: number
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val)
}

function CustomTooltip({ active, payload, label, initialBalance }: any) {
  if (!active || !payload?.length) return null
  const balance = payload.find((p: any) => p.dataKey === "Balance")?.value ?? 0
  const drawdown = payload.find((p: any) => p.dataKey === "Drawdown")?.value ?? 0
  const change = balance - (initialBalance || balance)
  const changePct = initialBalance ? ((change / initialBalance) * 100).toFixed(2) : "0.00"
  const isPos = change >= 0

  return (
    <div style={{
      background: "var(--color-gray-900)",
      border: "1px solid var(--color-gray-700)",
      borderRadius: "10px",
      padding: "0.75rem",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      fontSize: "0.75rem",
      minWidth: "180px",
    }}>
      <div style={{ color: "var(--color-gray-500)", marginBottom: "0.5rem", fontWeight: 500 }}>
        {label ? new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <span style={{ color: "var(--color-gray-500)" }}>Balance</span>
        <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-gray-100)" }}>{formatCurrency(balance)}</span>
      </div>
      {drawdown > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
          <span style={{ color: "var(--color-gray-500)" }}>Drawdown</span>
          <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--color-warning)" }}>-{drawdown.toFixed(2)}%</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.35rem", borderTop: "1px solid var(--color-gray-800)" }}>
        <span style={{ color: "var(--color-gray-500)" }}>Since start</span>
        <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: isPos ? "var(--color-profit)" : "var(--color-loss)" }}>
          {isPos ? "+" : ""}{changePct}%
        </span>
      </div>
    </div>
  )
}

interface ChallengeSnapshot {
  date: string
  endBalance: number
  lowestEquity: number
  dailyPnl?: number
  tradesCount?: number
  dailyDDUsedPct?: number
}

interface EquityCurveChartProps {
  snapshots?: ChallengeSnapshot[]
  equityData?: EquityPoint[]
  initialBalance?: number
  currentBalance?: number
  maxDrawdownPct?: number
  profitTarget?: number
  maxDDLevel?: number
  showMaxDDLine?: boolean
  showTargetLine?: boolean
}

export function EquityCurveChart({
  snapshots,
  equityData,
  initialBalance: propInitial,
  currentBalance: propCurrent,
  maxDrawdownPct,
  profitTarget,
  maxDDLevel,
  showMaxDDLine = false,
  showTargetLine = false,
}: EquityCurveChartProps = {}) {
  const [rawData, setRawData] = useState<EquityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("ALL")
  const [viewMode, setViewMode] = useState<ViewMode>("balance")
  const searchParams = useSearchParams()

  useEffect(() => {
    if (equityData && equityData.length > 0) {
      const initial = propInitial ?? equityData[0]?.equity ?? 0
      const current = propCurrent ?? equityData[equityData.length - 1]?.equity ?? 0
      const maxDD = equityData.reduce((m, p) => Math.max(m, p.drawdown ?? 0), 0)
      const curDD = equityData.length > 0 ? (equityData[equityData.length - 1].drawdown ?? 0) : 0
      setRawData({ data: equityData, initialBalance: initial, currentBalance: current, maxDrawdown: maxDD, currentDrawdown: curDD })
      setLoading(false)
      return
    }

    if (snapshots && snapshots.length > 0) {
      let runningHigh = propInitial ?? snapshots[0].endBalance
      const points: EquityPoint[] = snapshots.map(s => {
        const anchor = maxDDLevel ?? (propInitial ?? s.endBalance)
        const dd = anchor > 0 ? ((anchor - s.lowestEquity) / anchor) * 100 : 0
        runningHigh = Math.max(runningHigh, s.endBalance)
        return { date: s.date, equity: s.endBalance, drawdown: Math.max(0, dd) }
      })
      const initial = propInitial ?? points[0]?.equity ?? 0
      const current = propCurrent ?? points[points.length - 1]?.equity ?? 0
      const maxDD = points.reduce((m, p) => Math.max(m, p.drawdown ?? 0), 0)
      const curDD = points.length > 0 ? (points[points.length - 1].drawdown ?? 0) : 0
      setRawData({ data: points, initialBalance: initial, currentBalance: current, maxDrawdown: maxDD, currentDrawdown: curDD })
      setLoading(false)
      return
    }

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
        setRawData({
          data: d.data || [],
          initialBalance: d.initialBalance || 0,
          currentBalance: d.currentBalance || 0,
          maxDrawdown: d.maxDrawdown || 0,
          currentDrawdown: d.currentDrawdown || 0,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [equityData, snapshots, propInitial, propCurrent, maxDDLevel, searchParams])

  const filteredData = useMemo(() => {
    if (!rawData?.data.length) return []
    if (timeframe === "ALL") return rawData.data
    const cutoffs: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 }
    const days = cutoffs[timeframe] || 30
    const cutoff = new Date(Date.now() - days * 86400000)
    return rawData.data.filter((p) => new Date(p.date) >= cutoff)
  }, [rawData, timeframe])

  const chartData = useMemo(() =>
    filteredData.map((p) => ({
      date: p.date,
      Balance: p.equity,
      Drawdown: p.drawdown ?? 0,
    })),
    [filteredData]
  )

  const initialBalance = rawData?.initialBalance ?? 0
  const currentBalance = rawData?.currentBalance ?? 0
  const maxDrawdown = rawData?.maxDrawdown ?? 0
  const currentDrawdown = rawData?.currentDrawdown ?? 0

  const firstBalance = chartData[0]?.Balance ?? initialBalance
  const lastBalance = chartData[chartData.length - 1]?.Balance ?? currentBalance
  const periodChange = lastBalance - firstBalance
  const periodChangePct = firstBalance !== 0 ? ((periodChange / Math.abs(firstBalance)) * 100) : 0
  const isPositive = periodChange >= 0
  const gradColor = isPositive ? "var(--color-profit)" : "var(--color-loss)"

  const minVal = chartData.length ? Math.min(...chartData.map((d) => d.Balance)) * 0.998 : 0
  const maxVal = chartData.length ? Math.max(...chartData.map((d) => d.Balance)) * 1.002 : 0

  const statItems = [
    { label: "Initial Balance", value: formatCurrency(initialBalance), color: "var(--color-gray-200)" },
    { label: "Current Balance", value: formatCurrency(currentBalance), color: currentBalance >= initialBalance ? "var(--color-profit)" : "var(--color-loss)" },
    { label: "Max Drawdown", value: `-${maxDrawdown.toFixed(2)}%`, color: maxDrawdown > 15 ? "var(--color-loss)" : maxDrawdown > 8 ? "var(--color-warning)" : "var(--color-profit)" },
    { label: "Current DD", value: currentDrawdown > 0 ? `-${currentDrawdown.toFixed(2)}%` : "---", color: currentDrawdown > 5 ? "var(--color-warning)" : "var(--color-profit)" },
  ]

  if (loading) {
    return (
      <div className="chart-card">
        <div className="chart-title">Equity Curve</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem 1.5rem" }}>
          {[95, 70, 88, 55, 80, 65].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 8, borderRadius: 4, width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!rawData || chartData.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">Equity Curve</div>
        <div className="empty-state" style={{ padding: "3rem" }}>
          <p style={{ fontSize: "0.85rem" }}>Import or add trades to see your equity curve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div className="chart-title" style={{ marginBottom: "0.25rem" }}>Equity Curve</div>
          {chartData.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-gray-100)" }}>
                {formatCurrency(lastBalance)}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.15rem",
                fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "10px",
                color: isPositive ? "var(--color-profit)" : "var(--color-loss)",
                background: isPositive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              }}>
                {isPositive ? "+" : ""}{periodChangePct.toFixed(2)}%
                <span style={{ marginLeft: "0.25rem", fontWeight: 500, opacity: 0.7 }}>({timeframe})</span>
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Toggle mode */}
          <div style={{ display: "flex", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "10px", padding: "2px", gap: "2px" }}>
            <button
              onClick={() => setViewMode("balance")}
              style={{
                display: "flex", alignItems: "center", gap: "0.25rem",
                padding: "0.25rem 0.5rem", borderRadius: "8px", fontSize: "0.7rem", fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: viewMode === "balance" ? "rgba(16,185,129,0.15)" : "transparent",
                color: viewMode === "balance" ? "var(--color-profit)" : "var(--color-gray-500)",
              }}
            >
              <Activity size={12} /> Balance
            </button>
            <button
              onClick={() => setViewMode("drawdown")}
              style={{
                display: "flex", alignItems: "center", gap: "0.25rem",
                padding: "0.25rem 0.5rem", borderRadius: "8px", fontSize: "0.7rem", fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: viewMode === "drawdown" ? "rgba(245,158,11,0.15)" : "transparent",
                color: viewMode === "drawdown" ? "var(--color-warning)" : "var(--color-gray-500)",
              }}
            >
              <BarChart2 size={12} /> Drawdown
            </button>
          </div>

          {/* Timeframes */}
          <div style={{ display: "flex", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "10px", padding: "2px", gap: "2px" }}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "0.25rem 0.5rem", borderRadius: "8px", fontSize: "0.7rem", fontWeight: 600,
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: timeframe === tf ? "rgba(16,185,129,0.15)" : "transparent",
                  color: timeframe === tf ? "var(--color-profit)" : "var(--color-gray-500)",
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
        {statItems.map((s) => (
          <div key={s.label} style={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "10px", padding: "0.5rem 0.75rem" }}>
            <div style={{ fontSize: "0.6rem", color: "var(--color-gray-500)", marginBottom: "0.15rem" }}>{s.label}</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 300 }}>
        {viewMode === "balance" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? "var(--color-profit)" : "var(--color-loss)"} stopOpacity={0.3} />
                  <stop offset="60%" stopColor={isPositive ? "var(--color-profit)" : "var(--color-loss)"} stopOpacity={0.05} />
                  <stop offset="100%" stopColor={isPositive ? "var(--color-profit)" : "var(--color-loss)"} stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--color-gray-500)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => d ? `${new Date(d).getMonth() + 1}/${new Date(d).getDate()}` : ""}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minVal, maxVal]}
                tick={{ fill: "var(--color-gray-500)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />
              <Tooltip
                content={<CustomTooltip initialBalance={initialBalance} />}
                cursor={{ stroke: "var(--color-gray-700)", strokeWidth: 1, strokeDasharray: "4 2" }}
              />
              {initialBalance > 0 && (
                <ReferenceLine
                  y={initialBalance}
                  stroke={gradColor}
                  strokeDasharray="5 3"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
              )}
              {showMaxDDLine && maxDDLevel && maxDDLevel > 0 && (
                <ReferenceLine
                  y={maxDDLevel}
                  stroke="var(--color-loss)"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  label={{ value: "Max DD", position: "insideTopRight", fill: "var(--color-loss)", fontSize: 9 }}
                />
              )}
              {showTargetLine && profitTarget && profitTarget > 0 && (
                <ReferenceLine
                  y={profitTarget}
                  stroke="var(--color-profit)"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  label={{ value: "Target", position: "insideTopRight", fill: "var(--color-profit)", fontSize: 9 }}
                />
              )}
              <Bar dataKey="Profit" fill="transparent" radius={[2, 2, 0, 0]} maxBarSize={3} opacity={0} />
              <Area
                type="monotone"
                dataKey="Balance"
                stroke={gradColor}
                strokeWidth={2.5}
                fill="url(#equityGrad)"
                dot={false}
                activeDot={{ r: 5, fill: gradColor, strokeWidth: 2, stroke: "var(--color-gray-900)" }}
                filter="url(#glow)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-loss)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-loss)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--color-gray-500)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => d ? `${new Date(d).getMonth() + 1}/${new Date(d).getDate()}` : ""}
                interval="preserveStartEnd"
              />
              <YAxis
                reversed
                tick={{ fill: "var(--color-gray-500)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v) => `-${v.toFixed(1)}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const dd = payload[0]?.value ?? 0
                  return (
                    <div style={{
                      background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)",
                      borderRadius: "10px", padding: "0.75rem", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontSize: "0.75rem",
                    }}>
                      <div style={{ color: "var(--color-gray-500)", marginBottom: "0.35rem" }}>
                        {label ? new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </div>
                      <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-warning)" }}>
                        Drawdown: -{(dd as number).toFixed(2)}%
                      </div>
                    </div>
                  )
                }}
                cursor={{ stroke: "var(--color-gray-700)", strokeWidth: 1, strokeDasharray: "4 2" }}
              />
              <ReferenceLine y={5} stroke="var(--color-warning)" strokeDasharray="4 2" strokeWidth={1} opacity={0.5}
                label={{ value: "5%", position: "insideTopRight", fill: "var(--color-warning)", fontSize: 9 }} />
              <ReferenceLine y={10} stroke="var(--color-loss)" strokeDasharray="4 2" strokeWidth={1} opacity={0.5}
                label={{ value: "10%", position: "insideTopRight", fill: "var(--color-loss)", fontSize: 9 }} />
              {maxDrawdownPct && maxDrawdownPct > 0 && (
                <ReferenceLine y={maxDrawdownPct} stroke="var(--color-loss)" strokeDasharray="2 2" strokeWidth={1.5} opacity={0.7}
                  label={{ value: `Max ${maxDrawdownPct.toFixed(0)}%`, position: "insideTopRight", fill: "var(--color-loss)", fontSize: 9 }} />
              )}
              <Area
                type="monotone"
                dataKey="Drawdown"
                stroke="var(--color-loss)"
                strokeWidth={2}
                fill="url(#ddGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-loss)", strokeWidth: 2, stroke: "var(--color-gray-900)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-gray-800)", fontSize: "0.7rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: 16, height: 2, borderRadius: 1, background: gradColor }} />
            <span style={{ color: "var(--color-gray-500)" }}>Balance</span>
          </div>
          {initialBalance > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <div style={{ width: 16, borderTop: "2px dashed", borderColor: gradColor, opacity: 0.4 }} />
              <span style={{ color: "var(--color-gray-500)" }}>Initial</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-gray-500)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-profit)", display: "inline-block" }} />
            {chartData.filter(d => d.Balance > 0).length} W
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-loss)", display: "inline-block" }} />
            {chartData.filter(d => d.Balance < 0).length} L
          </span>
        </div>
      </div>
    </div>
  )
}
