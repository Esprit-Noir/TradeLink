// components/dashboard/KpiGrid.tsx
// KPI Cards — Server Component qui lit les métriques depuis l'API

import { computeMetrics } from "@/lib/metrics"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { resolveAccountScope } from "@/lib/active-account"
import { formatCurrency } from "@/lib/formatters"
import type { Trade, Prisma } from "@prisma/client"
import { getTranslations } from "next-intl/server"

import { Activity, Target, Lightbulb, TrendingUp, AlertTriangle, List } from "lucide-react"
import { AnimatedKpiCard, AnimatedEmptyKpiCard } from "./AnimatedKpiCard"
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

  const t = await getTranslations("KpiGrid")

  if (scope.accounts.length === 0) {
    return (
    <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", width: "100%", marginBottom: "1.5rem" }}>
        <AnimatedEmptyKpiCard label={t("netPnl")} icon={<Activity size={16} />} noDataLabel={t("noData")} />
        <AnimatedEmptyKpiCard label={t("winRate")} icon={<Target size={16} />} noDataLabel={t("noData")} />
        <AnimatedEmptyKpiCard label={t("expectancy")} icon={<Lightbulb size={16} />} noDataLabel={t("noData")} />
        <AnimatedEmptyKpiCard label={t("profitFactor")} icon={<TrendingUp size={16} />} noDataLabel={t("noData")} />
        <AnimatedEmptyKpiCard label={t("maxDrawdown")} icon={<AlertTriangle size={16} />} noDataLabel={t("noData")} />
        <AnimatedEmptyKpiCard label={t("totalTrades")} icon={<List size={16} />} noDataLabel={t("noData")} />
      </div>
    )
  }

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
    <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", width: "100%", marginBottom: "1.5rem" }}>
      <AnimatedKpiCard
        label={t("netPnl")}
        value={formatCurrency(metrics.netPnl, currency)}
        sub={t("closedTrades", { count: trades.length })}
        type={metrics.netPnl >= 0 ? "profit" : "loss"}
        id="kpi-net-pnl"
        icon={<Activity size={16} />}
        size="large"
      />
      <AnimatedKpiCard
        label={t("winRate")}
        value={`${(metrics.winRate * 100).toFixed(1)}%`}
        sub={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
        type={metrics.winRate >= 0.5 ? "profit" : "loss"}
        id="kpi-win-rate"
        icon={<Target size={16} />}
      />
      <AnimatedKpiCard
        label={t("expectancy")}
        value={formatCurrency(metrics.expectancy, currency)}
        sub={t("perTrade")}
        type={metrics.expectancy >= 0 ? "profit" : "loss"}
        id="kpi-expectancy"
        icon={<Lightbulb size={16} />}
      />
      <AnimatedKpiCard
        label={t("profitFactor")}
        value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
        sub={t("grossProfit", { amount: formatCurrency(metrics.grossProfit, currency) })}
        type={metrics.profitFactor >= 1 ? "profit" : "loss"}
        id="kpi-profit-factor"
        icon={<TrendingUp size={16} />}
      />
      <AnimatedKpiCard
        label={t("maxDrawdown")}
        value={`${metrics.maxDrawdownPct.toFixed(1)}%`}
        sub={formatCurrency(metrics.maxDrawdown, currency)}
        type={metrics.maxDrawdownPct > 10 ? "loss" : "neutral"}
        id="kpi-max-drawdown"
        icon={<AlertTriangle size={16} />}
      />
      <AnimatedKpiCard
        label={t("totalTrades")}
        value={`${trades.length}`}
        sub={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
        type="neutral"
        id="kpi-total-trades"
        icon={<List size={16} />}
      />
    </div>
  )
}
