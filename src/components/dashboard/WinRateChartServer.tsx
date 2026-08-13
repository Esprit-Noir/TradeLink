import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { WinRateDonut } from "./WinRateDonut"
import { getActiveAccount } from "@/lib/active-account"

export async function WinRateChartServer({
  dateRange
}: {
  dateRange?: { from?: Date; to?: Date }
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const account = await getActiveAccount(session.user.id)

  if (!account) return <WinRateDonut wins={0} losses={0} />

  const whereClause: any = { accountId: account.id, status: "closed" }
  if (dateRange?.from || dateRange?.to) {
    whereClause.entryAt = {}
    if (dateRange.from) whereClause.entryAt.gte = dateRange.from
    if (dateRange.to) whereClause.entryAt.lte = dateRange.to
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    select: { netPnl: true }
  })

  const wins = trades.filter((t) => Number(t.netPnl || 0) > 0).length
  const losses = trades.filter((t) => Number(t.netPnl || 0) <= 0).length // Assuming break-even is a loss or neutral, but we'll count it as loss for now, or just <= 0. Actually, let's just use < 0 for losses.
  const actualLosses = trades.filter((t) => Number(t.netPnl || 0) < 0).length

  return <WinRateDonut wins={wins} losses={actualLosses} />
}
