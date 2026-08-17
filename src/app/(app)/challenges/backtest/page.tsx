import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BacktestRunner } from "@/components/prop-firm/BacktestRunner"

export const metadata = {
  title: "Prop Backtest",
}

export default async function BacktestPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [templates, accounts] = await Promise.all([
    prisma.propFirmTemplate.findMany({
      where: { isActive: true },
      orderBy: { firmName: "asc" },
    }),
    prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    }),
  ])

  const templateData = templates.map(t => ({
    id: t.id,
    firmName: t.firmName,
    programName: t.programName,
    drawdownType: t.drawdownType,
    dailyDDPct: Number(t.dailyDDPct ?? 5),
    maxDDPct: Number(t.maxDDPct),
    profitTargetPct: Number(t.profitTargetPhase1Pct ?? 10),
    minTradingDays: t.minTradingDays ?? 0,
    maxTradingDays: t.maxTradingDays,
    consistencyRulePct: Number(t.consistencyRulePct ?? 0),
    dailyResetTimezone: t.dailyResetTimezone,
  }))

  const accountData = accounts.map(a => ({ id: a.id, name: a.name }))

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Prop Backtest</h1>
          <p className="page-subtitle">Simulate challenge rules against your trade history to see if you would have passed.</p>
        </div>
      </div>
      <BacktestRunner templates={templateData} accounts={accountData} />
    </div>
  )
}
