// components/dashboard/KpiGrid.tsx
// KPI Cards — Server Component qui lit les métriques depuis l'API

import { computeMetrics } from "@/lib/metrics"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { resolveAccountScope } from "@/lib/active-account"
import { formatCurrency } from "@/lib/formatters"
import type { Trade } from "@prisma/client"
import { getTranslations } from "next-intl/server"

import { Activity, Target, Lightbulb, TrendingUp, AlertTriangle, List } from "lucide-react"

// ... existing code in KpiGrid ...
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
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", width: "100%", marginBottom: "1.5rem" }}>
        <EmptyKpiCard label={t("netPnl")} icon={<Activity size={16} />} noDataLabel={t("noData")} />
        <EmptyKpiCard label={t("winRate")} icon={<Target size={16} />} noDataLabel={t("noData")} />
        <EmptyKpiCard label={t("expectancy")} icon={<Lightbulb size={16} />} noDataLabel={t("noData")} />
        <EmptyKpiCard label={t("profitFactor")} icon={<TrendingUp size={16} />} noDataLabel={t("noData")} />
        <EmptyKpiCard label={t("maxDrawdown")} icon={<AlertTriangle size={16} />} noDataLabel={t("noData")} />
        <EmptyKpiCard label={t("totalTrades")} icon={<List size={16} />} noDataLabel={t("noData")} />
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
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", width: "100%", marginBottom: "1.5rem" }}>
      <KpiCard
        label={t("netPnl")}
        value={formatCurrency(metrics.netPnl, currency)}
        sub={t("closedTrades", { count: trades.length })}
        type={metrics.netPnl >= 0 ? "profit" : "loss"}
        id="kpi-net-pnl"
        icon={<Activity size={16} />}
        size="large"
      />
      <KpiCard
        label={t("winRate")}
        value={`${(metrics.winRate * 100).toFixed(1)}%`}
        sub={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
        type={metrics.winRate >= 0.5 ? "profit" : "loss"}
        id="kpi-win-rate"
        icon={<Target size={16} />}
      />
      <KpiCard
        label={t("expectancy")}
        value={formatCurrency(metrics.expectancy, currency)}
        sub={t("perTrade")}
        type={metrics.expectancy >= 0 ? "profit" : "loss"}
        id="kpi-expectancy"
        icon={<Lightbulb size={16} />}
      />
      <KpiCard
        label={t("profitFactor")}
        value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
        sub={t("grossProfit", { amount: formatCurrency(metrics.grossProfit, currency) })}
        type={metrics.profitFactor >= 1 ? "profit" : "loss"}
        id="kpi-profit-factor"
        icon={<TrendingUp size={16} />}
      />
      <KpiCard
        label={t("maxDrawdown")}
        value={`${metrics.maxDrawdownPct.toFixed(1)}%`}
        sub={formatCurrency(metrics.maxDrawdown, currency)}
        type={metrics.maxDrawdownPct > 10 ? "loss" : "neutral"}
        id="kpi-max-drawdown"
        icon={<AlertTriangle size={16} />}
      />
      <KpiCard
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

// ─── KPI Card Component ───────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, type = "neutral", id, icon, size = "normal"
}: {
  label: string
  value: string
  sub?: string
  type?: "profit" | "loss" | "neutral"
  id: string
  icon?: React.ReactNode
  size?: "normal" | "large"
}) {
  const color = type === "profit" ? "var(--color-profit)" : type === "loss" ? "var(--color-loss)" : "var(--color-gray-100)"
  
  return (
    <div className="chart-card" id={id} style={{ padding: "1.1rem 1.25rem", flex: "1 1 180px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.35rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: size === "large" ? "1.6rem" : "1.2rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

function EmptyKpiCard({ label, icon, noDataLabel = "No data yet" }: { label: string, icon?: React.ReactNode, noDataLabel?: string }) {
  return (
    <div className="chart-card" style={{ padding: "1.1rem 1.25rem", flex: "1 1 180px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.35rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-gray-700)", fontVariantNumeric: "tabular-nums" }}>—</div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 500 }}>{noDataLabel}</div>
    </div>
  )
}
