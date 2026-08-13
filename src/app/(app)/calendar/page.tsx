import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CalendarView } from "@/components/calendar/CalendarView"
import { getActiveAccount } from "@/lib/active-account"

export const metadata = {
  title: "P&L Calendar",
}

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const account = await getActiveAccount(session.user.id)

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

  // Aggregate P&L by day (YYYY-MM-DD)
  const dailyPnl = trades.reduce((acc, trade) => {
    if (!trade.exitAt) return acc // Guard: skip open trades
    const dateStr = new Date(trade.exitAt).toISOString().split("T")[0]
    if (!acc[dateStr]) {
      acc[dateStr] = 0
    }
    acc[dateStr] += Number(trade.netPnl)
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
        <CalendarView dailyPnl={dailyPnl} />
      </div>
    </div>
  )
}
