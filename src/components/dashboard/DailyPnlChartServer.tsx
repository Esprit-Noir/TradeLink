import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DailyPnlChart } from "./DailyPnlChart"

export async function DailyPnlChartServer({
  dateRange
}: {
  dateRange?: { from?: Date; to?: Date }
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const account = await prisma.tradingAccount.findFirst({
    where: { userId: session.user.id, isDefault: true },
  })

  if (!account) return <DailyPnlChart trades={[]} />

  const whereClause: any = { accountId: account.id, status: "closed" }
  if (dateRange?.from || dateRange?.to) {
    whereClause.entryAt = {}
    if (dateRange.from) whereClause.entryAt.gte = dateRange.from
    if (dateRange.to) whereClause.entryAt.lte = dateRange.to
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    select: { entryAt: true, netPnl: true },
    orderBy: { entryAt: "asc" }
  })

  // We need to pass the raw data, but it needs to be serialized for the client component
  const serializedTrades = trades.map(t => ({
    exitAt: t.entryAt,
    netPnl: Number(t.netPnl || 0)
  }))

  return <DailyPnlChart trades={serializedTrades} currency={account.baseCurrency} />
}
