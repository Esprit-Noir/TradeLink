import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"
import { resolveAccountScope } from "@/lib/active-account"
import { DailyPnlChart } from "./LazyCharts"

export async function DailyPnlChartServer({
  dateRange,
  accountId,
}: {
  dateRange?: { from?: Date; to?: Date }
  accountId?: string | null | "all"
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const scope = await resolveAccountScope(session.user.id, accountId)

  if (scope.accounts.length === 0) return <DailyPnlChart trades={[]} />

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  })

  const whereClause: Prisma.TradeWhereInput = scope.all
    ? { userId: session.user.id, status: "closed" }
    : { accountId: scope.accounts[0].id, status: "closed" }
  if (dateRange?.from || dateRange?.to) {
    whereClause.entryAt = {}
    if (dateRange.from) whereClause.entryAt.gte = dateRange.from
    if (dateRange.to) whereClause.entryAt.lte = dateRange.to
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    select: { entryAt: true, exitAt: true, netPnl: true },
    orderBy: { entryAt: "asc" }
  })

  const serializedTrades = trades.map(t => ({
    exitAt: t.exitAt ?? t.entryAt,
    netPnl: Number(t.netPnl || 0)
  }))

  return <DailyPnlChart trades={serializedTrades} currency={scope.currency} timezone={user?.timezone ?? "UTC"} />
}
