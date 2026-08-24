// app/(app)/dashboard/page.tsx
// Dashboard principal — Server Component (Next.js 16)

import { Suspense } from "react"
import { KpiGrid } from "@/components/dashboard/KpiGrid"
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable"
import { KpiGridSkeleton } from "@/components/dashboard/KpiGridSkeleton"
import { DailyPnlChartServer } from "@/components/dashboard/DailyPnlChartServer"
import { WinRateChartServer } from "@/components/dashboard/WinRateChartServer"
import { DashboardFilter } from "@/components/dashboard/DashboardFilter"
import { DailyGoalWidget } from "@/components/dashboard/DailyGoalWidget"
import { MonthlyGoalWidget } from "@/components/dashboard/MonthlyGoalWidget"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MS_PER_DAY } from "@/lib/constants"
import { formatCurrency } from "@/lib/formatters"
import { EquityCurveChart, SetupBarChart, HourHeatmap } from "@/components/dashboard/LazyCharts"
import { MiniCalendar } from "@/components/dashboard/MiniCalendar"
import { EconomicCalendarWidget } from "@/components/calendar/EconomicCalendarWidget"
import { getTranslations } from "next-intl/server"

export const metadata = {
  title: "Dashboard",
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; accountId?: string }>
}) {
  const searchParamsObj = await searchParams
  const period = searchParamsObj?.period || "all"
  const accountIdParam = searchParamsObj?.accountId || ""
  const t = await getTranslations("Dashboard")
  
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

  // Fetch challenge for active account if any
  const session = await auth()
  let todayPnl = 0
  let dailyGoal: number | null = null
  let selectedAccountId: string | null | "all" = null
  let filterAccounts: { id: string; name: string; isDefault: boolean }[] = []
  let dailyPnlForCalendar: Record<string, number> = {}
  let dailyTradeCountForCalendar: Record<string, number> = {}

  // Month & streak aggregates
  let timezone = "UTC"
  let monthlyGoal: number | null = null
  let monthPnl = 0
  const monthDays: { key: string; pnl: number }[] = []
  let bestDay: { key: string; pnl: number } | null = null
  let worstDay: { key: string; pnl: number } | null = null
  let streak = 0
  let greenDaysThisMonth = 0
  let monthLabel = ""

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    })
    if (!user) {
      filterAccounts = []
    } else {
      const isAll = !accountIdParam || accountIdParam === "all"
      const requestedAccount = !isAll
        ? user.accounts.find(a => a.id === accountIdParam)
        : null
      // If a specific account was requested but not found, fall back to "all"
      const effectiveAll = isAll || !requestedAccount
      const defaultAccount = effectiveAll ? null : (requestedAccount || user.accounts.find(a => a.isDefault))
      selectedAccountId = effectiveAll ? "all" : (defaultAccount?.id ?? null)
      dailyGoal = user.dailyGoal ? Number(user.dailyGoal) : null
      monthlyGoal = user.monthlyGoal ? Number(user.monthlyGoal) : null
      timezone = user.timezone || "UTC"

      const tradesWhere = effectiveAll
        ? { userId: session.user.id, status: "closed" as const }
        : { accountId: defaultAccount?.id, status: "closed" as const }

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [todayAggregate, allClosed, filterAccountsData] = await Promise.all([
        prisma.trade.aggregate({
          where: { ...tradesWhere, exitAt: { gte: todayStart } },
          _sum: { netPnl: true },
        }),
        prisma.trade.findMany({
          where: tradesWhere,
          select: { netPnl: true, entryAt: true },
        }),
        prisma.tradingAccount.findMany({
          where: { userId: session.user.id },
          select: { id: true, name: true, isDefault: true },
          orderBy: { createdAt: "asc" },
        }),
      ])

      todayPnl = Number(todayAggregate._sum.netPnl || 0)
      filterAccounts = filterAccountsData as typeof filterAccounts

      // ── Month P&L, best/worst day, streak, calendar ──────────────────────
      const dayFmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      })
      const localDayKey = (d: Date) => dayFmt.format(new Date(d))
      const nowParts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "numeric" }).formatToParts(new Date())
      const currentYear = Number(nowParts.find(p => p.type === "year")?.value)
      const currentMonth = Number(nowParts.find(p => p.type === "month")?.value)
      monthLabel = new Date(currentYear, currentMonth - 1, 1).toLocaleString("en", { month: "long", year: "numeric" })
      const monthKeyPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`

      const byDay = new Map<string, { pnl: number; count: number }>()
      for (const t of allClosed) {
        const key = localDayKey(t.entryAt)
        const cur = byDay.get(key) || { pnl: 0, count: 0 }
        cur.pnl += Number(t.netPnl || 0)
        cur.count += 1
        byDay.set(key, cur)
      }

      for (const [key, v] of byDay) {
        dailyPnlForCalendar[key] = v.pnl
        dailyTradeCountForCalendar[key] = v.count
        if (key.startsWith(monthKeyPrefix)) {
          monthPnl += v.pnl
          monthDays.push({ key, pnl: v.pnl })
          if (v.pnl > 0) greenDaysThisMonth += 1
        }
      }
      if (monthDays.length > 0) {
        bestDay = monthDays.reduce((a, b) => (b.pnl > a.pnl ? b : a))
        worstDay = monthDays.reduce((a, b) => (b.pnl < a.pnl ? b : a))
      }

      // Consecutive green days (ending today or yesterday)
      let cursor = new Date()
      if ((byDay.get(localDayKey(cursor))?.pnl || 0) <= 0) {
        cursor = new Date(Date.now() - MS_PER_DAY)
      }
      for (let i = 0; i < 730; i++) {
        const pnl = byDay.get(localDayKey(cursor))?.pnl
        if (pnl !== undefined && pnl > 0) streak += 1
        else break
        cursor = new Date(cursor.getTime() - MS_PER_DAY)
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>
        <Suspense fallback={<div className="skeleton" style={{ width: 120, height: 38 }} />}>
          <DashboardFilter accounts={filterAccounts} />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiGrid dateRange={dateRange} accountId={selectedAccountId} />
      </Suspense>

      {/* Goals & Streak */}
      <div className="dashboard-row-equal">
        <MonthlyGoalWidget monthPnl={monthPnl} initialGoal={monthlyGoal} monthLabel={monthLabel} />

        <div className="chart-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column" }}>
          <div className="section-label" style={{ marginBottom: "1rem" }}>
            {t("monthStats", { month: monthLabel })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", flex: 1 }}>
            <div className="card-hover" style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{t("greenStreak")}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: streak > 0 ? "var(--color-profit)" : "var(--color-gray-400)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                {streak}<span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-gray-500)", marginLeft: "0.3rem" }}>{t("days")}</span>
              </div>
            </div>
            <div className="card-hover" style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{t("greenDays")}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-gray-100)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                {greenDaysThisMonth}<span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-gray-500)", marginLeft: "0.3rem" }}>{t("thisMonth")}</span>
              </div>
            </div>
            <div className="card-hover" style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{t("bestDay")}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-profit)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                {bestDay ? formatCurrency(bestDay.pnl, "USD", true, 2) : "—"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 600, marginTop: "0.25rem" }}>
                {bestDay ? formatDay(bestDay.key) : t("noTrades")}
              </div>
            </div>
            <div className="card-hover" style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{t("worstDay")}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-loss)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                {worstDay ? formatCurrency(worstDay.pnl, "USD", true, 2) : "—"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 600, marginTop: "0.25rem" }}>
                {worstDay ? formatDay(worstDay.key) : t("noTrades")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Daily P&L and Win Rate */}
      <div className="dashboard-row-2-1">
        <div className="chart-card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="chart-title">{t("dailyNetPnl")}</div>
          <div style={{ flex: 1, minHeight: 280 }}>
            <Suspense fallback={<ChartSkeleton height={280} />}>
              <DailyPnlChartServer dateRange={dateRange} accountId={selectedAccountId} />
            </Suspense>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="chart-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="chart-title">{t("winRate")}</div>
            <div style={{ flex: 1, minHeight: 200 }}>
              <Suspense fallback={<ChartSkeleton height={200} />}>
                <WinRateChartServer dateRange={dateRange} accountId={selectedAccountId} />
              </Suspense>
            </div>
          </div>
          <DailyGoalWidget todayPnl={todayPnl} initialGoal={dailyGoal} />
        </div>
      </div>

      {/* Charts Row 2: Equity Curve & Setups */}
      <div className="dashboard-row-2-1" style={{ alignItems: "stretch" }}>
        <Suspense fallback={
          <div className="chart-card">
            <div className="chart-title">{t("equityCurve")}</div>
            <ChartSkeleton height={300} />
          </div>
        }>
          <EquityCurveChart />
        </Suspense>
        
        <Suspense fallback={
          <div className="chart-card" style={{ minHeight: 300 }}>
            <div className="chart-title">{t("perfBySetup")}</div>
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
            <div className="chart-title">{t("perfByHour")}</div>
            <ChartSkeleton height={180} />
          </div>
        }>
          <HourHeatmap />
        </Suspense>
      </div>

      {/* Mini Calendar & Macro Events */}
      <div className="dashboard-row-2-1" style={{ marginBottom: "1.5rem" }}>
        <div className="chart-card" style={{ flex: 2 }}>
          <div className="chart-title">{t("tradingCalendar")}</div>
          <MiniCalendar dailyPnl={dailyPnlForCalendar} dailyTradeCount={dailyTradeCountForCalendar} />
        </div>
        <div style={{ flex: 1 }}>
          <EconomicCalendarWidget limit={4} />
        </div>
      </div>

      {/* Recent Trades */}
      <div className="chart-card">
        <div className="chart-title">{t("recentTrades")}</div>
        <Suspense fallback={<TableSkeleton />}>
          <RecentTradesTable dateRange={dateRange} accountId={selectedAccountId} />
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

function formatDay(key: string): string {
  const d = new Date(key + "T12:00:00Z")
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
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
