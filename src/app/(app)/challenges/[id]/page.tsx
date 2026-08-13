import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChallengeDetailPage } from "@/components/prop-firm/ChallengeDetailPage"
import { notFound, redirect } from "next/navigation"

export const metadata = {
  title: "Challenge Details",
}

export default async function ChallengeDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  const raw = await prisma.propChallenge.findUnique({
    where: { id },
    include: { template: true, account: true, events: { orderBy: { createdAt: 'desc' } } }
  })

  if (!raw || raw.userId !== session.user.id) {
    notFound()
  }

  const challenge = {
    ...raw,
    initialBalance: Number(raw.initialBalance),
    dailyDDPct: Number(raw.dailyDDPct),
    maxDDPct: Number(raw.maxDDPct),
    profitTargetPct: Number(raw.profitTargetPct),
    currentBalance: Number(raw.currentBalance || 0),
    currentEquity: Number(raw.currentEquity || 0),
    highestBalance: Number(raw.highestBalance || 0),
    highestEquity: Number(raw.highestEquity || 0),
    todayStartBalance: Number(raw.todayStartBalance || 0),
    cost: raw.cost ? Number(raw.cost) : null,
    startedAt: raw.startedAt.toISOString(),
    deadlineAt: raw.deadlineAt ? raw.deadlineAt.toISOString() : null,
    metadata: raw.metadata ? JSON.parse(JSON.stringify(raw.metadata)) : null,
    events: raw.events.map(e => ({
      id: e.id,
      eventType: e.eventType,
      severity: e.severity,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
    template: {
      ...raw.template,
      logoUrl: raw.template.logoUrl || null,
      dailyDDPct: raw.template.dailyDDPct ? Number(raw.template.dailyDDPct) : null,
      maxDDPct: Number(raw.template.maxDDPct),
      profitTargetPhase1Pct: raw.template.profitTargetPhase1Pct ? Number(raw.template.profitTargetPhase1Pct) : null,
      profitTargetPhase2Pct: raw.template.profitTargetPhase2Pct ? Number(raw.template.profitTargetPhase2Pct) : null,
      consistencyRulePct: raw.template.consistencyRulePct ? Number(raw.template.consistencyRulePct) : null,
    },
    account: {
      ...raw.account,
      initialBalance: raw.account.initialBalance ? Number(raw.account.initialBalance) : null,
      fxRateToUsd: raw.account.fxRateToUsd ? Number(raw.account.fxRateToUsd) : 1,
    }
  }

  const rawTemplates = await prisma.propFirmTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ firmName: 'asc' }, { programName: 'asc' }]
  })
  const templates = rawTemplates.map(t => ({
    ...t,
    logoUrl: t.logoUrl || null,
    dailyDDPct: t.dailyDDPct ? Number(t.dailyDDPct) : null,
    maxDDPct: Number(t.maxDDPct),
    profitTargetPhase1Pct: t.profitTargetPhase1Pct ? Number(t.profitTargetPhase1Pct) : null,
    profitTargetPhase2Pct: t.profitTargetPhase2Pct ? Number(t.profitTargetPhase2Pct) : null,
    consistencyRulePct: t.consistencyRulePct ? Number(t.consistencyRulePct) : null,
  }))

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true }
  })
  const accounts = (user?.accounts || []).map(acc => ({
    ...acc,
    initialBalance: acc.initialBalance ? Number(acc.initialBalance) : null,
    fxRateToUsd: acc.fxRateToUsd ? Number(acc.fxRateToUsd) : 1,
  }))

  return (
    <div>
      <ChallengeDetailPage challenge={challenge} templates={templates} accounts={accounts} />
    </div>
  )
}
