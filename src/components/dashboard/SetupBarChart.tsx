"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { CATEGORY_COLORS as COLORS } from "@/lib/chartColors"
import { useMediaQuery } from "@/hooks/useMediaQuery"

type PieLabelData = {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  fill: string
  percent: number
  payload: { name?: string; pnl?: number }
}

const renderCustomizedLabel = (props: unknown) => {
  const { cx, cy, midAngle, outerRadius, fill, payload, percent } = props as PieLabelData
  const RADIAN = Math.PI / 180
  
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 8) * cos
  const sy = cy + (outerRadius + 8) * sin
  const mx = cx + (outerRadius + 25) * cos
  const my = cy + (outerRadius + 25) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 20
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="var(--color-gray-700)" strokeWidth={1} fill="none" />
      <circle cx={sx} cy={sy} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={-4} textAnchor={textAnchor} fill="var(--color-gray-200)" fontSize={12} fontWeight={700}>
        {payload.name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={14} textAnchor={textAnchor} fill="var(--color-gray-500)" fontSize={11} fontWeight={500}>
        {`${(percent * 100).toFixed(0)}% · $${Number(payload.pnl).toFixed(0)}`}
      </text>
    </g>
  )
}

export function SetupBarChart() {
  const [data, setData] = useState<{name: string, pnl: number, count: number, winRate: number}[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const qs = searchParams.toString()

  useEffect(() => {
    setLoading(true)
    const controller = new AbortController()
    
    // Use the primitive qs string to build the fetch URL instead of re-reading from searchParams inside the effect
    fetch(`/api/metrics/charts${qs ? `?${qs}` : ""}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setData(d.setupData || [])
        setLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [qs])

  // Use absolute PnL for the pie slice size to show the total "impact" of a setup
  const pieData = React.useMemo(() => {
    return data
      .map(d => ({ ...d, value: Math.abs(d.pnl) || 0 }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [data])

  const totalTrades = React.useMemo(() => pieData.reduce((acc, curr) => acc + curr.count, 0), [pieData])
  const showLabels = !useMediaQuery("(max-width: 640px)")

  return (
    <div className="chart-card" style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div className="chart-title">Performance by Setup</div>
      
      {loading ? (
        <div className="skeleton" style={{ flex: 1 }} />
      ) : pieData.length === 0 ? (
        <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "0.85rem" }}>Tag your trades to see this chart.</p>
        </div>
      ) : (
        <>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, bottom: 20, left: 40, right: 40 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="70%"
                paddingAngle={0}
                dataKey="value"
                stroke="var(--color-gray-900)"
                strokeWidth={4}
                label={showLabels ? renderCustomizedLabel : false}
                labelLine={false}
                isAnimationActive={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
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
                formatter={(value, name, props) => {
                  const { count, winRate, pnl } = props.payload
                  return [`$${Number(pnl).toFixed(2)}`, `${count} trades · ${winRate}% WR`]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text Overlay */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-gray-100)" }}>
              {totalTrades}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 500, marginTop: "0.1rem" }}>
              Total Trades
            </div>
          </div>
        </div>
        {!showLabels && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem 1rem", marginTop: "0.75rem" }}>
            {pieData.map((entry, index) => (
              <span key={entry.name} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "var(--color-gray-300)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                {entry.name} · {`${((entry.value / Math.max(1, pieData.reduce((a, b) => a + b.value, 0))) * 100).toFixed(0)}%`}
              </span>
            ))}
          </div>
        )}
        </>
      )}
    </div>
  )
}
