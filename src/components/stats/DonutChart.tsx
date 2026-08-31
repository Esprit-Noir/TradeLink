"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/formatters"
import { CATEGORY_COLORS as DEFAULT_COLORS } from "@/lib/chartColors"

interface DonutSegment {
  name: string
  value: number
  color?: string
  pnl?: number
}

interface DonutChartProps {
  data: DonutSegment[]
  title: string
  subtitle?: string
  innerLabel?: string
  innerSublabel?: string
  height?: number
  colors?: string[]
  showLegend?: boolean
  formatValue?: (v: number) => string
  formatTooltip?: (v: number, name: string) => string
}

function CustomTooltip({
  active,
  payload,
  total,
  formatValue,
  formatTooltip,
}: {
  active?: boolean
  payload?: Array<{ payload: DonutSegment }>
  total: number
  formatValue?: (v: number) => string
  formatTooltip?: (v: number, name: string) => string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DonutSegment
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0"
  return (
    <div style={{
      background: "var(--color-gray-900)",
      border: "1px solid var(--color-gray-700)",
      borderRadius: "10px",
      padding: "0.6rem 0.8rem",
      fontSize: "0.75rem",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    }}>
      <div style={{ color: d.color || "var(--color-gray-200)", fontWeight: 700, marginBottom: 2 }}>
        {d.name}
      </div>
      <div style={{ color: "var(--color-gray-300)" }}>
        {formatTooltip ? formatTooltip(d.value, d.name) : formatValue ? formatValue(d.value) : d.value.toLocaleString()}
        <span style={{ color: "var(--color-gray-500)", marginLeft: 6 }}>({pct}%)</span>
      </div>
      {d.pnl !== undefined && (
        <div style={{ color: d.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 600, marginTop: 2 }}>
          {formatCurrency(d.pnl, "USD", true, 0)}
        </div>
      )}
    </div>
  )
}

export function DonutChart({
  data,
  title,
  subtitle,
  innerLabel,
  innerSublabel,
  height = 200,
  colors = DEFAULT_COLORS,
  showLegend = true,
  formatValue,
  formatTooltip,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="chart-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <div className="chart-title" style={{ margin: 0 }}>{title}</div>
        {subtitle && <div style={{ fontSize: "0.72rem", color: "var(--color-gray-500)", marginTop: 2 }}>{subtitle}</div>}
      </div>

      {data.length === 0 ? (
        <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>No data</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
          <div style={{ position: "relative", width: height, height: height, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={height * 0.28}
                  outerRadius={height * 0.45}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={entry.color || colors[i % colors.length]}
                      style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.3))" }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} formatValue={formatValue} formatTooltip={formatTooltip} />} />
              </PieChart>
            </ResponsiveContainer>
            {innerLabel && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-gray-100)", lineHeight: 1.1 }}>
                  {innerLabel}
                </div>
                {innerSublabel && (
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: 2, fontWeight: 600 }}>
                    {innerSublabel}
                  </div>
                )}
              </div>
            )}
          </div>

          {showLegend && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: 0 }}>
              {data.map((entry, i) => {
                const pct = total > 0 ? ((entry.value / total) * 100) : 0
                return (
                  <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "3px",
                      background: entry.color || colors[i % colors.length],
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-gray-300)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.name}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-gray-500)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                      {formatValue ? formatValue(entry.value) : entry.value.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-600)", fontFamily: "var(--font-mono)", minWidth: 36, textAlign: "right" }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
