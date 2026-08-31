import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CalendarView } from "@/components/calendar/CalendarView"
import { CalendarFilter } from "@/components/calendar/CalendarFilter"
import { EconomicCalendarWidget } from "@/components/calendar/EconomicCalendarWidget"
import { resolveAccountScope } from "@/lib/active-account"
import { dayKey } from "@/lib/dates"
import type { Prisma } from "@prisma/client"

export const metadata = {
  title: "P&L Calendar",
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const searchParamsObj = await searchParams
  const accountIdParam = typeof searchParamsObj?.accountId === "string" ? searchParamsObj.accountId : "all"

  const [user, scope] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { timezone: true } }),
    resolveAccountScope(session.user.id, accountIdParam),
  ])
  const timezone = user?.timezone ?? "UTC"

  // Resolve which accountId to pass to the client component for detailing
  const selectedAccountId = accountIdParam === "all"
    ? "all"
    : accountIdParam
      ? (scope.accounts[0]?.id ?? null)
      : null

  let trades: Prisma.TradeGetPayload<{ select: { exitAt: true; netPnl: true } }>[] = []
  if (scope.all) {
    trades = await prisma.trade.findMany({
      where: { userId: session.user.id, status: "closed" },
      select: {
        exitAt: true,
        netPnl: true,
      },
    })
  } else if (scope.accounts.length > 0) {
    trades = await prisma.trade.findMany({
      where: { accountId: scope.accounts[0].id, status: "closed" },
      select: {
        exitAt: true,
        netPnl: true,
      },
    })
  }

  // Aggregate P&L and trade counts by day (YYYY-MM-DD in the user's timezone)
  const dailyPnl: Record<string, number> = {}
  const dailyTradeCount: Record<string, number> = {}

  for (const trade of trades) {
    if (!trade.exitAt) continue // Guard: skip open trades
    const dateStr = dayKey(new Date(trade.exitAt), timezone)
    if (dailyPnl[dateStr] === undefined) {
      dailyPnl[dateStr] = 0
      dailyTradeCount[dateStr] = 0
    }
    dailyPnl[dateStr] += Number(trade.netPnl)
    dailyTradeCount[dateStr] += 1
  }

  // Retrieve accounts for the filter dropdown
  const filterAccounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, isDefault: true },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">P&L Calendar</h1>
          <p className="page-subtitle">Visualize your daily performance and consistency.</p>
        </div>
        <Suspense fallback={null}>
          <CalendarFilter accounts={filterAccounts} />
        </Suspense>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <CalendarView dailyPnl={dailyPnl} dailyTradeCount={dailyTradeCount} accountId={selectedAccountId || undefined} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <EconomicCalendarWidget limit={8} />
        </div>
      </div>
    </div>
  )
}
