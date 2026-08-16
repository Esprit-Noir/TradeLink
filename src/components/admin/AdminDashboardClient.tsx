"use client"

import { Users, UserCheck, TrendingUp, BarChart3, Headphones, AlertCircle, Activity } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

interface KPIs {
  totalUsers: number
  activeUsers7d: number
  activeUsers30d: number
  totalTrades: number
  totalBacktestSessions: number
  totalTickets: number
  openTickets: number
}

interface Charts {
  signupsByDay: { date: string; count: number }[]
  tradesByDay: { date: string; count: number }[]
  signupsByWeek: { date: string; count: number }[]
  usersByRole: { role: string; count: number }[]
}

const ROLE_COLORS: Record<string, string> = {
  USER: "#3b82f6",
  ADMIN: "#8b5cf6",
  SUPER_ADMIN: "#f59e0b",
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="card card-hover" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 120 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gray-400)", fontWeight: 600 }}>{label}</p>
        <div style={{ color }}><Icon size={16} /></div>
      </div>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color }}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  )
}

export function AdminDashboardClient({ kpis, charts }: { kpis: KPIs; charts: Charts }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard label="Total Users" value={kpis.totalUsers} icon={Users} color="var(--color-info)" />
        <KPICard label="Active (7d)" value={kpis.activeUsers7d} icon={UserCheck} color="var(--color-profit)" />
        <KPICard label="Active (30d)" value={kpis.activeUsers30d} icon={Activity} color="#8b5cf6" />
        <KPICard label="Total Trades" value={kpis.totalTrades.toLocaleString()} icon={TrendingUp} color="var(--color-warning)" />
        <KPICard label="Backtests" value={kpis.totalBacktestSessions} icon={BarChart3} color="#06b6d4" />
        <KPICard label="Support Tickets" value={kpis.totalTickets} icon={Headphones} color="#f97316" />
        <KPICard label="Open Tickets" value={kpis.openTickets} icon={AlertCircle} color={kpis.openTickets > 0 ? "var(--color-loss)" : "var(--color-profit)"} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <ChartCard title="User Signups (30 days)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.signupsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--color-gray-300)" }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Trades Logged (30 days)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.tradesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--color-gray-300)" }}
              />
              <Line type="monotone" dataKey="count" stroke="var(--color-brand-500)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Users by Role">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.usersByRole}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="count"
                nameKey="role"
              >
                {charts.usersByRole.map((entry) => (
                  <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || "var(--color-gray-500)"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            {charts.usersByRole.map(item => (
              <div key={item.role} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: ROLE_COLORS[item.role] || "var(--color-gray-500)" }} />
                {item.role} ({item.count})
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Weekly Signups">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.signupsByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-gray-500)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--color-gray-300)" }}
              />
              <Bar dataKey="count" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
