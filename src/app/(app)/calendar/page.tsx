import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CalendarView } from "@/components/calendar/CalendarView"
import { CalendarFilter } from "@/components/calendar/CalendarFilter"
import { getActiveAccount, resolveAccountScope } from "@/lib/active-account"
import { dayKey } from "@/lib/dates"

export const metadata = {
  title: "P&L Calendar",
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const searchParamsObj = await searchParams
  const accountIdParam = typeof searchParamsObj?.accountId === "string" ? searchParamsObj.accountId : ""

  const [user, scope] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { timezone: true } }),
    resolveAccountScope(session.user.id, accountIdParam),
  ])
  const timezone = user?.timezone ?? "UTC"

  // Resolve which accountId to pass to the client component for detailing
  const activeAccount = await getActiveAccount(session.user.id)
  const selectedAccountId = accountIdParam === "all"
    ? "all"
    : accountIdParam
      ? (scope.accounts[0]?.id ?? null)
      : (activeAccount?.id ?? null)

  let trades: any[] = []
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

  // Aggregate prop challenge daily snapshots (keyed by UTC calendar day)
  const propSnapshots = await prisma.propChallengeDailySnapshot.findMany({
    where: {
      challenge: { userId: session.user.id },
    },
    select: {
      date: true,
      dailyPnl: true,
      challenge: { select: { id: true, account: { select: { name: true } } } },
    },
  })

  const propDailyPnl = propSnapshots.reduce((acc, s) => {
    const dateStr = dayKey(s.date, "UTC")
    if (!acc[dateStr]) acc[dateStr] = 0
    acc[dateStr] += Number(s.dailyPnl)
    return acc
  }, {} as Record<string, number>)

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
        <CalendarFilter accounts={filterAccounts} />
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <CalendarView dailyPnl={dailyPnl} dailyTradeCount={dailyTradeCount} propDailyPnl={propDailyPnl} accountId={selectedAccountId || undefined} />
      </div>
    </div>
  )
}
