"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from "recharts"
import { Trophy, TrendingUp, AlertCircle, DollarSign } from "lucide-react"

const FIRM_COLORS = ["var(--color-profit)", "var(--color-brand-500)", "var(--color-warning)", "var(--color-loss)", "#a78bfa", "#22d3ee"]

const tooltipStyle = {
  background: "var(--color-gray-900)",
  border: "1px solid var(--color-gray-700)",
  borderRadius: "10px",
  fontSize: "0.75rem",
  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
}

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
      <div className="chart-card" style={{ padding: "1.25rem" }}>
        <div className="chart-title">Prop Firm Performance</div>
        <div className="empty-state" style={{ padding: "2rem" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <StatCard icon={<Trophy size={14} />} label="Total Challenges" value={String(totals.total)} color="var(--color-gray-100)" />
        <StatCard icon={<TrendingUp size={14} />} label="Active" value={String(totals.active)} color="var(--color-brand-500)" />
        <StatCard icon={<AlertCircle size={14} />} label="Pass Rate" value={`${totals.passRate.toFixed(1)}%`} color="var(--color-profit)" />
        <StatCard icon={<DollarSign size={14} />} label="Total Payouts" value={`$${totals.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color="var(--color-profit)" />
      </div>

      {/* Chart */}
      <div className="chart-card" style={{ padding: "1.25rem" }}>
        <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Challenges by Firm</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--color-gray-300)" }} cursor={{ fill: "var(--color-gray-800)" }} />
              <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
              <Bar dataKey="Passed" stackId="a" fill="var(--color-profit)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Breached/Failed" stackId="a" fill="var(--color-loss)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown */}
      {firms.length > 0 && (
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Breakdown by Firm</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {firms.map((f, i) => (
              <div key={f.firmName} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.65rem 0.75rem",
                background: "var(--color-gray-950)", borderRadius: "8px", border: "1px solid var(--color-gray-800)",
                fontSize: "0.85rem",
              }}>
                <div style={{
                  width: "10px", height: "10px", borderRadius: "3px",
                  background: FIRM_COLORS[i % FIRM_COLORS.length], flexShrink: 0,
                }} />
                <span style={{ flex: 1, color: "var(--color-gray-200)", fontWeight: 600 }}>{f.firmName}</span>
                <span style={{ color: "var(--color-gray-500)", fontSize: "0.78rem" }}>
                  {f.passed}P · {f.failed}F · {f.active}A
                </span>
                <span style={{ color: "var(--color-profit)", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.85rem", minWidth: "100px", textAlign: "right" }}>
                  ${Number(f.totalPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
      borderRadius: "var(--radius-card)", padding: "0.85rem",
      display: "flex", flexDirection: "column", gap: "0.2rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--color-gray-500)", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-mono)", color }}>{value}</div>
    </div>
  )
}
