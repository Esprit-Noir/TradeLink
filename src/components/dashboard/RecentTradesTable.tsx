import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveAccount } from "@/lib/active-account"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"
import { cookies } from "next/headers"

export async function RecentTradesTable({
  dateRange
}: {
  dateRange?: { from?: Date; to?: Date }
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const account = await getActiveAccount(session.user.id)
  
  const cookieStore = await cookies()
  const density = cookieStore.get("ui_density")?.value === "compact" ? "compact" : "comfortable"

  if (!account) return <EmptyTable />

  const whereClause: any = { accountId: account.id, status: "closed" }
  if (dateRange?.from || dateRange?.to) {
    whereClause.entryAt = {}
    if (dateRange.from) whereClause.entryAt.gte = dateRange.from
    if (dateRange.to) whereClause.entryAt.lte = dateRange.to
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    orderBy: { entryAt: "desc" },
    take: 5
  })

  if (trades.length === 0) return <EmptyTable />

  return (
    <div className="table-wrapper">
      <table className={`data-table ${density}`}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Entry</th>
            <th>Exit</th>
            <th style={{ textAlign: "right" }}>P&L</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id}>
              <td>
                <div style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>
                  {formatDateWithTimezone(t.exitAt ?? t.entryAt, user?.timezone)}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                  {new Date(t.exitAt ?? t.entryAt).toLocaleTimeString([], { timeZone: user?.timezone, hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td>
                <span style={{ fontWeight: 600 }}>{t.symbol}</span>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                  {t.instrumentType}
                </span>
              </td>
              <td>
                <span className={`badge ${t.side === 'LONG' ? 'badge-profit' : 'badge-loss'}`}>
                  {t.side}
                </span>
              </td>
              <td>{formatCurrency(Number(t.entryPrice), account.baseCurrency, false, 2)}</td>
              <td>{t.exitPrice ? formatCurrency(Number(t.exitPrice), account.baseCurrency, false, 2) : "—"}</td>
              <td style={{ textAlign: "right" }}>
                <span style={{ 
                  fontWeight: 600, 
                  color: Number(t.netPnl) > 0 ? "var(--color-profit)" : Number(t.netPnl) < 0 ? "var(--color-loss)" : "inherit" 
                }}>
                  {formatCurrency(Number(t.netPnl), account.baseCurrency, true, 2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyTable() {
  return (
    <div className="empty-state" style={{ padding: "3rem" }}>
      <p>No recent trades found.</p>
    </div>
  )
}
