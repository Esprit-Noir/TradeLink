import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { JournalForm } from "@/components/journal/JournalForm"
import { TradeRow } from "@/components/trades/TradeRow"
import Link from "next/link"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  return { title: `Journal - ${date}` }
}

export default async function JournalDatePage({ params }: { params: Promise<{ date: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { date } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound()
  }

  // Fetch the journal entry if it exists
  const journal = await prisma.dailyJournal.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date,
      },
    },
  })

  // Fetch trades for this day
  const targetDate = new Date(date)
  const nextDate = new Date(targetDate)
  nextDate.setDate(nextDate.getDate() + 1)

  const account = await prisma.tradingAccount.findFirst({
    where: { userId: session.user.id, isDefault: true },
  })

  const trades = await prisma.trade.findMany({
    where: {
      userId: session.user.id,
      accountId: account?.id,
      entryAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
    orderBy: { entryAt: "asc" },
    include: { screenshots: true },
  })

  // Calculate daily stats
  const totalTrades = trades.length
  const winningTrades = trades.filter(t => Number(t.netPnl) > 0).length
  const dailyPnl = trades.reduce((acc, t) => acc + Number(t.netPnl || 0), 0)
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

  // Date object for navigation
  const prevDate = new Date(targetDate)
  prevDate.setDate(prevDate.getDate() - 1)
  const nextNavDate = new Date(targetDate)
  nextNavDate.setDate(nextNavDate.getDate() + 1)

  const prevDateStr = prevDate.toISOString().split("T")[0]
  const nextDateStr = nextNavDate.toISOString().split("T")[0]

  const displayDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.25rem" }}>
            <Link href="/calendar" className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }}>
              ← Calendar
            </Link>
            <h1 className="page-title">{displayDate}</h1>
          </div>
        </div>
        <div className="actions" style={{ display: "flex", gap: "0.5rem" }}>
          <Link href={`/journal/${prevDateStr}`} className="btn btn-secondary btn-sm">
            ← Prev Day
          </Link>
          <Link href={`/journal/${nextDateStr}`} className="btn btn-secondary btn-sm">
            Next Day →
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Daily Stats Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="kpi-card">
            <div className="kpi-label">Daily P&L</div>
            <div className={`kpi-value ${dailyPnl > 0 ? "profit" : dailyPnl < 0 ? "loss" : ""}`}>
              {dailyPnl > 0 ? "+" : ""}${dailyPnl.toFixed(2)}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Win Rate</div>
            <div className="kpi-value">{winRate.toFixed(1)}%</div>
            <div className="kpi-sub">{winningTrades} W / {totalTrades - winningTrades} L</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Trades</div>
            <div className="kpi-value">{totalTrades}</div>
          </div>
        </div>

        {/* Journal Form */}
        <div>
          <JournalForm date={date} initialData={journal} />
        </div>
      </div>

      {/* Daily Trades Table */}
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: "1rem" }}>
        Trades on {displayDate}
      </h3>
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
                    <p>No trades executed on this day.</p>
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
    </div>
  )
}
