import { prisma } from "@/lib/prisma"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

export default async function AdminDashboardPage() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Parallel queries for KPIs
  const [
    totalUsers,
    activeUsers7d,
    activeUsers30d,
    totalTrades,
    totalBacktestSessions,
    totalTickets,
    openTickets,
    usersByRole,
    recentSignups,
    tradesByDay,
  ] = await Promise.all([
    // Total users (excluding soft deleted)
    prisma.user.count({ where: { deletedAt: null } }),

    // Active users (logged in last 7 days)
    prisma.user.count({
      where: { lastLoginAt: { gte: sevenDaysAgo }, deletedAt: null },
    }),

    // Active users (logged in last 30 days)
    prisma.user.count({
      where: { lastLoginAt: { gte: thirtyDaysAgo }, deletedAt: null },
    }),

    // Total trades (excluding backtest)
    prisma.trade.count({ where: { source: { not: "backtest" } } }),

    // Total backtest sessions
    prisma.backtestSession.count(),

    // Total support tickets
    prisma.supportTicket.count(),

    // Open support tickets
    prisma.supportTicket.count({ where: { status: "OPEN" } }),

    // Users by role
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
      where: { deletedAt: null },
    }),

    // Recent signups (last 30 days, grouped by day)
    prisma.user.groupBy({
      by: ["createdAt"],
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),

    // Trades by day (last 30 days)
    prisma.trade.groupBy({
      by: ["entryAt"],
      _count: true,
      where: {
        entryAt: { gte: thirtyDaysAgo },
        source: { not: "backtest" },
      },
      orderBy: { entryAt: "asc" },
    }),
  ])

  // Process signups by day
  const signupsByDay = recentSignups.map(item => ({
    date: item.createdAt.toISOString().split("T")[0],
    count: item._count,
  }))

  // Process trades by day
  const tradesByDayProcessed = tradesByDay.map(item => ({
    date: item.entryAt.toISOString().split("T")[0],
    count: item._count,
  }))

  // Aggregate signups by week
  const signupsByWeek: Record<string, number> = {}
  recentSignups.forEach(item => {
    const date = new Date(item.createdAt)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toISOString().split("T")[0]
    signupsByWeek[key] = (signupsByWeek[key] || 0) + item._count
  })

  const kpis = {
    totalUsers,
    activeUsers7d,
    activeUsers30d,
    totalTrades,
    totalBacktestSessions,
    totalTickets,
    openTickets,
  }

  const charts = {
    signupsByDay,
    tradesByDay: tradesByDayProcessed,
    signupsByWeek: Object.entries(signupsByWeek).map(([date, count]) => ({ date, count })),
    usersByRole: usersByRole.map(item => ({ role: item.role, count: item._count })),
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and key metrics</p>
      </div>
      <AdminDashboardClient kpis={kpis} charts={charts} />
    </div>
  )
}
