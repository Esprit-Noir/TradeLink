import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AddTradeModal } from "@/components/trades/AddTradeModal"
import { DeleteTradeButton } from "@/components/trades/DeleteTradeButton"
import { TradesFilter } from "@/components/trades/TradesFilter"

import Link from "next/link"

export const metadata = {
  title: "All Trades",
}

const ITEMS_PER_PAGE = 20

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; symbol?: string; side?: string }>
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

  const whereClause: any = { accountId: account?.id }
  if (searchParamsObj?.symbol) {
    whereClause.symbol = { contains: searchParamsObj.symbol, mode: "insensitive" }
  }
  if (searchParamsObj?.side) {
    whereClause.side = searchParamsObj.side
  }

  if (account) {
    totalTrades = await prisma.trade.count({
      where: whereClause,
    })
    
    trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { entryAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
      include: { screenshots: true }
    })
  }

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
              trades.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>
                      {new Date(t.entryAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                      {new Date(t.entryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600 }}>{t.symbol}</span>
                      {t.screenshots && t.screenshots.length > 0 && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-brand-500)" }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                      {t.instrumentType}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.side === 'LONG' ? 'badge-profit' : 'badge-loss'}`}>
                      {t.side}
                    </span>
                  </td>
                  <td>{Number(t.quantity).toString()}</td>
                  <td>${Number(t.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                  <td>${t.exitPrice ? Number(t.exitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ 
                      fontWeight: 600, 
                      color: Number(t.netPnl) > 0 ? "var(--color-profit)" : Number(t.netPnl) < 0 ? "var(--color-loss)" : "inherit" 
                    }}>
                      {Number(t.netPnl) > 0 ? "+" : ""}${Number(t.netPnl).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", width: "40px" }}>
                    <DeleteTradeButton id={t.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination UI */}
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
    </div>
  )
}
