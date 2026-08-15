import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReplayWorkbench } from "@/components/backtest/ReplayWorkbench"
import type { BacktestSessionItem } from "@/components/backtest/types"
import { sanitizeSymbol } from "@/lib/market/symbols"

export const dynamic = "force-dynamic"

export default async function BacktestPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { symbol } = await searchParams
  const initialSymbol = sanitizeSymbol(symbol ?? "") ?? "XAU/USD"

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  })
  const timezone = user?.timezone ?? "UTC"

  const sessions = await prisma.backtestSession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      symbol: true,
      timeframe: true,
      tradesCount: true,
      closedPnl: true,
      createdAt: true,
    },
  })

  const pastSessions: BacktestSessionItem[] = sessions.map((s) => ({
    id: s.id,
    symbol: s.symbol,
    timeframe: s.timeframe,
    tradesCount: s.tradesCount,
    closedPnl: s.closedPnl ? Number(s.closedPnl) : null,
    createdAt: s.createdAt.toISOString(),
  }))

  const backtestAccount = await prisma.tradingAccount.findFirst({
    where: {
      userId: session.user.id,
      type: "backtest",
    },
    include: {
      trades: {
        where: { status: "closed" },
        select: { netPnl: true },
      },
    },
  })

  let initialCapital = 10000
  if (backtestAccount) {
    const totalPnl = backtestAccount.trades.reduce((sum, t) => sum + Number(t.netPnl || 0), 0)
    initialCapital = Number(backtestAccount.initialBalance ?? 10000) + totalPnl
  }

  return (
    <div className="backtest-root">
      <div className="backtest-header">
        <div className="backtest-header-title">
          <span className="backtest-header-dot" />
          Replay Backtest
          <span className="backtest-header-tag">SIMULATEUR</span>
        </div>
        <p className="backtest-header-sub">
          Rejouez l&apos;historique bougie par bougie, simulez des trades et enregistrez-les dans votre journal.
        </p>
      </div>
      <ReplayWorkbench
        key={initialSymbol}
        initialSymbol={initialSymbol}
        pastSessions={pastSessions}
        timezone={timezone}
        initialCapital={initialCapital}
      />
    </div>
  )
}