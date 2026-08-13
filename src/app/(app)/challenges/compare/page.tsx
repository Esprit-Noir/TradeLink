import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChallengeCompare } from "@/components/prop-firm/ChallengeCompare"

export const metadata = {
  title: "Compare Challenges",
}

export default async function ComparePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const challenges = await prisma.propChallenge.findMany({
    where: { userId: session.user.id },
    include: {
      template: { select: { firmName: true, logoUrl: true } },
      account: { select: { name: true } },
      dailySnapshots: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  })

  const data = challenges.map(c => {
    const initial = Number(c.initialBalance)
    const current = Number(c.currentBalance ?? initial)
    const profitTarget = initial * (Number(c.profitTargetPct) / 100)
    const currentProfitPct = initial > 0 ? ((current - initial) / initial) * 100 : 0
    const targetProgressPct = profitTarget > 0 ? Math.min(100, ((current - initial) / profitTarget) * 100) : 0
    const maxDdRef = initial
    const ddBudget = maxDdRef * (Number(c.maxDDPct) / 100)
    const ddUsedPct = ddBudget > 0 ? ((maxDdRef - current) / ddBudget) * 100 : 0
    const tradingDays = Number(((c.metadata as any)?.tradingDaysCount) ?? 0)
    const daysRemaining = c.deadlineAt
      ? Math.max(0, Math.ceil((c.deadlineAt.getTime() - Date.now()) / 86400000))
      : null
    const lastSnapshot = c.dailySnapshots[0] ?? null

    return {
      id: c.id,
      firmName: c.template.firmName,
      logoUrl: c.template.logoUrl,
      accountName: c.account.name,
      phase: c.phase,
      status: c.status,
      initialBalance: initial,
      currentBalance: current,
      currentProfitPct: Math.round(currentProfitPct * 100) / 100,
      targetProgressPct: Math.round(Math.max(-100, Math.min(100, targetProgressPct)) * 100) / 100,
      maxDDPct: Number(c.maxDDPct),
      ddUsedPct: Math.round(Math.min(100, Math.max(0, ddUsedPct)) * 100) / 100,
      tradingDays,
      minTradingDays: c.minTradingDays,
      maxTradingDays: c.maxTradingDays,
      daysRemaining,
      lastSnapshotDate: lastSnapshot ? lastSnapshot.date.toISOString().slice(0, 10) : null,
      lastDailyPnl: lastSnapshot ? Number(lastSnapshot.dailyPnl) : null,
    }
  })

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Compare Challenges</h1>
          <p className="page-subtitle">Select challenges to compare them side by side.</p>
        </div>
      </div>
      <ChallengeCompare challenges={data} />
    </div>
  )
}
