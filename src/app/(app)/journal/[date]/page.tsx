import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/formatters"
import { JournalForm } from "@/components/journal/JournalForm"
import { TradeRow } from "@/components/trades/TradeRow"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getActiveAccount } from "@/lib/active-account"
import { dayKey, zonedTimeToUtc, nextMidnightInTz } from "@/lib/dates"

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  return { title: `Journal - ${date}` }
}

export default async function JournalDatePage({ params }: { params: Promise<{ date: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { date } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound()
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  })
  const timezone = user?.timezone ?? "UTC"

  // Fetch the journal entry if it exists
  const journal = await prisma.dailyJournal.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date,
      },
    },
  })

  // Fetch trades for this day (day boundaries in the user's timezone)
  const targetStart = zonedTimeToUtc(new Date(`${date}T00:00:00`), timezone)
  const targetEnd = nextMidnightInTz(targetStart, timezone)

  const account = await getActiveAccount(session.user.id)

  const trades = await prisma.trade.findMany({
    where: {
      userId: session.user.id,
      accountId: account?.id,
      entryAt: {
        gte: targetStart,
        lt: targetEnd,
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

  // Date object for navigation (string arithmetic is DST-safe)
  const [ny, nm, nd] = date.split("-").map(Number)
  const prevDateStr = dayKey(new Date(Date.UTC(ny, nm - 1, nd - 1, 0, 0, 0, 0)), "UTC")
  const nextDateStr = dayKey(new Date(Date.UTC(ny, nm - 1, nd + 1, 0, 0, 0, 0)), "UTC")

  // Prop firm daily snapshots for this day (UTC calendar day)
  const dayStartUtc = new Date(Date.UTC(ny, nm - 1, nd, 0, 0, 0, 0))
  const dayEndUtc = new Date(Date.UTC(ny, nm - 1, nd + 1, 0, 0, 0, 0))
  const propSnapshots = await prisma.propChallengeDailySnapshot.findMany({
    where: {
      challenge: { userId: session.user.id },
      date: { gte: dayStartUtc, lt: dayEndUtc },
    },
    include: { challenge: { include: { template: true, account: true } } },
  })

  const displayDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    timeZone: timezone,
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
              {formatCurrency(dailyPnl, "USD", true, 2)}
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

          {propSnapshots.length > 0 && (
            <div className="chart-card" style={{ padding: "1rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
                Prop Firm P&L
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {propSnapshots.map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--color-gray-300)" }}>
                      {s.challenge.template.logoUrl ? (
                        <img src={s.challenge.template.logoUrl} alt="" style={{ width: "16px", height: "16px", objectFit: "contain", marginRight: "0.35rem", verticalAlign: "middle", borderRadius: "3px" }} />
                      ) : null}
                      {s.challenge.template.firmName}
                    </span>
                    <span style={{
                      fontWeight: 600,
                      color: Number(s.dailyPnl) > 0 ? "var(--color-profit)" : Number(s.dailyPnl) < 0 ? "var(--color-loss)" : "var(--color-gray-400)",
                    }}>
                      {formatCurrency(Number(s.dailyPnl), "USD", true, 2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  entryAt: t.entryAt,
                  status: t.status,
                  setupTags: t.setupTags,
                  emotionTags: t.emotionTags,
                  screenshots: (t.screenshots || []).map((s: { id: string }) => ({ id: s.id })),
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
