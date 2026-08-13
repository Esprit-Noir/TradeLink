"use client"

import React from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from "recharts"

const FIRM_COLORS = ["var(--color-profit)", "var(--color-brand-500)", "var(--color-warning)", "var(--color-loss)", "#a78bfa", "#22d3ee"]

export function PropFirmStatsClient({
  firms,
  totals,
}: {
  firms: any[]
  totals: {
    total: number
    passed: number
    failed: number
    passRate: number
    totalPaid: number
    active: number
  }
}) {
  if (totals.total === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">Prop Firm Performance</div>
        <div style={{ color: "var(--color-gray-500)", padding: "2rem", textAlign: "center" }}>
          No prop challenges yet. <a href="/challenges" style={{ color: "var(--color-brand-500)" }}>Start one now</a>.
        </div>
      </div>
    )
  }

  const chartData = firms.map(f => ({
    name: f.firmName,
    Passed: f.passed,
    "Breached/Failed": f.failed,
  }))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
      <div className="chart-card">
        <div className="chart-title">Prop Firm Performance</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Total Challenges</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{totals.total}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Active</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-brand-500)" }}>{totals.active}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Pass Rate</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-profit)" }}>{totals.passRate.toFixed(1)}%</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Total Payouts</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-profit)" }}>
              ${totals.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }}
                labelStyle={{ color: "var(--color-gray-300)" }}
                cursor={{ fill: "var(--color-gray-800)" }}
              />
              <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
              <Bar dataKey="Passed" stackId="a" fill="var(--color-profit)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Breached/Failed" stackId="a" fill="var(--color-loss)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {firms.length > 0 && (
        <div className="chart-card">
          <div className="chart-title">Breakdown by Firm</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {firms.map((f, i) => (
              <div key={f.firmName} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: FIRM_COLORS[i % FIRM_COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, color: "var(--color-gray-200)", fontWeight: 600 }}>{f.firmName}</span>
                <span style={{ color: "var(--color-gray-400)" }}>
                  {f.passed} passed · {f.failed} failed · {f.active} active
                </span>
                <span style={{ color: "var(--color-profit)", fontWeight: 600, width: "110px", textAlign: "right" }}>
                  ${Number(f.totalPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })} paid
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
