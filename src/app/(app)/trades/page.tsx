import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AddTradeModal } from "@/components/trades/AddTradeModal"
import { TradesFilter } from "@/components/trades/TradesFilter"
import { TradesTable } from "@/components/trades/TradesTable"
import { TradeDetailsDrawer } from "@/components/trades/TradeDetailsDrawer"
import { cookies } from "next/headers"

export const metadata = {
  title: "All Trades",
}

const ITEMS_PER_PAGE = 20

const SORTABLE: Record<string, "asc" | "desc"> = {
  entryAt: "desc",
  symbol: "asc",
  side: "asc",
  quantity: "asc",
  entryPrice: "asc",
  exitPrice: "asc",
  netPnl: "asc",
}

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; symbol?: string; side?: string; result?: string; date?: string; status?: string; tradeId?: string; sort?: string; dir?: string; accountId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })

  const cookieStore = await cookies()
  const density = cookieStore.get("ui_density")?.value === "compact" ? "compact" : "comfortable"

  const searchParamsObj = await searchParams
  const currentPage = Number(searchParamsObj?.page) || 1
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  const whereClause: any = { userId: session.user.id }
  let baseCurrency: string | undefined
  if (searchParamsObj?.accountId) {
    whereClause.accountId = searchParamsObj.accountId
    const acct = await prisma.tradingAccount.findUnique({ where: { id: searchParamsObj.accountId }, select: { baseCurrency: true } })
    baseCurrency = acct?.baseCurrency ?? undefined
  } else {
    const defaultAcct = await prisma.tradingAccount.findFirst({ where: { userId: session.user.id, isDefault: true }, select: { baseCurrency: true } })
    baseCurrency = defaultAcct?.baseCurrency ?? undefined
  }

  if (searchParamsObj?.symbol) {
    whereClause.symbol = { contains: searchParamsObj.symbol, mode: "insensitive" }
  }
  if (searchParamsObj?.side) {
    whereClause.side = searchParamsObj.side
  }
  if (searchParamsObj?.status) {
    whereClause.status = searchParamsObj.status
  }

  // Fetch all user accounts for the filter dropdown
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, isDefault: true },
    orderBy: { createdAt: "asc" },
  })

  if (searchParamsObj?.result) {
    if (searchParamsObj.result === "win") {
      whereClause.netPnl = { gt: 0 }
    } else if (searchParamsObj.result === "loss") {
      whereClause.netPnl = { lt: 0 }
    } else if (searchParamsObj.result === "be") {
      whereClause.netPnl = { equals: 0 }
    }
  }

  if (searchParamsObj?.date) {
    const now = new Date()
    if (searchParamsObj.date === "today") {
      whereClause.entryAt = { gte: new Date(now.setHours(0, 0, 0, 0)) }
    } else if (searchParamsObj.date === "7d") {
      const past = new Date()
      past.setDate(past.getDate() - 7)
      whereClause.entryAt = { gte: past }
    } else if (searchParamsObj.date === "30d") {
      const past = new Date()
      past.setDate(past.getDate() - 30)
      whereClause.entryAt = { gte: past }
    } else if (searchParamsObj.date === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      whereClause.entryAt = { gte: startOfMonth }
    }
  }

  const rawSort = searchParamsObj?.sort
  const sortKey: string = rawSort && SORTABLE[rawSort] ? rawSort : "entryAt"
  const sortDir: "asc" | "desc" = searchParamsObj?.dir === "asc" ? "asc" : SORTABLE[rawSort || "entryAt"] === "asc" ? "asc" : "desc"

  // Filtered-set totals (independent of pagination)
  const [agg, winCount, lossCount] = await Promise.all([
    prisma.trade.aggregate({ where: whereClause, _sum: { netPnl: true }, _count: true }),
    prisma.trade.count({ where: { ...whereClause, netPnl: { gt: 0 } } }),
    prisma.trade.count({ where: { ...whereClause, netPnl: { lt: 0 } } }),
  ])

  const totals = {
    count: agg._count,
    netPnl: Number(agg._sum.netPnl || 0),
    wins: winCount,
    losses: lossCount,
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    orderBy: { [sortKey]: sortDir },
    skip,
    take: ITEMS_PER_PAGE,
    include: { screenshots: true },
  })

  const totalTrades = totals.count
  const totalPages = Math.ceil(totalTrades / ITEMS_PER_PAGE)

  const serialized = trades.map((t) => ({
    ...t,
    quantity: Number(t.quantity || 0),
    entryPrice: Number(t.entryPrice || 0),
    exitPrice: t.exitPrice ? Number(t.exitPrice) : null,
    grossPnl: t.grossPnl ? Number(t.grossPnl) : null,
    fees: Number(t.fees || 0),
    netPnl: t.netPnl ? Number(t.netPnl) : null,
    netPnlUsd: t.netPnlUsd ? Number(t.netPnlUsd) : null,
    stopLoss: t.stopLoss ? Number(t.stopLoss) : null,
    riskAmount: t.riskAmount ? Number(t.riskAmount) : null,
    screenshots: (t.screenshots || []).map((s: any) => s),
  }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Trades</h1>
          <p className="page-subtitle">Detailed view of all your trading history.</p>
        </div>
        <div className="actions">
          <AddTradeModal />
        </div>
      </div>

      <Suspense fallback={<div className="skeleton" style={{ height: 80, marginBottom: "1.5rem" }} />}>
        <TradesFilter accounts={accounts} />
      </Suspense>

      <Suspense fallback={<div className="skeleton" style={{ height: 400, marginBottom: "1.5rem" }} />}>
        <TradesTable
          trades={serialized}
          totals={totals}
          density={density}
          timezone={user?.timezone}
          baseCurrency={baseCurrency}
          sortKey={sortKey}
          sortDir={sortDir}
          currentPage={currentPage}
          totalPages={totalPages}
          totalTrades={totalTrades}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Suspense>

      <Suspense fallback={null}>
        <TradeDetailsDrawer />
      </Suspense>
    </div>
  )
}
