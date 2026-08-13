// components/dashboard/RecentTradesTable.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function RecentTradesTable() {
  const session = await auth()
  if (!session?.user?.id) return null

  const account = await prisma.tradingAccount.findFirst({
    where: { userId: session.user.id, isDefault: true },
  })

  if (!account) return <EmptyTable />

  const trades = await prisma.trade.findMany({
    where: { accountId: account.id, status: "closed" },
    orderBy: { exitAt: "desc" },
    take: 10,
  })

  if (trades.length === 0) return <EmptyTable />

  return (
    <div className="table-wrapper">
      <table className="data-table">
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
                  {new Date(t.exitAt).toLocaleDateString()}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                  {new Date(t.exitAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <td>${t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
              <td>${t.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
              <td style={{ textAlign: "right" }}>
                <span style={{ 
                  fontWeight: 600, 
                  color: Number(t.netPnl) > 0 ? "var(--color-profit)" : Number(t.netPnl) < 0 ? "var(--color-loss)" : "inherit" 
                }}>
                  {Number(t.netPnl) > 0 ? "+" : ""}${Number(t.netPnl).toFixed(2)}
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
