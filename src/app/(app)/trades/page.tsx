import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AddTradeModal } from "@/components/trades/AddTradeModal"
import { DeleteTradeButton } from "@/components/trades/DeleteTradeButton"
import { TradesFilter } from "@/components/trades/TradesFilter"
import { TradeRow } from "@/components/trades/TradeRow"
import { TradeDetailsDrawer } from "@/components/trades/TradeDetailsDrawer"

import Link from "next/link"

export const metadata = {
  title: "All Trades",
}

const ITEMS_PER_PAGE = 20

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; symbol?: string; side?: string; result?: string; date?: string; tradeId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const account = await prisma.tradingAccount.findFirst({
    where: { userId: session.user.id, isDefault: true },
  })

  let trades: any[] = []
  let totalTrades = 0
  
  const searchParamsObj = await searchParams
  const currentPage = Number(searchParamsObj?.page) || 1
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  // Always scope to the authenticated user for security
  const whereClause: any = { userId: session.user.id }
  if (account) whereClause.accountId = account.id
  
  if (searchParamsObj?.symbol) {
    whereClause.symbol = { contains: searchParamsObj.symbol, mode: "insensitive" }
  }
  if (searchParamsObj?.side) {
    whereClause.side = searchParamsObj.side
  }

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

  totalTrades = await prisma.trade.count({ where: whereClause })
  trades = await prisma.trade.findMany({
    where: whereClause,
    orderBy: { entryAt: "desc" },
    skip,
    take: ITEMS_PER_PAGE,
    include: { screenshots: true }
  })

  const totalPages = Math.ceil(totalTrades / ITEMS_PER_PAGE)

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
        <TradesFilter />
      </Suspense>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entry Time</th>
              <th>Symbol</th>
              <th>Instrument</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Entry Price</th>
              <th>Exit Price</th>
              <th style={{ textAlign: "right" }}>Net P&L</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "3rem" }}>
                  <div className="empty-state">
                    <p>No trades found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              trades.map((t) => {
                const serializedTrade = {
                  ...t,
                  quantity: t.quantity ? Number(t.quantity) : 0,
                  entryPrice: t.entryPrice ? Number(t.entryPrice) : 0,
                  exitPrice: t.exitPrice ? Number(t.exitPrice) : null,
                  grossPnl: t.grossPnl ? Number(t.grossPnl) : null,
                  fees: t.fees ? Number(t.fees) : 0,
                  netPnl: t.netPnl ? Number(t.netPnl) : null,
                  netPnlUsd: t.netPnlUsd ? Number(t.netPnlUsd) : null,
                  stopLoss: t.stopLoss ? Number(t.stopLoss) : null,
                  riskAmount: t.riskAmount ? Number(t.riskAmount) : null,
                }
                return <TradeRow key={t.id} trade={serializedTrade} />
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0.5rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)" }}>
            Showing {skip + 1} to {Math.min(skip + ITEMS_PER_PAGE, totalTrades)} of {totalTrades} trades
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {currentPage > 1 ? (
              <Link href={`/trades?page=${currentPage - 1}`} className="btn btn-secondary">
                Previous
              </Link>
            ) : (
              <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                Previous
              </button>
            )}
            
            <div style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--color-gray-200)" }}>
              Page {currentPage} of {totalPages}
            </div>

            {currentPage < totalPages ? (
              <Link href={`/trades?page=${currentPage + 1}`} className="btn btn-secondary">
                Next
              </Link>
            ) : (
              <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                Next
              </button>
            )}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <TradeDetailsDrawer />
      </Suspense>
    </div>
  )
}
