import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChallengesManager } from "./ChallengesManager"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Prop Challenges",
}

export default async function ChallengesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch accounts (serialize decimals)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true }
  })
  if (!user) return null

  const accounts = user.accounts.map(acc => ({
    ...acc,
    initialBalance: acc.initialBalance ? Number(acc.initialBalance) : null
  }))

  // Fetch templates
  const rawTemplates = await prisma.propFirmTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ firmName: 'asc' }, { programName: 'asc' }]
  })
  
  const templates = rawTemplates.map(t => ({
    ...t,
    dailyDDPct: t.dailyDDPct ? Number(t.dailyDDPct) : null,
    maxDDPct: Number(t.maxDDPct),
    profitTargetPhase1Pct: t.profitTargetPhase1Pct ? Number(t.profitTargetPhase1Pct) : null,
    profitTargetPhase2Pct: t.profitTargetPhase2Pct ? Number(t.profitTargetPhase2Pct) : null,
    consistencyRulePct: t.consistencyRulePct ? Number(t.consistencyRulePct) : null,
  }))

  // Fetch user's challenges
  const rawChallenges = await prisma.propChallenge.findMany({
    where: { userId: session.user.id },
    include: { template: true, account: true },
    orderBy: { createdAt: 'desc' }
  })

  const challenges = rawChallenges.map(c => ({
    ...c,
    initialBalance: Number(c.initialBalance),
    dailyDDPct: Number(c.dailyDDPct),
    maxDDPct: Number(c.maxDDPct),
    profitTargetPct: Number(c.profitTargetPct),
    currentBalance: Number(c.currentBalance || 0),
    currentEquity: Number(c.currentEquity || 0),
    highestBalance: Number(c.highestBalance || 0),
    highestEquity: Number(c.highestEquity || 0),
    todayStartBalance: Number(c.todayStartBalance || 0),
    metadata: c.metadata ? JSON.parse(JSON.stringify(c.metadata)) : null,
    template: {
      ...c.template,
      dailyDDPct: c.template.dailyDDPct ? Number(c.template.dailyDDPct) : null,
      maxDDPct: Number(c.template.maxDDPct),
      profitTargetPhase1Pct: c.template.profitTargetPhase1Pct ? Number(c.template.profitTargetPhase1Pct) : null,
      profitTargetPhase2Pct: c.template.profitTargetPhase2Pct ? Number(c.template.profitTargetPhase2Pct) : null,
      consistencyRulePct: c.template.consistencyRulePct ? Number(c.template.consistencyRulePct) : null,
    },
    account: {
      ...c.account,
      initialBalance: c.account.initialBalance ? Number(c.account.initialBalance) : null
    }
  }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Prop Firm Challenges</h1>
          <p className="page-subtitle">Track your drawdown limits and profit targets.</p>
        </div>
      </div>
      <ChallengesManager accounts={accounts} templates={templates} challenges={challenges} />
    </div>
  )
}
