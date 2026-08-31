import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveAccountScope } from "@/lib/active-account"
import { formatCurrency, formatDateWithTimezone } from "@/lib/formatters"
import { cookies } from "next/headers"
import Link from "next/link"
import type { Prisma } from "@prisma/client"

export async function RecentTradesTable({
  dateRange,
  accountId,
}: {
  dateRange?: { from?: Date; to?: Date }
  accountId?: string | null | "all"
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const scope = await resolveAccountScope(session.user.id, accountId)

  const cookieStore = await cookies()
  const density = cookieStore.get("ui_density")?.value === "compact" ? "compact" : "comfortable"

  if (scope.accounts.length === 0) return <EmptyTable />

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
    orderBy: { entryAt: "desc" },
    take: 5
  })

  if (trades.length === 0) return <EmptyTable />
  const currency = scope.currency

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
                <Link href={`/trades?id=${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>
                    {formatDateWithTimezone(t.exitAt ?? t.entryAt, user?.timezone)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                    {new Date(t.exitAt ?? t.entryAt).toLocaleTimeString([], { timeZone: user?.timezone, hour: '2-digit', minute: '2-digit' })}
                  </div>
                </Link>
              </td>
              <td>
                <Link href={`/trades?id=${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <span style={{ fontWeight: 600 }}>{t.symbol}</span>
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                    {t.instrumentType}
                  </span>
                </Link>
              </td>
              <td>
                <Link href={`/trades?id=${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <span className={`badge ${t.side === 'LONG' ? 'badge-profit' : 'badge-loss'}`}>
                    {t.side}
                  </span>
                </Link>
              </td>
              <td><Link href={`/trades?id=${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>{formatCurrency(Number(t.entryPrice), currency, false, 2)}</Link></td>
              <td><Link href={`/trades?id=${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>{t.exitPrice ? formatCurrency(Number(t.exitPrice), currency, false, 2) : "—"}</Link></td>
              <td style={{ textAlign: "right" }}>
                <Link href={`/trades?id=${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <span style={{ 
                    fontWeight: 600, 
                    color: Number(t.netPnl) > 0 ? "var(--color-profit)" : Number(t.netPnl) < 0 ? "var(--color-loss)" : "inherit" 
                  }}>
                    {formatCurrency(Number(t.netPnl), currency, true, 2)}
                  </span>
                </Link>
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
