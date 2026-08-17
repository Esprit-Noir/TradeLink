// components/dashboard/KpiGrid.tsx
// KPI Cards — Server Component qui lit les métriques depuis l'API

import { computeMetrics } from "@/lib/metrics"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { resolveAccountScope } from "@/lib/active-account"
import { formatCurrency } from "@/lib/formatters"
import type { Trade } from "@prisma/client"

export async function KpiGrid({
  dateRange,
  accountId,
}: {
  dateRange?: { from?: Date; to?: Date }
  accountId?: string | null | "all"
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  // Récupérer les trades du compte (sélectionné, consolidé, ou par défaut)
  const scope = await resolveAccountScope(session.user.id, accountId)

  if (scope.accounts.length === 0) {
    return (
      <div className="kpi-grid">
        <EmptyKpiCard label="Net P&L" />
        <EmptyKpiCard label="Win Rate" />
        <EmptyKpiCard label="Expectancy" />
        <EmptyKpiCard label="Profit Factor" />
        <EmptyKpiCard label="Max Drawdown" />
        <EmptyKpiCard label="Total Trades" />
      </div>
    )
  }

  const whereClause: any = scope.all
    ? { userId: session.user.id, status: "closed" }
    : { accountId: scope.accounts[0].id, status: "closed" }
  if (dateRange?.from || dateRange?.to) {
    whereClause.entryAt = {}
    if (dateRange.from) whereClause.entryAt.gte = dateRange.from
    if (dateRange.to) whereClause.entryAt.lte = dateRange.to
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    select: {
      status: true,
      netPnl: true,
      riskAmount: true,
      entryAt: true,
      exitAt: true,
      setupTags: true,
    },
    orderBy: { entryAt: "desc" },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  })

  const metrics = computeMetrics(trades as Trade[], scope.baseBalance, user?.timezone ?? "UTC")
  const currency = scope.currency

  return (
    <div className="kpi-grid">
      <KpiCard
        label="Net P&L"
        value={formatCurrency(metrics.netPnl, currency)}
        sub={`${trades.length} closed trades`}
        type={metrics.netPnl >= 0 ? "profit" : "loss"}
        id="kpi-net-pnl"
      />
      <KpiCard
        label="Win Rate"
        value={`${(metrics.winRate * 100).toFixed(1)}%`}
        sub={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
        type={metrics.winRate >= 0.5 ? "profit" : "loss"}
        id="kpi-win-rate"
      />
      <KpiCard
        label="Expectancy"
        value={formatCurrency(metrics.expectancy, currency)}
        sub="Per trade"
        type={metrics.expectancy >= 0 ? "profit" : "loss"}
        id="kpi-expectancy"
      />
      <KpiCard
        label="Profit Factor"
        value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
        sub={`${formatCurrency(metrics.grossProfit, currency)} gross profit`}
        type={metrics.profitFactor >= 1 ? "profit" : "loss"}
        id="kpi-profit-factor"
      />
      <KpiCard
        label="Max Drawdown"
        value={`${metrics.maxDrawdownPct.toFixed(1)}%`}
        sub={formatCurrency(metrics.maxDrawdown, currency)}
        type={metrics.maxDrawdownPct > 10 ? "loss" : "neutral"}
        id="kpi-max-drawdown"
      />
      <KpiCard
        label="Total Trades"
        value={`${trades.length}`}
        sub={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
        type="neutral"
        id="kpi-total-trades"
      />
    </div>
  )
}

// ─── KPI Card Component ───────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, type = "neutral", id,
}: {
  label: string
  value: string
  sub?: string
  type?: "profit" | "loss" | "neutral"
  id: string
}) {
  return (
    <div className="kpi-card" id={id}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${type !== "neutral" ? type : ""}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function EmptyKpiCard({ label }: { label: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: "var(--color-gray-700)" }}>—</div>
      <div className="kpi-sub">No data yet</div>
    </div>
  )
}
