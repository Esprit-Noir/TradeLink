"use client"

import React, { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

type PieLabelData = {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  fill: string
  percent: number
  payload: { name?: string }
}

const renderCustomizedLabel = (props: unknown) => {
  const { cx, cy, midAngle, outerRadius, fill, payload, percent } = props as PieLabelData
  const RADIAN = Math.PI / 180
  
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 4) * cos
  const sy = cy + (outerRadius + 4) * sin
  const mx = cx + (outerRadius + 12) * cos
  const my = cy + (outerRadius + 12) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 8
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="var(--color-gray-700)" strokeWidth={1} fill="none" />
      <circle cx={sx} cy={sy} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={4} textAnchor={textAnchor} fill="var(--color-gray-200)" fontSize={12} fontWeight={700}>
        {payload.name} ({(percent * 100).toFixed(0)}%)
      </text>
    </g>
  )
}

interface WinRateDonutProps {
  wins: number
  losses: number
}

export function WinRateDonut({ wins, losses }: WinRateDonutProps) {
  const total = wins + losses
  const winRate = total > 0 ? (wins / total) * 100 : 0
  
  const data = useMemo(() => [
    { name: "Wins", value: wins, color: "var(--color-profit)" },
    { name: "Losses", value: losses, color: "var(--color-loss)" },
  ], [wins, losses])

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--color-gray-500)]">
        No data yet
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, bottom: 10, left: 35, right: 35 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="95%"
              paddingAngle={0}
              stroke="var(--color-gray-900)"
              strokeWidth={4}
              dataKey="value"
              isAnimationActive={false}
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "var(--color-gray-900)", 
                border: "1px solid var(--color-gray-800)",
                borderRadius: "8px",
                color: "var(--color-gray-100)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }} 
              itemStyle={{ color: "var(--color-gray-100)", fontWeight: 600 }}
              labelStyle={{ color: "var(--color-gray-400)", marginBottom: "0.25rem", fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-3xl font-bold text-[var(--color-gray-100)] leading-none">
            {winRate.toFixed(0)}%
          </div>
        </div>
      </div>
      {/* Win/Loss counts */}
      <div className="flex justify-center gap-6 pt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-profit)] inline-block" />
          <span className="text-[var(--color-profit)] font-semibold">{wins}</span>
          <span className="text-[var(--color-gray-500)]">wins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-loss)] inline-block" />
          <span className="text-[var(--color-loss)] font-semibold">{losses}</span>
          <span className="text-[var(--color-gray-500)]">losses</span>
        </div>
      </div>
    </div>
  )
}

