// app/(app)/dashboard/page.tsx
// Dashboard principal — Server Component (Next.js 16)

import { Suspense } from "react"
import { KpiGrid } from "@/components/dashboard/KpiGrid"
import { EquityCurveChart } from "@/components/dashboard/EquityCurveChart"
import { SetupBarChart } from "@/components/dashboard/SetupBarChart"
import { HourHeatmap } from "@/components/dashboard/HourHeatmap"
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable"
import { KpiGridSkeleton } from "@/components/dashboard/KpiGridSkeleton"
import { WinRateChartServer } from "@/components/dashboard/WinRateChartServer"
import { DailyPnlChartServer } from "@/components/dashboard/DailyPnlChartServer"
import { DashboardFilter } from "@/components/dashboard/DashboardFilter"

export const metadata = {
  title: "Dashboard",
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const searchParamsObj = await searchParams
  const period = searchParamsObj?.period || "all"
  
  let fromDate: Date | undefined
  let toDate: Date | undefined

  if (period === "7d") {
    fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7)
  } else if (period === "30d") {
    fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 30)
  } else if (period === "90d") {
    fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 90)
  } else if (period === "ytd") {
    fromDate = new Date(new Date().getFullYear(), 0, 1)
  } else if (period === "custom") {
    if (searchParamsObj?.from) fromDate = new Date(searchParamsObj.from)
    if (searchParamsObj?.to) toDate = new Date(searchParamsObj.to)
  }

  // Set time limits properly
  if (fromDate) fromDate.setHours(0, 0, 0, 0)
  if (toDate) toDate.setHours(23, 59, 59, 999)

  const dateRange = { from: fromDate, to: toDate }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your trading performance at a glance</p>
        </div>
        <Suspense fallback={<div className="skeleton" style={{ width: 120, height: 38 }} />}>
          <DashboardFilter />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiGrid dateRange={dateRange} />
      </Suspense>

      {/* Charts Row 1: Daily P&L and Win Rate */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div className="chart-card">
          <div className="chart-title">Daily Net P&L</div>
          <div style={{ height: 260 }}>
            <Suspense fallback={<ChartSkeleton height={260} />}>
              <DailyPnlChartServer dateRange={dateRange} />
            </Suspense>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Win Rate</div>
          <div style={{ height: 260 }}>
            <Suspense fallback={<ChartSkeleton height={260} />}>
              <WinRateChartServer dateRange={dateRange} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Equity Curve & Setups */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <Suspense fallback={
          <div className="chart-card">
            <div className="chart-title">Equity Curve</div>
            <ChartSkeleton height={260} />
          </div>
        }>
          <EquityCurveChart />
        </Suspense>
        
        <Suspense fallback={
          <div className="chart-card">
            <div className="chart-title">Performance by Setup</div>
            <ChartSkeleton height={260} />
          </div>
        }>
          <SetupBarChart />
        </Suspense>
      </div>

      {/* Charts Row 3 */}
      <div style={{ marginBottom: "1rem" }}>
        <Suspense fallback={
          <div className="chart-card">
            <div className="chart-title">Performance by Hour & Day</div>
            <ChartSkeleton height={180} />
          </div>
        }>
          <HourHeatmap />
        </Suspense>
      </div>

      {/* Recent Trades */}
      <div className="chart-card">
        <div className="chart-title">Recent Trades</div>
        <Suspense fallback={<TableSkeleton />}>
          <RecentTradesTable dateRange={dateRange} />
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
