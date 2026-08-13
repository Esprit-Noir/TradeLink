// app/(app)/dashboard/page.tsx
// Dashboard principal — Server Component (Next.js 16)

import { Suspense } from "react"
import { KpiGrid } from "@/components/dashboard/KpiGrid"
import { EquityCurveChart } from "@/components/dashboard/EquityCurveChart"
import { SetupBarChart } from "@/components/dashboard/SetupBarChart"
import { HourHeatmap } from "@/components/dashboard/HourHeatmap"
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable"
import { KpiGridSkeleton } from "@/components/dashboard/KpiGridSkeleton"

export const metadata = {
  title: "Dashboard",
}

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your trading performance at a glance</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select className="input select" style={{ width: "auto" }} id="period-filter">
            <option value="30d">Last 30 days</option>
            <option value="7d">Last 7 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiGrid />
      </Suspense>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <Suspense fallback={<ChartSkeleton height={260} />}>
          <EquityCurveChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height={260} />}>
          <SetupBarChart />
        </Suspense>
      </div>

      {/* Charts Row 2 */}
      <div style={{ marginBottom: "1rem" }}>
        <Suspense fallback={<ChartSkeleton height={180} />}>
          <HourHeatmap />
        </Suspense>
      </div>

      {/* Recent Trades */}
      <div className="chart-card">
        <div className="chart-title">Recent Trades</div>
        <Suspense fallback={<TableSkeleton />}>
          <RecentTradesTable />
        </Suspense>
      </div>
    </div>
  )
}

// ─── Inline skeleton placeholders ────────────────────────────────────────────
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="chart-card">
      <div className="skeleton" style={{ height: 16, width: 120, marginBottom: 16 }} />
      <div className="skeleton" style={{ height }} />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 44, borderRadius: 6 }} />
      ))}
    </div>
  )
}
