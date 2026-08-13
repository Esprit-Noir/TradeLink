import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CalendarView } from "@/components/calendar/CalendarView"
import { getActiveAccount } from "@/lib/active-account"
import { dayKey } from "@/lib/dates"

export const metadata = {
  title: "P&L Calendar",
}

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [user, account] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { timezone: true } }),
    getActiveAccount(session.user.id),
  ])
  const timezone = user?.timezone ?? "UTC"

  let trades: any[] = []
  if (account) {
    // Fetch all closed trades to calculate daily P&L
    trades = await prisma.trade.findMany({
      where: { accountId: account.id, status: "closed" },
      select: {
        exitAt: true,
        netPnl: true,
      },
    })
  }

  // Aggregate P&L by day (YYYY-MM-DD in the user's timezone)
  const dailyPnl = trades.reduce((acc, trade) => {
    if (!trade.exitAt) return acc // Guard: skip open trades
    const dateStr = dayKey(new Date(trade.exitAt), timezone)
    if (!acc[dateStr]) {
      acc[dateStr] = 0
    }
    acc[dateStr] += Number(trade.netPnl)
    return acc
  }, {} as Record<string, number>)

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">P&L Calendar</h1>
          <p className="page-subtitle">Visualize your daily performance and consistency.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <CalendarView dailyPnl={dailyPnl} propDailyPnl={propDailyPnl} />
      </div>
    </div>
  )
}
